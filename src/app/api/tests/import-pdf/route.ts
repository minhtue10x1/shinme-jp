import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { getAdminAuth, getAdminDb, isFirebaseAdminConfigured } from "@/lib/firebase-admin";
import type { MondaiType, TestQuestion } from "@/lib/test-center-store";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_PDF_BYTES = 15 * 1024 * 1024;

// Cache discovered active models for 10 minutes per serverless instance
let cachedModels: { names: string[]; fetchedAt: number } | null = null;
const MODEL_CACHE_TTL_MS = 10 * 60 * 1000;

async function resolveActiveModels(ai: GoogleGenAI): Promise<string[]> {
  const customPrimary = process.env.GEMINI_MODEL?.trim();
  const now = Date.now();

  if (cachedModels && now - cachedModels.fetchedAt < MODEL_CACHE_TTL_MS) {
    return customPrimary
      ? Array.from(new Set([customPrimary, ...cachedModels.names]))
      : cachedModels.names;
  }

  const discovered: string[] = [];
  try {
    const pager = await ai.models.list();
    for await (const m of pager) {
      const rawName = (m.name || "").replace(/^models\//, "");
      if (!rawName.startsWith("gemini-")) continue;
      // Skip non-text/non-PDF specialized models (embeddings, image-only, tts, live, robotics, etc.)
      if (/(embed|imagen|veo|tts|audio|live|aqa|bisociat|robotics|computer-use|learnlm)/i.test(rawName)) {
        continue;
      }
      // Skip deprecated 1.x / 2.0 / 2.5 flash models that return 404 for new users
      if (/^gemini-(1\.|2\.0|2\.5-flash)/i.test(rawName)) {
        continue;
      }
      const actions = (m as { supportedActions?: string[] }).supportedActions;
      if (Array.isArray(actions) && actions.length > 0 && !actions.includes("generateContent")) {
        continue;
      }
      discovered.push(rawName);
    }
  } catch (err) {
    console.warn("[api/tests/import-pdf] ListModels failed, using defaults:", err);
  }

  // Sort preferred models first: flash-lite -> flash -> pro (newest versions first)
  const scoreModel = (name: string): number => {
    let score = 0;
    if (name.includes("flash-lite")) score += 30;
    else if (name.includes("flash")) score += 25;
    else if (name.includes("pro")) score += 15;
    if (name.includes("3.8")) score += 10;
    else if (name.includes("3.5")) score += 9;
    else if (name.includes("3.0") || name.includes("3-")) score += 8;
    else if (name.includes("2.5")) score += 5;
    if (name.includes("exp") || name.includes("preview")) score -= 3;
    return score;
  };

  discovered.sort((a, b) => scoreModel(b) - scoreModel(a));

  const fallbackDefaults = [
    "gemini-3.5-flash-lite",
    "gemini-3.8-flash",
    "gemini-2.5-pro",
  ];

  const finalList = Array.from(
    new Set([
      ...(customPrimary ? [customPrimary] : []),
      ...(discovered.length > 0 ? discovered.slice(0, 5) : fallbackDefaults),
    ])
  );

  cachedModels = { names: finalList, fetchedAt: now };
  return finalList;
}

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    suggestedTitle: {
      type: Type.STRING,
      description: "Concise Vietnamese exam title inferred from the PDF header",
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
          },
          mondaiLabel: { type: Type.STRING },
          instruction: { type: Type.STRING },
          prompt: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          grammarPoint: { type: Type.STRING },
          starPrefix: { type: Type.STRING },
          starSuffix: { type: Type.STRING },
          starSlotIndex: { type: Type.INTEGER },
          passageGroupId: { type: Type.STRING },
          passageTitle: { type: Type.STRING },
          passageText: { type: Type.STRING },
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
    const chunkLabel = String(formData.get("chunkLabel") || "").trim();
    const includeChoukai = String(formData.get("includeChoukai") || "false") === "true";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Vui lòng chọn một tệp PDF hợp lệ." }, { status: 400 });
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Chỉ hỗ trợ định dạng tệp PDF (.pdf)." }, { status: 400 });
    }

    if (file.size === 0 || file.size > MAX_PDF_BYTES) {
      return NextResponse.json({ error: "Dung lượng tệp PDF phải nhỏ hơn 15MB." }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64Pdf = Buffer.from(arrayBuffer).toString("base64");

    // 3. Dynamically discover active Gemini models for this API key
    const ai = new GoogleGenAI({ apiKey });
    const modelCandidates = await resolveActiveModels(ai);

    const systemPrompt = [
      "You are an expert Japanese JLPT exam digitizer for a Japanese language center (Shinme).",
      "Extract ALL multiple-choice exam questions accurately from the attached JLPT PDF pages (may be scanned paper, 2-column layout, or digital print).",
      "",
      "CRITICAL EXTRACTION RULES:",
      "1. Preserve Japanese text (Kanji, Hiragana, Katakana) faithfully without translating the Japanese question or choices.",
      "2. For underlined words in Vocabulary/Kanji questions (問題1, 問題2, etc.), wrap the underlined target word in 【...】, e.g. '【毎日】学校へ行きます。'.",
      "3. For fill-in-the-blank questions, use '＿＿＿' for the blank.",
      "4. For ★ star-ordering questions (文の組み立て / ___ ___ ★ ___): set type='star', put text before the 4 slots in starPrefix, text after the 4 slots in starSuffix, set starSlotIndex (0..3, usually 2), and put the 4 fragments in options.",
      "5. For Reading Comprehension (読解 / Dokkai): set type='dokkai'. If multiple questions share the same passage, give them the exact same passageGroupId (e.g. 'dokkai-1') and include the full passageText and passageTitle.",
      includeChoukai
        ? "6. Include Listening (聴解 / Choukai) questions with type='choukai' if present."
        : "6. SKIP Listening (聴解 / Choukai) sections if present.",
      "7. Every question MUST have exactly 4 choices in `options`. Strip leading choice numbers like '1 ', '1.', 'A.', '①'.",
      "8. If a page is ONLY a cover page, instructions page, or answer sheet with NO multiple-choice questions, return an empty `questions: []` array.",
      "9. Do NOT invent answers or explanations.",
      levelHint ? `10. Exam level hint: JLPT ${levelHint}.` : "",
      chunkLabel ? `11. Current PDF slice: ${chunkLabel}.` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const filePart = {
      inlineData: {
        mimeType: "application/pdf",
        data: base64Pdf,
      },
    };

    let response: Awaited<ReturnType<typeof ai.models.generateContent>> | null = null;
    const attemptLogs: string[] = [];
    let usedModel = modelCandidates[0] || "gemini-3.5-flash-lite";

    for (const candidateModel of modelCandidates) {
      try {
        response = await ai.models.generateContent({
          model: candidateModel,
          contents: [
            {
              role: "user",
              parts: [
                filePart,
                {
                  text: "Hãy bóc tách toàn bộ câu hỏi trắc nghiệm JLPT có trong các trang PDF đính kèm theo đúng JSON schema.",
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
        attemptLogs.push(`${candidateModel}: ${msg.slice(0, 120)}`);
        console.warn(`[api/tests/import-pdf] ${candidateModel} failed:`, msg.slice(0, 200));

        // Brief pause before trying next discovered model
        await new Promise((r) => setTimeout(r, 800));
      }
    }

    if (!response) {
      const summary = attemptLogs.join(" | ");
      const isOverloaded =
        summary.includes("503") || summary.includes("UNAVAILABLE") || summary.includes("high demand");
      return NextResponse.json(
        {
          error: isOverloaded
            ? `Toàn bộ các model Gemini đang bận (503). Đã thử: ${modelCandidates.join(", ")}. Vui lòng thử lại sau ít phút.`
            : `Không thể bóc đề qua Gemini (${modelCandidates.join(", ")}): ${summary}`,
        },
        { status: isOverloaded ? 503 : 500 }
      );
    }

    console.info(`[api/tests/import-pdf] Parsed ${chunkLabel || "PDF"} with ${usedModel}`);

    const rawText = response.text?.trim();
    if (!rawText) {
      return NextResponse.json({
        suggestedTitle: "",
        suggestedTitleJa: "",
        questions: [],
        count: 0,
        usedModel,
      });
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
        { error: "Kết quả AI trả về không đúng định dạng JSON. Vui lòng thử lại." },
        { status: 502 }
      );
    }

    const rawQuestions = Array.isArray(parsed.questions) ? parsed.questions : [];
    const batchId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`;
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
        points: 5,
        instruction: (q.instruction || "").trim(),
        prompt: (q.prompt || "").trim(),
        options: fixedOptions,
        correctIndex: -1,
        explanation: "",
        grammarPoint: (q.grammarPoint || (levelHint ? `JLPT ${levelHint}` : "JLPT")).trim(),
      };

      if (qType === "star") {
        base.starPrefix = (q.starPrefix || "").trim();
        base.starSuffix = (q.starSuffix || "").trim();
        const slotIdx =
          typeof q.starSlotIndex === "number" && q.starSlotIndex >= 0 && q.starSlotIndex <= 3
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
      usedModel,
    });
  } catch (err) {
    console.error("[api/tests/import-pdf] Error:", err);
    const message = err instanceof Error ? err.message : "Unexpected server error while reading PDF.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
