import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { getAdminAuth, getAdminDb, isFirebaseAdminConfigured } from "@/lib/firebase-admin";
import type { MondaiType, TestQuestion } from "@/lib/test-center-store";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_PDF_BYTES = 15 * 1024 * 1024; // 15MB safety cap

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    suggestedTitle: {
      type: Type.STRING,
      description: "Concise Vietnamese exam title inferred from the PDF header, e.g. 'Đề thi thử JLPT N3 — Từ vựng & Ngữ pháp'",
    },
    suggestedTitleJa: {
      type: Type.STRING,
      description: "Concise Japanese exam title from the PDF header",
    },
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: {
            type: Type.STRING,
            enum: ["standard", "star", "dokkai", "choukai"],
            description: "Question format: standard (Kanji/Vocab/Grammar), star (★ ordering), dokkai (reading passage), choukai (listening)",
          },
          mondaiLabel: {
            type: Type.STRING,
            description: "Mondai header label, e.g. '問題1・漢字読み', '問題2・表記', '問題3・文脈規定', '問題4・文法', '問題5・★並べ替え', '問題6・読解'",
          },
          instruction: {
            type: Type.STRING,
            description: "Short instruction for this question or Mondai (in Japanese or Vietnamese)",
          },
          prompt: {
            type: Type.STRING,
            description: "The question text in Japanese. Wrap underlined target words in 【...】, e.g. '【毎日】学校へ行きます。'. Keep blanks as ＿＿＿.",
          },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Exactly 4 answer choices (1, 2, 3, 4 mapped to A, B, C, D) without leading numbers like '1.' or 'A.'",
          },
          grammarPoint: {
            type: Type.STRING,
            description: "Short skill/topic tag, e.g. 'Kanji N3', 'Từ vựng N3', 'Ngữ pháp N3', 'Đọc hiểu trung văn'",
          },
          starPrefix: {
            type: Type.STRING,
            description: "For type='star' only: text before the 4 slots",
          },
          starSuffix: {
            type: Type.STRING,
            description: "For type='star' only: text after the 4 slots",
          },
          starSlotIndex: {
            type: Type.INTEGER,
            description: "For type='star' only: 0-based index (0..3) of the ★ slot (usually 2 for ___ ___ ★ ___)",
          },
          passageGroupId: {
            type: Type.STRING,
            description: "For type='dokkai' only: shared group ID (e.g. 'dokkai-1') for questions belonging to the same reading passage",
          },
          passageTitle: {
            type: Type.STRING,
            description: "For type='dokkai' only: title or label of the reading passage",
          },
          passageText: {
            type: Type.STRING,
            description: "For type='dokkai' only: full Japanese reading passage text",
          },
        },
        required: ["type", "mondaiLabel", "prompt", "options", "grammarPoint"],
      },
    },
  },
  required: ["questions"],
};

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        {
          error: "Chưa cấu hình GEMINI_API_KEY trên máy chủ (Vercel / .env.local).",
          code: "GEMINI_NOT_CONFIGURED",
        },
        { status: 503 }
      );
    }

    // 1. Verify Sensei/Admin authentication via Firebase Admin SDK
    if (isFirebaseAdminConfigured()) {
      const adminAuth = getAdminAuth();
      const adminDb = getAdminDb();
      if (!adminAuth || !adminDb) {
        return NextResponse.json({ error: "Firebase Admin unavailable." }, { status: 503 });
      }

      const authHeader = request.headers.get("authorization") || "";
      const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
      if (!token) {
        return NextResponse.json({ error: "Unauthorized: Missing authentication token." }, { status: 401 });
      }

      let uid: string;
      try {
        const decoded = await adminAuth.verifyIdToken(token);
        uid = decoded.uid;
      } catch {
        return NextResponse.json({ error: "Unauthorized: Invalid or expired token." }, { status: 401 });
      }

      const userSnap = await adminDb.collection("users").doc(uid).get();
      const role = userSnap.exists ? (userSnap.data()?.role as string | undefined) : undefined;
      if (role !== "sensei" && role !== "admin") {
        return NextResponse.json(
          { error: "Forbidden: Chỉ Sensei hoặc Admin mới được sử dụng tính năng nhập đề PDF." },
          { status: 403 }
        );
      }
    }

    // 2. Parse multipart/form-data
    const formData = await request.formData();
    const file = formData.get("file");
    const levelHint = String(formData.get("level") || "").trim();
    const pageRange = String(formData.get("pageRange") || "").trim();
    const includeChoukai = String(formData.get("includeChoukai") || "false") === "true";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Vui lòng chọn một tệp PDF hợp lệ." }, { status: 400 });
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Chỉ hỗ trợ định dạng tệp PDF (.pdf)." }, { status: 400 });
    }

    if (file.size === 0 || file.size > MAX_PDF_BYTES) {
      return NextResponse.json(
        { error: "Dung lượng tệp PDF phải nhỏ hơn 15MB." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64Pdf = Buffer.from(arrayBuffer).toString("base64");

    // 3. Call Gemini 2.5 Flash with native PDF input & strict JSON schema
    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = [
      "You are an expert Japanese JLPT exam digitizer for a Japanese language center (Shinme).",
      "Extract ALL multiple-choice exam questions accurately from the attached JLPT PDF (which may be scanned paper, 2-column layout, or digital print).",
      "",
      "CRITICAL EXTRACTION RULES:",
      "1. Preserve Japanese text (Kanji, Hiragana, Katakana) faithfully without translating the Japanese question or choices.",
      "2. For underlined words in Vocabulary/Kanji questions (問題1, 問題2, etc.), wrap the underlined target word in Japanese lenticular brackets 【...】, e.g. '【毎日】学校へ行きます。'.",
      "3. For fill-in-the-blank questions, use '＿＿＿' for the blank.",
      "4. For ★ star-ordering questions (文の組み立て / ___ ___ ★ ___): set type='star', put text before the 4 slots in starPrefix, text after the 4 slots in starSuffix, set starSlotIndex (0..3, usually 2 for the 3rd slot), and put the 4 fragments in options.",
      "5. For Reading Comprehension (読解 / Dokkai): set type='dokkai'. If multiple questions share the same passage, give them the exact same passageGroupId (e.g. 'dokkai-1') and include the full passageText and passageTitle.",
      includeChoukai
        ? "6. Include Listening (聴解 / Choukai) questions with type='choukai' if present in the PDF."
        : "6. SKIP Listening (聴解 / Choukai) sections if present, because PDFs do not contain audio files.",
      "7. Every question MUST have exactly 4 choices in `options`. Strip leading choice numbers like '1 ', '1.', 'A.', '①' from each option string.",
      "8. Do NOT invent answers or explanations. Only extract the questions and choices as printed in the PDF.",
      "9. If a question references a printed image/chart/table in the PDF, add a short note like '[Xem hình ở trang PDF]' in `instruction`.",
      levelHint ? `10. Exam level hint from teacher: JLPT ${levelHint}.` : "",
      pageRange ? `11. ONLY extract questions from pages: ${pageRange}. Ignore other pages.` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const primaryModel = process.env.GEMINI_MODEL?.trim() || "gemini-3.5-flash-lite";
    // Only use current Gemini 3.x models (no deprecated 2.x models)
    const fallbackChain = Array.from(
      new Set([
        primaryModel,
        "gemini-3.5-flash-lite",
        "gemini-3.8-flash",
        "gemini-3.8-pro",
      ])
    );

    const isRetryableError = (err: unknown): boolean => {
      const msg = err instanceof Error ? err.message : String(err);
      return (
        msg.includes("503") ||
        msg.includes("UNAVAILABLE") ||
        msg.includes("429") ||
        msg.includes("RESOURCE_EXHAUSTED") ||
        msg.includes("high demand") ||
        msg.includes("404") ||
        msg.includes("NOT_FOUND")
      );
    };

    // Upload PDF via Gemini Files API (more reliable & faster than huge inline base64 payloads)
    let uploadedFileName: string | null = null;
    let filePart:
      | { fileData: { fileUri: string; mimeType: string } }
      | { inlineData: { mimeType: string; data: string } };

    try {
      const uploaded = await ai.files.upload({
        file: new Blob([arrayBuffer], { type: "application/pdf" }),
        config: { mimeType: "application/pdf" },
      });
      if (uploaded.uri && uploaded.name) {
        uploadedFileName = uploaded.name;
        filePart = {
          fileData: {
            fileUri: uploaded.uri,
            mimeType: "application/pdf",
          },
        };
      } else {
        filePart = { inlineData: { mimeType: "application/pdf", data: base64Pdf } };
      }
    } catch (uploadErr) {
      console.warn("[api/tests/import-pdf] Files API upload failed, falling back to inlineData:", uploadErr);
      filePart = { inlineData: { mimeType: "application/pdf", data: base64Pdf } };
    }

    let response: Awaited<ReturnType<typeof ai.models.generateContent>> | null = null;
    const attemptLogs: string[] = [];
    let usedModel = primaryModel;

    try {
      for (const candidateModel of fallbackChain) {
        try {
          response = await ai.models.generateContent({
            model: candidateModel,
            contents: [
              {
                role: "user",
                parts: [
                  filePart,
                  {
                    text: "Hãy bóc tách toàn bộ câu hỏi trắc nghiệm từ đề thi JLPT trong file PDF này theo đúng JSON schema đã quy định.",
                  },
                ],
              },
            ],
            config: {
              systemInstruction: systemPrompt,
              responseMimeType: "application/json",
              responseSchema: RESPONSE_SCHEMA,
              temperature: 0.1,
            },
          });
          usedModel = candidateModel;
          break;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          attemptLogs.push(`${candidateModel}: ${msg.slice(0, 160)}`);
          console.warn(`[api/tests/import-pdf] ${candidateModel} failed:`, msg.slice(0, 200));

          if (!isRetryableError(err) && !msg.includes("400") && !msg.includes("INVALID_ARGUMENT")) {
            throw err;
          }
        }
      }
    } finally {
      // Always clean up temporary uploaded PDF from Google Files API
      if (uploadedFileName) {
        ai.files.delete({ name: uploadedFileName }).catch(() => undefined);
      }
    }

    if (!response) {
      const summary = attemptLogs.join(" | ");
      const isOverloaded =
        summary.includes("503") || summary.includes("UNAVAILABLE") || summary.includes("high demand");
      return NextResponse.json(
        {
          error: isOverloaded
            ? `Các model Gemini 3.x đang quá tải tạm thời (503). Vui lòng thử lại sau vài giây. (${summary})`
            : `Không thể bóc đề qua Gemini 3.x: ${summary}`,
        },
        { status: isOverloaded ? 503 : 500 }
      );
    }

    console.info(`[api/tests/import-pdf] Successfully parsed PDF using model: ${usedModel}`);

    const rawText = response.text?.trim();
    if (!rawText) {
      return NextResponse.json(
        { error: "AI không trích xuất được nội dung nào từ file PDF này." },
        { status: 422 }
      );
    }

    let parsed: {
      suggestedTitle?: string;
      suggestedTitleJa?: string;
      questions?: Array<{
        type?: string;
        mondaiLabel?: string;
        instruction?: string;
        prompt?: string;
        options?: string[];
        grammarPoint?: string;
        starPrefix?: string;
        starSuffix?: string;
        starSlotIndex?: number;
        passageGroupId?: string;
        passageTitle?: string;
        passageText?: string;
      }>;
    };

    try {
      parsed = JSON.parse(rawText);
    } catch {
      return NextResponse.json(
        { error: "Kết quả AI trả về không đúng định dạng JSON. Vui lòng thử lại hoặc chia nhỏ số trang PDF." },
        { status: 502 }
      );
    }

    const rawQuestions = Array.isArray(parsed.questions) ? parsed.questions : [];
    if (rawQuestions.length === 0) {
      return NextResponse.json(
        { error: "Không tìm thấy câu hỏi trắc nghiệm JLPT nào trong file PDF này." },
        { status: 422 }
      );
    }

    const batchId = Date.now().toString(36);
    const defaultPts = rawQuestions.length <= 20 ? 5 : Math.max(1, Math.round(100 / rawQuestions.length));

    const validTypes: MondaiType[] = ["standard", "star", "dokkai", "choukai"];

    const normalizedQuestions: TestQuestion[] = rawQuestions.map((q, idx) => {
      const qType: MondaiType = validTypes.includes(q.type as MondaiType)
        ? (q.type as MondaiType)
        : "standard";

      const opts = Array.isArray(q.options) ? q.options.map((o) => String(o || "").trim()) : [];
      while (opts.length < 4) opts.push("");
      const fixedOptions: [string, string, string, string] = [
        opts[0] || "",
        opts[1] || "",
        opts[2] || "",
        opts[3] || "",
      ];

      const base: TestQuestion = {
        id: `q-pdf-${batchId}-${idx + 1}`,
        type: qType,
        mondaiLabel: (q.mondaiLabel || `問題${idx + 1}`).trim(),
        points: defaultPts,
        instruction: (q.instruction || "").trim(),
        prompt: (q.prompt || "").trim(),
        options: fixedOptions,
        // Intentionally left unselected (-1) so Sensei manually reviews & selects the answer key
        correctIndex: -1,
        explanation: "",
        grammarPoint: (q.grammarPoint || (levelHint ? `JLPT ${levelHint}` : "JLPT")).trim(),
      };

      if (qType === "star") {
        base.starPrefix = (q.starPrefix || "").trim();
        base.starSuffix = (q.starSuffix || "").trim();
        const slotIdx = typeof q.starSlotIndex === "number" && q.starSlotIndex >= 0 && q.starSlotIndex <= 3
          ? q.starSlotIndex
          : 2;
        base.starSlotIndex = slotIdx;
      }

      if (qType === "dokkai") {
        base.passageGroupId = (q.passageGroupId || `dokkai-${batchId}-${idx + 1}`).trim();
        base.passageTitle = (q.passageTitle || "読解 (Bài đọc hiểu)").trim();
        base.passageText = (q.passageText || "").trim();
      }

      if (qType === "choukai") {
        base.audioTitle = "Choukai Audio (Sensei đính kèm sau)";
        base.audioPlayLimit = 2;
      }

      return base;
    });

    return NextResponse.json({
      suggestedTitle: parsed.suggestedTitle?.trim() || "",
      suggestedTitleJa: parsed.suggestedTitleJa?.trim() || "",
      questions: normalizedQuestions,
      count: normalizedQuestions.length,
    });
  } catch (err) {
    console.error("[api/tests/import-pdf] Error:", err);
    const message = err instanceof Error ? err.message : "Unexpected server error while reading PDF.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
