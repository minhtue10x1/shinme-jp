"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Sparkles,
  BookOpen,
  Star,
  Headphones,
  FileText,
  Shuffle,
  CheckCircle2,
  Save,
  Eye,
  HelpCircle,
  CopyPlus,
  FileUp,
  AlertTriangle,
  Filter,
  Image as ImageIcon,
  Loader2,
  X,
  ClipboardList,
} from "lucide-react";
import { toast } from "sonner";
import { FuriganaText } from "@/components/furigana-text";
import { PdfImportDialog } from "@/components/portal/pdf-import-dialog";
import { BatchAnswerDialog } from "@/components/portal/batch-answer-dialog";
import { useTranslation } from "@/lib/i18n/context";
import {
  getClasses,
  getTestById,
  getTestAnswerKey,
  saveTestDoc,
  uploadExamPosterImage,
} from "@/lib/db/services";
import { compressPosterImage } from "@/lib/image-utils";
import type { ClassDoc } from "@/lib/db/schema";
import {
  saveTest,
  EXAM_SECTION_META,
  buildQuestionNumberMap,
  inferQuestionSection,
  type ExamSectionId,
  type MondaiType,
  type AudioPlayLimit,
  type TestQuestion,
  type JLPTTest,
} from "@/lib/test-center-store";

const MONDAI_META: Record<
  MondaiType,
  {
    label: string;
    shortLabel: string;
    defaultHeader: string;
    badgeClass: string;
    description: string;
  }
> = {
  standard: {
    label: "Trắc nghiệm chuẩn (Goi / Kanji / Bunpou)",
    shortLabel: "Trắc nghiệm chuẩn",
    defaultHeader: "問題1・文字語彙・文法 (Trắc nghiệm chuẩn)",
    badgeClass: "bg-emerald-50 text-[#135E36] border-emerald-200",
    description: "Câu hỏi đơn 4 đáp án A, B, C, D cho Từ vựng, Hán tự hoặc Ngữ pháp.",
  },
  star: {
    label: "Bài tập dấu sao ★ (Sắp xếp câu JLPT)",
    shortLabel: "Dấu sao ★",
    defaultHeader: "問題3・星の並び替え (Bài tập dấu sao ★)",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
    description: "Câu có 4 ô trống ___ ___ ★ ___ và 4 mảnh ghép từ vựng để học viên chọn từ ở vị trí ★.",
  },
  dokkai: {
    label: "Đọc hiểu (Dokkai - Passage Group)",
    shortLabel: "Đọc hiểu Dokkai",
    defaultHeader: "問題4・読解 (Đọc hiểu đoạn văn)",
    badgeClass: "bg-sky-50 text-sky-800 border-sky-200",
    description: "Đoạn văn tiếng Nhật hiển thị bên trái/trên đi kèm 1 hoặc nhiều câu hỏi con bên phải/dưới.",
  },
  choukai: {
    label: "Nghe hiểu (Choukai - Audio Question)",
    shortLabel: "Nghe hiểu Choukai",
    defaultHeader: "問題5・聴解 (Nghe hiểu Choukai)",
    badgeClass: "bg-purple-50 text-purple-800 border-purple-200",
    description: "Đính kèm file nghe MP3 với cấu hình giới hạn số lần nghe (1 lần / 2 lần / Không giới hạn).",
  },
};

function createTemplateQuestion(
  type: MondaiType,
  index: number,
  sharedPassage?: { groupId: string; title: string; text: string; imageUrl?: string },
  uniqueSuffix?: string
): TestQuestion {
  const id = `q-custom-${type}-${index}${uniqueSuffix ? `-${uniqueSuffix}` : ""}`;
  if (type === "star") {
    return {
      id,
      type: "star",
      mondaiLabel: MONDAI_META.star.defaultHeader,
      points: 15,
      instruction: "Sắp xếp 4 mảnh ghép vào 4 chỗ trống và chọn từ đứng ở vị trí ★.",
      prompt: "Hoàn thành câu tiếng Nhật theo đúng ngữ pháp:",
      starPrefix: "日本[にほん]へ",
      starSuffix: "なりました。",
      starSlotIndex: 2,
      options: ["来[き]てから", "自炊[じすい]する", "ように", "毎日[まいにち]"],
      correctIndex: 1,
      starCorrectOrder: [0, 3, 1, 2],
      grammarPoint: "Cấu trúc ～てから / ～ようになる (Thay đổi thói quen)",
      explanation:
        "Thứ tự đúng: 日本[にほん]へ 【来[き]てから】 【毎日[まいにち]】 【★ 自炊[じすい]する】 【ように】 なりました。(Từ khi đến Nhật tôi đã bắt đầu tự nấu ăn mỗi ngày). Vị trí ★ là 「自炊[じすい]する」.",
    };
  }
  if (type === "dokkai") {
    const groupId = sharedPassage?.groupId ?? `passage-group-${index}`;
    return {
      id,
      type: "dokkai",
      mondaiLabel: MONDAI_META.dokkai.defaultHeader,
      points: 20,
      passageGroupId: groupId,
      passageTitle:
        sharedPassage?.title ??
        "社内[しゃない]メール：リモートワーク 申請[しんせい]について (Thông báo đăng ký làm việc từ xa)",
      passageText:
        sharedPassage?.text ??
        "社員[しゃいん]の 皆[みな]さんへ\n\n来月[らいげつ]から、週[しゅう]に 2日[ふつか]まで リモートワーク（在宅勤務[ざいたくきんむ]）が できるように なります。希望[きぼう]する 人[ひと]は、前週[ぜんしゅう]の 金曜日[きんようび] 17時[じ]までに 課長[かちょう]に メールで 申請[しんせい]して ください。",
      ...(sharedPassage?.imageUrl ? { passageImageUrl: sharedPassage.imageUrl } : {}),
      instruction: "Đọc đoạn văn bên trái và chọn đáp án đúng nhất:",
      prompt: "リモートワークを したい 人[ひと]は、いつまでに 何[なに]を しなければ なりませんか。",
      options: [
        "前週[ぜんしゅう]の 金曜日[きんようび] 17時[じ]までに 課長[かちょう]へ メールする。",
        "当日[とうじつ]の 朝[あさ] 9時[じ]までに 社長[しゃちょう]へ 電話[でんわ]する。",
        "来月[らいげつ]の 1日[ついたち]までに 書類[しょるい]を 提出[ていしゅつ]する。",
        "週[しゅう]に 2回[かい] 会社[かいしゃ]へ 行[い]く。",
      ],
      correctIndex: 0,
      grammarPoint: "Đọc hiểu thông báo công ty: Hạn chót (～までに)",
      explanation:
        "Trong email ghi rõ: 「希望[きぼう]する 人[ひと]は、前週[ぜんしゅう]の 金曜日[きんようび] 17時[じ]までに 課長[かちょう]に メールで 申請[しんせい]して ください」.",
    };
  }
  if (type === "choukai") {
    return {
      id,
      type: "choukai",
      mondaiLabel: MONDAI_META.choukai.defaultHeader,
      points: 20,
      instruction: "Nghe hội thoại và chọn việc học viên cần chuẩn bị cho buổi học tới.",
      prompt: "学生[がくせい]は 次[つぎ]の 授業[じゅぎょう]までに 何[なに]を しますか。",
      audioTitle: "Choukai_N3_Renraku_01.mp3 (Dặn dò cuối giờ của Sensei)",
      audioDurationSec: 24,
      audioPlayLimit: 2,
      audioScript: [
        {
          speaker: "先生[せんせい] (Sensei)",
          textJa: "皆[みな]さん、今日[きょう]は 第26課[だいにじゅうろっか]の 文法[ぶんぽう]が 終[お]わりましたね。宿題[しゅくだい]は プリント 2枚[まい]です。単語[たんご]の 小[しょう]テストは 来週[らいしゅう]に 変更[へんこう]します。",
          textVi: "Các em, hôm nay chúng ta đã học xong ngữ pháp bài 26. Bài tập về nhà là 2 tờ phiếu bài tập nhé. Bài kiểm tra nhỏ từ vựng sẽ dời sang tuần sau.",
        },
      ],
      options: [
        "宿題[しゅくだい]の プリントを 2枚[まい] やってくる。",
        "明日[あした]の 単語[たんご]テストの 準備[じゅんび]を する。",
        "第27課[だいにじゅうななか]の 録音[ろくおん]を 送[おく]る。",
        "何[なに]も しなくて いい。",
      ],
      correctIndex: 0,
      grammarPoint: "Nghe hiểu dặn dò trên lớp (宿題・変更)",
      explanation:
        "Sensei thông báo bài tập về nhà là 2 tờ phiếu (宿題はプリント2枚です), còn bài kiểm tra từ vựng đã được dời sang tuần sau (来週に変更します).",
    };
  }
  return {
    id,
    type: "standard",
    mondaiLabel: MONDAI_META.standard.defaultHeader,
    points: 15,
    instruction: "Chọn đáp án đúng nhất điền vào chỗ trống.",
    prompt: "彼[かれ]は 忙[いそが]しい ＿＿＿、いつも 笑顔[えがお]で 手伝[てつだ]って くれる。",
    options: ["にもかかわらず", "おかげで", "ばかりに", "に決[き]まっている"],
    correctIndex: 0,
    grammarPoint: "Ngữ pháp N3 ～にもかかわらず (Mặc dù...)",
    explanation:
      "～にもかかわらず (Mặc dù bận rộn nhưng anh ấy lúc nào cũng tươi cười giúp đỡ). ～ばかりに mang nghĩa tiêu cực (chỉ vì...).",
  };
}

function SenseiTestCreateContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("editId");
  const isEditing = Boolean(editId);
  const { lang, tr } = useTranslation();
  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [isLoadingEdit, setIsLoadingEdit] = useState(Boolean(editId));

  useEffect(() => {
    getClasses().then((res) => {
      if (res && res.length > 0) {
        setClasses(res);
        if (!editId) setClassId(res[0].id);
      }
    }).catch(console.error);
  }, [editId]);

  // Test Metadata State
  const [title, setTitle] = useState(
    "Kiểm tra Tổng hợp N3 — Ngữ pháp & Đọc Nghe Chuyên sâu"
  );
  const [titleJa, setTitleJa] = useState(
    "N3 実力[じつりょく] 確認[かくにん]テスト"
  );
  const [code, setCode] = useState("N3-TEST-03");
  const [classId, setClassId] = useState("cls-n3-246");
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [deadline, setDeadline] = useState("2026-11-22T23:59");
  const [maxAttempts, setMaxAttempts] = useState(2);
  const [passScore, setPassScore] = useState(60);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);

  // Questions State — pre-populated with 4 questions (1 of each Mondai type) so Sensei can inspect or save right away
  const [questions, setQuestions] = useState<TestQuestion[]>(() => [
    createTemplateQuestion("standard", 1),
    createTemplateQuestion("star", 2),
    createTemplateQuestion("dokkai", 3),
    createTemplateQuestion("choukai", 4),
  ]);
  const [isPdfImportOpen, setIsPdfImportOpen] = useState(false);
  const [isBatchAnswerOpen, setIsBatchAnswerOpen] = useState(false);
  const [showUnansweredOnly, setShowUnansweredOnly] = useState(false);
  const [activeSectionTab, setActiveSectionTab] = useState<"ALL" | ExamSectionId>("ALL");
  const [uploadingPosterQid, setUploadingPosterQid] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const questionNumberMap = buildQuestionNumberMap(questions);

  const handleApplyBatchAnswers = (updates: Record<string, number>) => {
    const count = Object.keys(updates).length;
    if (count === 0) return;
    setQuestions((prev) =>
      prev.map((q) => (updates[q.id] !== undefined ? { ...q, correctIndex: updates[q.id] } : q))
    );
    toast.success(
      tr(
        `Đã áp dụng nhanh ${count} đáp án (1–4) thành công!`,
        `Applied ${count} answer keys (1–4) successfully!`,
        `正解（1〜4）を${count}問に一括適用しました！`
      )
    );
  };
  // Idempotency key + synchronous lock: guarantees rapid multi-clicks NEVER create duplicate tests
  const draftTestIdRef = useRef<string>(
    editId || `test-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
  );
  const isSavingRef = useRef(false);

  // Hydrate existing exam + answer keys when opened in Edit Mode (`?editId=...`)
  useEffect(() => {
    if (!editId) return;
    draftTestIdRef.current = editId;
    let cancelled = false;

    async function loadExistingExam() {
      try {
        setIsLoadingEdit(true);
        const [existingTest, existingKey] = await Promise.all([
          getTestById(editId!),
          getTestAnswerKey(editId!),
        ]);
        if (cancelled) return;
        if (!existingTest) {
          toast.error(tr("Không tìm thấy đề thi để chỉnh sửa.", "Exam not found for editing.", "編集対象の試験が見つかりません。"));
          return;
        }

        setTitle(existingTest.title || "");
        setTitleJa(existingTest.titleJa || "");
        setCode(existingTest.code || "");
        if (existingTest.classId) setClassId(existingTest.classId);
        setDurationMinutes(existingTest.durationMinutes || 25);
        setDeadline(existingTest.deadline || "2026-11-22T23:59");
        setMaxAttempts(existingTest.maxAttempts ?? 0);
        setPassScore(existingTest.passScore ?? 60);
        setShuffleQuestions(Boolean(existingTest.shuffleQuestions));

        const keyMap = existingKey?.answers || {};
        const hydratedQuestions: TestQuestion[] = (existingTest.questions || []).map((q) => {
          const entry = keyMap[q.id];
          if (!entry) return q;
          return {
            ...q,
            correctIndex: entry.correctIndex,
            explanation: entry.explanation || q.explanation || "",
            ...(entry.starCorrectOrder ? { starCorrectOrder: entry.starCorrectOrder } : {}),
            ...(entry.audioScript ? { audioScript: entry.audioScript } : {}),
          };
        });

        if (hydratedQuestions.length > 0) {
          setQuestions(hydratedQuestions);
        }
      } catch (err) {
        console.error("Failed to load exam for editing:", err);
        toast.error(tr("Lỗi khi tải đề thi để chỉnh sửa.", "Error loading exam for editing.", "試験の読み込み中にエラーが発生しました。"));
      } finally {
        if (!cancelled) setIsLoadingEdit(false);
      }
    }

    loadExistingExam();
    return () => {
      cancelled = true;
    };
  }, [editId, tr]);

  const handleUploadPoster = async (questionId: string, groupId: string | undefined, file: File) => {
    try {
      setUploadingPosterQid(questionId);
      const { blob, dataUrl } = await compressPosterImage(file, 1400, 0.86);

      let finalUrl = dataUrl;
      try {
        finalUrl = await uploadExamPosterImage(blob, file.name || "poster");
      } catch (storageErr) {
        console.warn("Firebase Storage poster upload unavailable, using compressed DataURL:", storageErr);
      }

      // Sync poster image across all Dokkai questions sharing the same passageGroupId
      setQuestions((prev) =>
        prev.map((item) => {
          if (item.id === questionId || (groupId && item.type === "dokkai" && item.passageGroupId === groupId)) {
            return { ...item, passageImageUrl: finalUrl };
          }
          return item;
        })
      );

      toast.success(
        tr(
          "Đã đính kèm ảnh áp phích cho bài Tìm kiếm thông tin!",
          "Poster image attached!",
          "情報検索ポスター画像を添付しました！"
        )
      );
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : tr("Không thể tải ảnh áp phích lên.", "Failed to upload poster image.", "ポスター画像のアップロードに失敗しました。")
      );
    } finally {
      setUploadingPosterQid(null);
    }
  };

  const handleRemovePoster = (questionId: string, groupId: string | undefined) => {
    setQuestions((prev) =>
      prev.map((item) => {
        if (item.id === questionId || (groupId && item.type === "dokkai" && item.passageGroupId === groupId)) {
          return { ...item, passageImageUrl: undefined };
        }
        return item;
      })
    );
  };

  const totalPoints = questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);
  const unansweredCount = questions.filter((q) => q.correctIndex < 0 || q.correctIndex > 3).length;
  const answeredCount = questions.length - unansweredCount;

  const handlePdfImported = (result: {
    questions: TestQuestion[];
    suggestedTitle?: string;
    suggestedTitleJa?: string;
    mode: "replace" | "append";
  }) => {
    if (result.mode === "replace") {
      setQuestions(result.questions);
      if (result.suggestedTitle) setTitle(result.suggestedTitle);
      if (result.suggestedTitleJa) setTitleJa(result.suggestedTitleJa);
    } else {
      setQuestions((prev) => [...prev, ...result.questions]);
    }
    setShowUnansweredOnly(false);
  };

  const handleAddQuestion = (
    type: MondaiType,
    sharedPassage?: { groupId: string; title: string; text: string; imageUrl?: string }
  ) => {
    const newQ = createTemplateQuestion(
      type,
      questions.length + 1,
      sharedPassage,
      Date.now().toString(36)
    );
    const defaultSection: ExamSectionId =
      type === "choukai"
        ? "choukai"
        : type === "dokkai" || type === "star"
          ? "bunpou_dokkai"
          : activeSectionTab !== "ALL"
            ? activeSectionTab
            : "goi";
    newQ.section = defaultSection;
    setQuestions((prev) => [...prev, newQ]);
    toast.success(
      tr(
        `Đã thêm câu hỏi ${MONDAI_META[type].shortLabel}`,
        `Added question ${MONDAI_META[type].shortLabel}`,
        `問題を追加しました: ${MONDAI_META[type].shortLabel}`
      )
    );
  };

  const handleUpdateQuestion = (id: string, patch: Partial<TestQuestion>) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        return { ...q, ...patch };
      })
    );
  };

  const handleUpdateOption = (id: string, optIndex: number, val: string) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        const nextOpts: [string, string, string, string] = [...q.options] as [
          string,
          string,
          string,
          string,
        ];
        nextOpts[optIndex] = val;
        return { ...q, options: nextOpts };
      })
    );
  };

  const handleDeleteQuestion = (id: string) => {
    if (questions.length <= 1) {
      toast.error(tr("Đề thi cần ít nhất 1 câu hỏi.", "Exam must have at least 1 question.", "試験には少なくとも1問必要です。"));
      return;
    }
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    toast.info(tr("Đã xóa câu hỏi khỏi đề thi.", "Removed question from exam.", "試験から問題を削除しました。"));
  };

  const handleSaveTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingRef.current) return;
    if (!title.trim()) {
      toast.error(tr("Vui lòng nhập tên bài kiểm tra.", "Please enter the exam title.", "試験タイトルを入力してください。"));
      return;
    }
    const targetClass =
      classes.find((c) => c.id === classId) ?? classes[0];

    if (!targetClass) {
      toast.error(tr("Vui lòng chọn lớp học hợp lệ.", "Please select a valid class.", "有効なクラスを選択してください。"));
      return;
    }

    // Ensure Sensei has manually reviewed and selected the correct answer for every question
    const missingNums = questions
      .map((q, i) => (q.correctIndex < 0 || q.correctIndex > 3 ? i + 1 : -1))
      .filter((n) => n !== -1);
    if (missingNums.length > 0) {
      setShowUnansweredOnly(true);
      toast.error(
        tr(
          `Còn ${missingNums.length} câu chưa chọn đáp án đúng!`,
          `${missingNums.length} questions still need a correct answer!`,
          `正解が未選択の問題が${missingNums.length}問あります！`
        ),
        {
          description: tr(
            `Vui lòng chọn đáp án A/B/C/D cho các câu: ${missingNums.slice(0, 12).join(", ")}${missingNums.length > 12 ? "..." : ""}`,
            `Please select A/B/C/D for questions: ${missingNums.slice(0, 12).join(", ")}${missingNums.length > 12 ? "..." : ""}`,
            `次の問題の正解（1〜4）を選択してください: ${missingNums.slice(0, 12).join(", ")}${missingNums.length > 12 ? "..." : ""}`
          ),
        }
      );
      return;
    }

    const newTest: JLPTTest = {
      id: draftTestIdRef.current,
      code: code.trim() || "N3-CUSTOM",
      title: title.trim(),
      titleJa: titleJa.trim() || "日本語[にほんご]テスト",
      classId: targetClass.id,
      className: targetClass.name,
      level: targetClass.level as any,
      durationMinutes: Number(durationMinutes) || 20,
      deadline,
      maxAttempts: Number(maxAttempts) || 0,
      passScore: Number(passScore) || 60,
      totalPoints,
      shuffleQuestions,
      createdBy: `${(targetClass as any).senseiName || (targetClass as any).sensei || "Sensei"}`,
      createdAt: new Date().toISOString().slice(0, 10),
      questions,
    };

    try {
      isSavingRef.current = true;
      setIsSaving(true);
      await saveTestDoc(newTest as any);
      saveTest(newTest);
      toast.success(tr("Đã xuất bản đề thi thành công!", "Exam published successfully!", "試験を公開しました！"), {
        description: tr(
          `Đề "${newTest.title}" (${questions.length} câu · ${totalPoints} điểm) đã được lưu vào ngân hàng đề cho lớp ${targetClass.shortName}.`,
          `Exam "${newTest.title}" (${questions.length} questions · ${totalPoints} pts) saved to bank for class ${targetClass.shortName}.`,
          `試験「${newTest.title}」（${questions.length}問・${totalPoints}点）をクラス ${targetClass.shortName} 用に保存しました。`
        ),
      });
      router.push("/portal/tests");
    } catch (err) {
      console.error("Save test error:", err);
      toast.error(tr("Lỗi khi lưu đề thi vào cơ sở dữ liệu.", "Error saving exam to database.", "データベースへの保存中にエラーが発生しました。"));
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {isLoadingEdit && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-[#135E36]">
          <Loader2 className="h-4 w-4 animate-spin" />
          {tr(
            "Đang tải nội dung & đáp án đề thi để chỉnh sửa...",
            "Loading exam & answer keys for editing...",
            "編集用の試験内容と正解を読み込んでいます..."
          )}
        </div>
      )}
      {/* Top Bar */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm lg:flex-row lg:items-center">
        <div className="space-y-1.5">
          <Link
            href="/portal/tests"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#135E36] hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {tr("Quay lại Trung tâm Khảo thí JLPT", "Back to JLPT Exam Hub", "JLPT試験センターに戻る")}
          </Link>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              {tr(
                "Sensei Test Builder — Soạn đề thi tiếng Nhật chuẩn JLPT",
                "Sensei Test Builder — Author Standard JLPT Exams",
                "先生用テスト作成 — JLPT準拠の日本語試験を作成"
              )}
            </h1>
            <span className="rounded-full bg-[#6CC24A]/20 px-3 py-0.5 text-xs font-bold text-[#135E36]">
              {tr(
                "Hỗ trợ Furigana 漢字[かんじ] trực tiếp",
                "Direct Furigana 漢字[かんじ] supported",
                "ルビ記法 漢字[かんじ] に直接対応"
              )}
            </span>
          </div>
          <p className="text-sm text-slate-600">
            {tr(
              "Cấu hình thông số bài thi, biên soạn 4 dạng Mondai đặc thù và viết giải thích ngữ pháp chi tiết cho học viên sau khi nộp bài.",
              "Configure test parameters, author 4 distinct Mondai question types, and write in-depth grammar explanations.",
              "試験設定の構成、4種類の問題形式の作成、提出後に表示される詳細な文法解説を記述できます。"
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsPdfImportOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-[#135E36]/30 bg-[#FAF8F2] px-4 py-2.5 text-xs font-extrabold text-[#135E36] shadow-xs transition hover:border-[#135E36] hover:bg-emerald-50"
          >
            <FileUp className="h-4 w-4 text-[#135E36]" />
            {tr("Nhập đề từ PDF (AI)", "Import from PDF (AI)", "PDFから取り込む (AI)")}
          </button>
          <Link
            href="/portal/tests/manage"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            {tr("Quản lý kho đề", "Manage Question Bank", "試験バンク管理")}
          </Link>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveTest}
            className="inline-flex items-center gap-2 rounded-xl bg-[#135E36] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#0f4a2a] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#6CC24A]" />
            ) : (
              <Save className="h-4 w-4 text-[#6CC24A]" />
            )}
            {isSaving
              ? tr("Đang xuất bản...", "Publishing...", "公開中...")
              : tr(
                `Xuất bản đề thi (${questions.length} câu · ${totalPoints}đ)`,
                `Publish Exam (${questions.length} items · ${totalPoints}pts)`,
                `試験を公開 (${questions.length}問・${totalPoints}点)`
              )}
          </button>
        </div>
      </div>

      {/* Furigana Syntax Helper Banner */}
      <div className="flex flex-col justify-between gap-3 rounded-2xl border border-[#135E36]/20 bg-[#FAF8F2] p-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#135E36] text-white">
            <Sparkles className="h-4 w-4 text-[#6CC24A]" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#135E36]">
              {tr("Mẹo nhập Furigana trực tiếp (`Live Furigana Input`)", "Live Furigana Input Tip", "ルビ（ふりがな）入力のヒント")}
            </p>
            <p className="text-xs text-slate-600">
              {lang === "vi" ? (
                <>
                  Gõ chữ Hán kèm cách đọc trong ngoặc vuông như{" "}
                  <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs font-bold text-[#135E36]">
                    日本語[にほんご]で未来[みらい]をひらく
                  </code>{" "}
                  để hệ thống tự động hiển thị{" "}
                  <span className="inline-block rounded bg-white px-2 py-0.5 font-jp text-slate-900">
                    <FuriganaText text="日本語[にほんご]で未来[みらい]をひらく" />
                  </span>{" "}
                  trên cả đề bài, đáp án và lời giải.
                </>
              ) : lang === "ja" ? (
                <>
                  漢字の後ろに角括弧で読み方を入力すると（例：{" "}
                  <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs font-bold text-[#135E36]">
                    日本語[にほんご]で未来[みらい]をひらく
                  </code>{" "}
                  ）、問題・選択肢・解説のすべてに{" "}
                  <span className="inline-block rounded bg-white px-2 py-0.5 font-jp text-slate-900">
                    <FuriganaText text="日本語[にほんご]で未来[みらい]をひらく" />
                  </span>{" "}
                  のように自動表示されます。
                </>
              ) : (
                <>
                  Type Kanji with reading in brackets like{" "}
                  <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs font-bold text-[#135E36]">
                    日本語[にほんご]で未来[みらい]をひらく
                  </code>{" "}
                  to automatically render{" "}
                  <span className="inline-block rounded bg-white px-2 py-0.5 font-jp text-slate-900">
                    <FuriganaText text="日本語[にほんご]で未来[みらい]をひらく" />
                  </span>{" "}
                  in questions, choices, and explanations.
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveTest} className="space-y-6">
        {/* SECTION 1: TEST METADATA */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                {tr("1. Thông tin cấu hình bài kiểm tra (Test Metadata)", "1. Test Metadata & Settings", "1. 試験の基本設定")}
              </h2>
              <p className="text-xs text-slate-500">
                {tr(
                  "Thiết lập lớp áp dụng, thời gian đếm ngược, hạn nộp và quy tắc chấm đạt.",
                  "Configure assigned class, timer, submission deadline, and pass criteria.",
                  "対象クラス、制限時間、提出期限、合格基準を設定します。"
                )}
              </p>
            </div>
            <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
              {tr("Tổng điểm tự động:", "Calculated Points:", "合計配点:")}{" "}
              <strong className="text-[#135E36]">{totalPoints} {tr("điểm", "pts", "点")}</strong>
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                {tr("Tên bài kiểm tra *", "Exam Title *", "試験タイトル *")}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={tr(
                  "VD: Kiểm tra Định kỳ N3 Đợt 1 — Tổng hợp 4 Mondai",
                  "e.g., N3 Periodic Exam 1 — Comprehensive 4 Mondai",
                  "例: N3 定期テスト 第1回 — 総合問題"
                )}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-[#135E36] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                {tr("Mã đề thi (Code)", "Exam Code", "試験コード")}
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={tr("VD: N3-MID-01", "e.g., N3-MID-01", "例: N3-MID-01")}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm font-bold text-slate-900 focus:border-[#135E36] focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                {tr(
                  "Tiêu đề tiếng Nhật (Hỗ trợ Furigana 漢字[かんじ])",
                  "Japanese Title (Furigana supported)",
                  "日本語タイトル（漢字[かんじ] ルビ対応）"
                )}
              </label>
              <input
                type="text"
                value={titleJa}
                onChange={(e) => setTitleJa(e.target.value)}
                placeholder={tr(
                  "VD: N3 第1回[だいいっかい] 実力[じつりょく]テスト",
                  "e.g., N3 第1回[だいいっかい] 実力[じつりょく]テスト",
                  "例: N3 第1回[だいいっかい] 実力[じつりょく]テスト"
                )}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-jp text-sm text-slate-900 focus:border-[#135E36] focus:outline-none"
              />
              {titleJa && (
                <div className="mt-1.5 flex items-center gap-2 rounded-lg bg-[#FAF8F2] px-3 py-1.5 text-xs text-slate-600">
                  <Eye className="h-3.5 w-3.5 text-[#135E36]" />
                  <span>{tr("Xem trước:", "Preview:", "プレビュー:")}</span>
                  <span className="font-jp text-sm font-bold text-[#135E36]">
                    <FuriganaText text={titleJa} />
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                {tr("Lớp áp dụng *", "Target Class *", "対象クラス *")}
              </label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-[#135E36] focus:outline-none"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.code} — {cls.shortName || cls.name} ({cls.level})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                {tr("Thời gian làm bài (Phút) *", "Duration (Minutes) *", "制限時間（分） *")}
              </label>
              <input
                type="number"
                min={5}
                max={180}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm font-bold text-slate-900 focus:border-[#135E36] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                {tr("Hạn chót nộp bài (Deadline) *", "Submission Deadline *", "提出期限 *")}
              </label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-[#135E36] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  {tr("Số lần làm tối đa", "Max Attempts Allowed", "受験回数上限")}
                </label>
                <select
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-[#135E36] focus:outline-none"
                >
                  <option value={1}>{tr("1 lần duy nhất", "1 attempt only", "1回のみ")}</option>
                  <option value={2}>{tr("Tối đa 2 lần", "Up to 2 attempts", "最大2回")}</option>
                  <option value={3}>{tr("Tối đa 3 lần", "Up to 3 attempts", "最大3回")}</option>
                  <option value={0}>{tr("Không giới hạn", "Unlimited", "無制限")}</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  {tr("Điểm đạt (Pass)", "Passing Score (Pass)", "合格点")}
                </label>
                <input
                  type="number"
                  min={10}
                  max={200}
                  value={passScore}
                  onChange={(e) => setPassScore(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-mono text-sm font-bold text-[#135E36] focus:border-[#135E36] focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Shuffle Questions Toggle */}
          <div className="mt-5 flex items-center justify-between rounded-xl border border-slate-200/80 bg-[#FAF8F2] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#135E36] shadow-xs">
                <Shuffle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">
                  {tr("Trộn câu hỏi ngẫu nhiên (Shuffle Questions)", "Randomize Question Order (Shuffle)", "問題順をシャッフル")}
                </p>
                <p className="text-xs text-slate-600">
                  {tr(
                    "Tự động đảo thứ tự các câu hỏi độc lập mỗi khi học viên bắt đầu lượt thi mới (giữ nguyên nhóm câu hỏi đọc hiểu Dokkai).",
                    "Randomize independent questions on each student attempt (preserves grouped Dokkai reading passages).",
                    "受験ごとに独立した問題の順序を自動で並べ替えます（読解グループは維持されます）。"
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={shuffleQuestions}
              onClick={() => setShuffleQuestions((v) => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${shuffleQuestions ? "bg-[#135E36]" : "bg-slate-300"
                }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${shuffleQuestions ? "translate-x-5" : "translate-x-0"
                  }`}
              />
            </button>
          </div>
        </section>

        {/* SECTION 2: MONDAI PALETTE BAR */}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">
                {tr("2. Thêm câu hỏi theo 4 định dạng Mondai chuẩn JLPT", "2. Add Questions (4 Standard JLPT Formats)", "2. JLPT標準4形式の問題を追加")}
              </h2>
              <p className="text-xs text-slate-500">
                {tr("Chọn loại câu hỏi bên dưới để chèn thêm vào cuối đề thi.", "Select question format below to append to this exam.", "下の形式を選んで試験の末尾に問題を追加します。")}
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {lang === "vi" ? (
                <>Đang có <strong className="text-slate-900">{questions.length}</strong> câu hỏi</>
              ) : lang === "ja" ? (
                <>現在 <strong className="text-slate-900">{questions.length}</strong> 問</>
              ) : (
                <>Currently <strong className="text-slate-900">{questions.length}</strong> questions</>
              )}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <button
              type="button"
              onClick={() => handleAddQuestion("standard")}
              className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5 text-left transition hover:bg-emerald-50"
            >
              <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-[#135E36]" />
              <div>
                <p className="text-xs font-extrabold text-[#135E36]">
                  {tr("+ Trắc nghiệm chuẩn", "+ Standard Choice", "+ 標準選択問題")}
                </p>
                <p className="mt-0.5 text-xs text-slate-600">
                  Goi / Kanji / Bunpou (A, B, C, D)
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleAddQuestion("star")}
              className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 text-left transition hover:bg-amber-50"
            >
              <Star className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="text-xs font-extrabold text-amber-900">
                  {tr("+ Bài tập dấu sao ★", "+ Star Exercise ★", "+ ★並び替え問題")}
                </p>
                <p className="mt-0.5 text-xs text-slate-600">
                  {tr("Sắp xếp 4 mảnh ghép ___ ___ ★ ___", "Arrange 4 fragments ___ ___ ★ ___", "4つの語句を並び替え ___ ___ ★ ___")}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleAddQuestion("dokkai")}
              className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50/60 p-3.5 text-left transition hover:bg-sky-50"
            >
              <FileText className="mt-0.5 h-5 w-5 shrink-0 text-sky-700" />
              <div>
                <p className="text-xs font-extrabold text-sky-900">
                  {tr("+ Đọc hiểu (Dokkai)", "+ Reading (Dokkai)", "+ 読解問題")}
                </p>
                <p className="mt-0.5 text-xs text-slate-600">
                  {tr("Đoạn văn dài + nhóm câu hỏi con", "Long passage + question group", "長文＋設問グループ")}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleAddQuestion("choukai")}
              className="flex items-start gap-3 rounded-xl border border-purple-200 bg-purple-50/60 p-3.5 text-left transition hover:bg-purple-50"
            >
              <Headphones className="mt-0.5 h-5 w-5 shrink-0 text-purple-700" />
              <div>
                <p className="text-xs font-extrabold text-purple-900">
                  {tr("+ Nghe hiểu (Choukai)", "+ Listening (Choukai)", "+ 聴解問題")}
                </p>
                <p className="mt-0.5 text-xs text-slate-600">
                  {tr("Đính kèm MP3 & giới hạn lượt nghe", "MP3 audio & playback limits", "MP3音声・再生回数制限")}
                </p>
              </div>
            </button>
          </div>
        </section>

        {/* ANSWER KEY REVIEW STATUS BAR */}
        {(unansweredCount > 0 || showUnansweredOnly) && (
          <div className="flex flex-col justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50/80 p-4 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div>
                <p className="text-xs font-extrabold text-amber-950">
                  {tr(
                    `Rà soát đáp án: Đã chọn ${answeredCount}/${questions.length} câu · Còn ${unansweredCount} câu chưa chọn đáp án đúng`,
                    `Answer Key Review: ${answeredCount}/${questions.length} selected · ${unansweredCount} remaining`,
                    `正解チェック：選択済み ${answeredCount}/${questions.length}問 · 未選択 ${unansweredCount}問`
                  )}
                </p>
                <p className="mt-0.5 text-xs text-amber-800">
                  {tr(
                    "Hãy kiểm tra nhanh nội dung đề đã bóc và tích chọn đáp án 1/2/3/4 (hoặc dùng nút Nhập đáp án nhanh) cho tất cả các câu trước khi xuất bản.",
                    "Review extracted questions and select the correct 1/2/3/4 answer for every question before publishing.",
                    "公開前に各問題の内容を確認し、正解（1/2/3/4）を選択してください。"
                  )}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowUnansweredOnly((prev) => !prev)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition ${showUnansweredOnly
                ? "border-amber-600 bg-amber-600 text-white"
                : "border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
                }`}
            >
              <Filter className="h-3.5 w-3.5" />
              {showUnansweredOnly
                ? tr("Hiện tất cả câu hỏi", "Show All Questions", "すべての問題を表示")
                : tr(`Chỉ hiện câu chưa chọn (${unansweredCount})`, `Unanswered Only (${unansweredCount})`, `未選択のみ表示 (${unansweredCount})`)}
            </button>
          </div>
        )}

        {/* SECTION 2B: JLPT EXAM SECTION TABS + BATCH ANSWER KEY BUTTON */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            {(["ALL", "goi", "bunpou_dokkai", "choukai"] as const).map((tab) => {
              const count =
                tab === "ALL"
                  ? questions.length
                  : questions.filter((q) => inferQuestionSection(q) === tab).length;
              const label =
                tab === "ALL"
                  ? tr("Tất cả phần thi", "All Sections", "全パート")
                  : EXAM_SECTION_META[tab].shortLabel;
              const active = activeSectionTab === tab;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveSectionTab(tab)}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-extrabold transition ${active
                    ? "border-[#135E36] bg-[#135E36] text-white"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-emerald-50"
                    }`}
                >
                  <span className="font-jp">{label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 font-mono text-xs ${active ? "bg-white/20 text-white" : "bg-white text-slate-600"
                      }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setIsBatchAnswerOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-extrabold text-[#135E36] shadow-2xs transition hover:bg-emerald-100"
          >
            <ClipboardList className="h-4 w-4" />
            {lang === "vi"
              ? "Nhập đáp án nhanh (Batch 1–4)"
              : lang === "ja"
                ? "正解を一括入力 (1〜4)"
                : "Batch Answer Key (1–4)"}
          </button>
        </div>

        {/* SECTION 3: QUESTION EDITORS */}
        <div className="space-y-5">
          {questions.map((q, idx) => {
            const qSection = inferQuestionSection(q);
            if (activeSectionTab !== "ALL" && qSection !== activeSectionTab) return null;
            const isMissingAnswer = q.correctIndex < 0 || q.correctIndex > 3;
            if (showUnansweredOnly && !isMissingAnswer) return null;

            const numMeta = questionNumberMap[q.id];
            const meta = MONDAI_META[q.type];
            const optionLetters = ["1", "2", "3", "4"];

            return (
              <div
                key={q.id}
                className={`rounded-2xl border p-6 shadow-sm ${isMissingAnswer
                  ? "border-amber-300 bg-amber-50/15"
                  : "border-slate-200/90 bg-white"
                  }`}
              >
                {/* Question Card Header */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="inline-flex h-7 items-center justify-center rounded-lg bg-[#135E36] px-2.5 font-mono text-xs font-bold text-white">
                      {EXAM_SECTION_META[qSection].labelJa} #{numMeta?.localNumber ?? idx + 1}
                    </span>
                    <select
                      value={qSection}
                      onChange={(e) =>
                        handleUpdateQuestion(q.id, { section: e.target.value as ExamSectionId })
                      }
                      className="rounded-lg border border-emerald-200 bg-emerald-50/70 px-2.5 py-1 text-xs font-bold text-[#135E36]"
                      title="Phần thi JLPT"
                    >
                      <option value="goi">1. 文字・語彙 (Goi)</option>
                      <option value="bunpou_dokkai">2. 文法・読解 (Bunpou・Dokkai)</option>
                      <option value="choukai">3. 聴解 (Choukai)</option>
                    </select>
                    <span
                      className={`rounded-full border px-3 py-0.5 text-xs font-bold ${meta.badgeClass}`}
                    >
                      {meta.label}
                    </span>
                    {isMissingAnswer && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900">
                        <AlertTriangle className="h-3 w-3" />
                        {tr("Chưa chọn đáp án", "Needs Answer", "正解未選択")}
                      </span>
                    )}

                    <select
                      value={q.type}
                      onChange={(e) => {
                        const nextType = e.target.value as MondaiType;
                        const tpl = createTemplateQuestion(nextType, idx + 1);
                        handleUpdateQuestion(q.id, {
                          type: nextType,
                          mondaiLabel: MONDAI_META[nextType].defaultHeader,
                          starPrefix: tpl.starPrefix,
                          starSuffix: tpl.starSuffix,
                          starSlotIndex: tpl.starSlotIndex,
                          passageGroupId: tpl.passageGroupId,
                          passageTitle: tpl.passageTitle,
                          passageText: tpl.passageText,
                          audioTitle: tpl.audioTitle,
                          audioPlayLimit: tpl.audioPlayLimit,
                        });
                      }}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700"
                    >
                      <option value="standard">{tr("Đổi sang: Trắc nghiệm chuẩn", "Change to: Standard Choice", "変更: 標準選択問題")}</option>
                      <option value="star">{tr("Đổi sang: Bài tập dấu sao ★", "Change to: Star Exercise ★", "変更: ★並び替え問題")}</option>
                      <option value="dokkai">{tr("Đổi sang: Đọc hiểu (Dokkai)", "Change to: Reading (Dokkai)", "変更: 読解問題")}</option>
                      <option value="choukai">{tr("Đổi sang: Nghe hiểu (Choukai)", "Change to: Listening (Choukai)", "変更: 聴解問題")}</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs font-bold text-slate-500">{tr("Điểm:", "Points:", "配点:")}</label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={q.points}
                        onChange={(e) =>
                          handleUpdateQuestion(q.id, { points: Number(e.target.value) })
                        }
                        className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-center font-mono text-xs font-bold text-[#135E36]"
                      />
                    </div>

                    {q.type === "dokkai" && (
                      <button
                        type="button"
                        onClick={() =>
                          handleAddQuestion("dokkai", {
                            groupId: q.passageGroupId || `passage-${idx}`,
                            title: q.passageTitle || "",
                            text: q.passageText || "",
                            imageUrl: q.passageImageUrl,
                          })
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-800 hover:bg-sky-100"
                      >
                        <CopyPlus className="h-3.5 w-3.5" />
                        {tr("+ Thêm câu hỏi con cùng bài đọc", "+ Add sub-question to passage", "+ 同じ長文に設問を追加")}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {tr("Xóa", "Delete", "削除")}
                    </button>
                  </div>
                </div>

                {/* Mondai Section Title & Grammar Tag */}
                <div className="mb-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-600">
                      {tr("Nhãn Mondai hiển thị", "Display Mondai Header", "表示用問題見出し")}
                    </label>
                    <input
                      type="text"
                      value={q.mondaiLabel}
                      onChange={(e) =>
                        handleUpdateQuestion(q.id, { mondaiLabel: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-600">
                      {tr(
                        "Chủ điểm Ngữ pháp / Kỹ năng (Dùng cho Thống kê câu hay sai)",
                        "Grammar Point / Skill Tag (For analytics)",
                        "文法項目・スキルタグ（分析用）"
                      )}
                    </label>
                    <input
                      type="text"
                      value={q.grammarPoint}
                      onChange={(e) =>
                        handleUpdateQuestion(q.id, { grammarPoint: e.target.value })
                      }
                      placeholder={tr(
                        "VD: Ngữ pháp N3 ～わりに / Trường âm Hán tự",
                        "e.g. N3 grammar ～わりに / Long vowel Kanji",
                        "例: N3文法 ～わりに / 漢字の長音"
                      )}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-[#135E36]"
                    />
                  </div>
                </div>

                {/* DOKKAI PASSAGE EDITOR */}
                {q.type === "dokkai" && (
                  <div className="mb-5 rounded-2xl border border-sky-200 bg-sky-50/40 p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-sky-900">
                        {tr(
                          "📖 Đoạn văn Đọc hiểu (Dokkai Passage — hiển thị cột bên trái khi thi)",
                          "📖 Reading Passage (Dokkai — shown in left column during exam)",
                          "📖 読解本文（試験中は左カラムに表示）"
                        )}
                      </span>
                      <span className="font-mono text-xs text-sky-700">
                        {tr(
                          `Mã nhóm bài đọc: ${q.passageGroupId || "passage-default"}`,
                          `Passage Group ID: ${q.passageGroupId || "passage-default"}`,
                          `読解グループID: ${q.passageGroupId || "passage-default"}`
                        )}
                      </span>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="space-y-3">
                        <div>
                          <label className="mb-1 block text-xs font-bold text-slate-700">
                            {tr(
                              "Tiêu đề bài đọc (Hỗ trợ 漢字[かんじ])",
                              "Passage Title (Kanji[reading] supported)",
                              "本文タイトル（漢字[かんじ] ルビ対応）"
                            )}
                          </label>
                          <input
                            type="text"
                            value={q.passageTitle || ""}
                            onChange={(e) =>
                              handleUpdateQuestion(q.id, { passageTitle: e.target.value })
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-jp text-xs text-slate-900"
                          />
                        </div>
                        {/* Poster / Flyer Image Uploader for 情報検索 */}
                        <div
                          tabIndex={0}
                          onPaste={(e) => {
                            const items = e.clipboardData?.items;
                            if (!items) return;
                            for (const item of Array.from(items)) {
                              if (item.type.startsWith("image/")) {
                                const pastedFile = item.getAsFile();
                                if (pastedFile) {
                                  e.preventDefault();
                                  handleUploadPoster(q.id, q.passageGroupId, pastedFile);
                                  break;
                                }
                              }
                            }
                          }}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const dropped = e.dataTransfer.files?.[0];
                            if (dropped && dropped.type.startsWith("image/")) {
                              handleUploadPoster(q.id, q.passageGroupId, dropped);
                            }
                          }}
                          className="rounded-xl border border-dashed border-sky-300 bg-white p-3 transition focus:border-[#135E36] focus:outline-none"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-900">
                              <ImageIcon className="h-3.5 w-3.5 text-sky-700" />
                              {tr(
                                "Ảnh áp phích / Bảng biểu (情報検索 — chọn file, kéo thả hoặc bấm vào đây rồi Ctrl+V)",
                                "Poster / Schedule Image (click, drop, or focus & Ctrl+V)",
                                "情報検索ポスター画像（ファイル選択・ドロップ・Ctrl+V対応）"
                              )}
                            </span>
                            <div className="flex items-center gap-2">
                              <label className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-800 hover:bg-sky-100">
                                {uploadingPosterQid === q.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <ImageIcon className="h-3.5 w-3.5" />
                                )}
                                {uploadingPosterQid === q.id
                                  ? tr("Đang tải...", "Uploading...", "アップロード中...")
                                  : q.passageImageUrl
                                    ? tr("Đổi ảnh", "Replace", "画像を変更")
                                    : tr("Chọn ảnh", "Upload Image", "画像を選択")}
                                <input
                                  type="file"
                                  accept="image/*"
                                  disabled={uploadingPosterQid === q.id}
                                  onChange={(e) => {
                                    const picked = e.target.files?.[0];
                                    e.target.value = "";
                                    if (picked) handleUploadPoster(q.id, q.passageGroupId, picked);
                                  }}
                                  className="hidden"
                                />
                              </label>
                              {q.passageImageUrl && (
                                <button
                                  type="button"
                                  onClick={() => handleRemovePoster(q.id, q.passageGroupId)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  {tr("Gỡ ảnh", "Remove", "削除")}
                                </button>
                              )}
                            </div>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">
                            {tr(
                              "Ảnh sẽ tự động đồng bộ cho mọi câu hỏi con dùng chung Mã nhóm bài đọc này.",
                              "Automatically synced across all sub-questions sharing this Passage Group ID.",
                              "同じ読解グループIDを持つすべての設問に自動で反映されます。"
                            )}
                          </p>
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-bold text-slate-700">
                            {tr(
                              "Nội dung đoạn văn tiếng Nhật (Hỗ trợ 漢字[かんじ] — có thể để trống nếu chỉ dùng ảnh áp phích)",
                              "Japanese Passage Text (optional if poster image is attached)",
                              "日本語本文（ポスター画像のみの場合は空欄可）"
                            )}
                          </label>
                          <textarea
                            rows={5}
                            value={q.passageText || ""}
                            onChange={(e) =>
                              handleUpdateQuestion(q.id, { passageText: e.target.value })
                            }
                            className="w-full rounded-xl border border-slate-200 bg-white p-3 font-jp text-xs leading-relaxed text-slate-900"
                          />
                        </div>
                      </div>

                      {/* Live Furigana & Poster Passage Preview */}
                      <div className="rounded-xl border border-sky-200/80 bg-[#FAF8F2] p-4">
                        <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#135E36]">
                          <Eye className="h-3.5 w-3.5" />
                          {lang === "vi" ? (
                            <>Xem trước hiển thị bài đọc <FuriganaText text="読解[どっかい]" />:</>
                          ) : lang === "ja" ? (
                            <>読解本文プレビュー <FuriganaText text="読解[どっかい]" />:</>
                          ) : (
                            <>Reading Passage Preview <FuriganaText text="読解[どっかい]" />:</>
                          )}
                        </div>
                        {q.passageTitle && (
                          <p className="mb-2 border-b border-slate-200 pb-1.5 font-jp text-sm font-bold text-slate-900">
                            <FuriganaText text={q.passageTitle} />
                          </p>
                        )}
                        {q.passageImageUrl && (
                          <div className="mb-3 overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={q.passageImageUrl}
                              alt={q.passageTitle || "JLPT Information Retrieval Poster"}
                              className="max-h-72 w-full rounded-lg object-contain"
                            />
                          </div>
                        )}
                        {q.passageText && (
                          <div className="whitespace-pre-line font-jp text-sm leading-loose text-slate-800">
                            <FuriganaText text={q.passageText} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* CHOUKAI AUDIO CONFIG EDITOR */}
                {q.type === "choukai" && (
                  <div className="mb-5 rounded-2xl border border-purple-200 bg-purple-50/40 p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-purple-900">
                        {tr("🎧 Cấu hình File Nghe Choukai (MP3 & Giới hạn lượt phát)", "🎧 Listening Audio Setup (MP3 & Playback Limits)", "🎧 聴解音声設定（MP3・再生回数制限）")}
                      </span>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-bold text-slate-700">
                          {tr("Tên file MP3 hoặc tiêu đề băng nghe", "MP3 audio filename or track title", "MP3ファイル名または音声タイトル")}
                        </label>
                        <input
                          type="text"
                          value={q.audioTitle || ""}
                          onChange={(e) =>
                            handleUpdateQuestion(q.id, { audioTitle: e.target.value })
                          }
                          placeholder={tr("VD: Choukai_N3_Mondai1_Track04.mp3", "e.g. Choukai_N3_Mondai1_Track04.mp3", "例: Choukai_N3_Mondai1_Track04.mp3")}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-bold text-purple-900">
                          {tr("Giới hạn số lần nghe *", "Playback Limits *", "再生回数制限 *")}
                        </label>
                        <select
                          value={q.audioPlayLimit ?? 2}
                          onChange={(e) =>
                            handleUpdateQuestion(q.id, {
                              audioPlayLimit: Number(e.target.value) as AudioPlayLimit,
                            })
                          }
                          className="w-full rounded-xl border border-purple-300 bg-white px-3 py-2 text-xs font-bold text-purple-900"
                        >
                          <option value={1}>{tr("Nghe 1 lần duy nhất (Chuẩn thi JLPT)", "Play once only (JLPT standard)", "1回のみ再生（JLPT準拠）")}</option>
                          <option value={2}>{tr("Giới hạn nghe 2 lần", "Play up to 2 times", "最大2回再生")}</option>
                          <option value={0}>{tr("Không giới hạn số lần nghe", "Unlimited playback", "再生回数無制限")}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* QUESTION PROMPT + LIVE FURIGANA PREVIEW */}
                <div className="mb-4 grid gap-4 lg:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">
                      {tr("Câu hỏi / Đề bài (Hỗ trợ cú pháp 漢字[かんじ]) *", "Question / Prompt (Furigana supported) *", "問題文（漢字[かんじ] ルビ対応） *")}
                    </label>
                    <textarea
                      rows={2}
                      value={q.prompt}
                      onChange={(e) =>
                        handleUpdateQuestion(q.id, { prompt: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white p-3 font-jp text-sm text-slate-900 focus:border-[#135E36] focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col justify-center rounded-xl border border-slate-200/80 bg-[#FAF8F2] p-3.5">
                    <span className="mb-1 flex items-center gap-1.5 text-xs font-bold text-[#135E36]">
                      <Eye className="h-3.5 w-3.5" />
                      {tr("Xem trước Furigana câu hỏi:", "Question Furigana Preview:", "問題文ルビプレビュー:")}
                    </span>
                    <div className="font-jp text-base font-bold leading-relaxed text-slate-900">
                      <FuriganaText text={q.prompt || tr("（Chưa nhập nội dung）", "（No content entered）", "（未入力）")} />
                    </div>
                  </div>
                </div>

                {/* STAR (★) SENTENCE BUILDER SPECIFIC FIELDS */}
                {q.type === "star" && (
                  <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
                    <p className="mb-3 text-xs font-extrabold text-amber-900">
                      {tr("★ Cấu hình khung câu 4 chỗ trống ___ ___ ★ ___", "★ Configure 4-slot sentence frame ___ ___ ★ ___", "★ 4空欄の文構成 ___ ___ ★ ___")}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-xs font-bold text-slate-700">
                          {tr("Vế đầu câu (Trước 4 ô trống)", "Prefix clause (Before 4 blanks)", "前半文（4空欄の前）")}
                        </label>
                        <input
                          type="text"
                          value={q.starPrefix || ""}
                          onChange={(e) =>
                            handleUpdateQuestion(q.id, { starPrefix: e.target.value })
                          }
                          placeholder={tr("VD: この 薬[くすり]を", "e.g. この 薬[くすり]を", "例: この 薬[くすり]を")}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-jp text-xs text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold text-slate-700">
                          {tr("Vị trí dấu sao ★ (Ô thứ mấy?)", "Star Position ★", "★の位置")}
                        </label>
                        <select
                          value={q.starSlotIndex ?? 2}
                          onChange={(e) =>
                            handleUpdateQuestion(q.id, {
                              starSlotIndex: Number(e.target.value),
                            })
                          }
                          className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-amber-900"
                        >
                          <option value={0}>{tr("Ô số 1: ★ ___ ___ ___", "Slot 1: ★ ___ ___ ___", "1番目: ★ ___ ___ ___")}</option>
                          <option value={1}>{tr("Ô số 2: ___ ★ ___ ___", "Slot 2: ___ ★ ___ ___", "2番目: ___ ★ ___ ___")}</option>
                          <option value={2}>{tr("Ô số 3: ___ ___ ★ ___ (Chuẩn JLPT)", "Slot 3: ___ ___ ★ ___ (JLPT standard)", "3番目: ___ ___ ★ ___（JLPT標準）")}</option>
                          <option value={3}>{tr("Ô số 4: ___ ___ ___ ★", "Slot 4: ___ ___ ___ ★", "4番目: ___ ___ ___ ★")}</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold text-slate-700">
                          {tr("Vế cuối câu (Sau 4 ô trống)", "Suffix clause (After 4 blanks)", "後半文（4空欄の後）")}
                        </label>
                        <input
                          type="text"
                          value={q.starSuffix || ""}
                          onChange={(e) =>
                            handleUpdateQuestion(q.id, { starSuffix: e.target.value })
                          }
                          placeholder={tr("VD: なりました。", "e.g. なりました。", "例: なりました。")}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-jp text-xs text-slate-900"
                        />
                      </div>
                    </div>

                    {/* Live Preview of the 4 Star Slots */}
                    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-white p-3 font-jp text-sm text-slate-900 shadow-2xs">
                      <span className="text-xs font-bold text-amber-800">{tr("Xem trước khung câu:", "Sentence frame preview:", "文枠プレビュー:")}</span>
                      <FuriganaText text={q.starPrefix || ""} />
                      {[0, 1, 2, 3].map((slotIdx) => {
                        const isStar = (q.starSlotIndex ?? 2) === slotIdx;
                        return (
                          <span
                            key={slotIdx}
                            className={`inline-flex min-w-16 items-center justify-center rounded-lg border-2 px-3 py-1 text-xs font-bold ${isStar
                              ? "border-amber-500 bg-amber-100 text-amber-900"
                              : "border-dashed border-slate-300 bg-slate-50 text-slate-400"
                              }`}
                          >
                            {isStar ? "★" : tr(`Ô ${slotIdx + 1}`, `Slot ${slotIdx + 1}`, `枠${slotIdx + 1}`)}
                          </span>
                        );
                      })}
                      <FuriganaText text={q.starSuffix || ""} />
                    </div>
                  </div>
                )}

                {/* 4 OPTIONS WITH LIVE FURIGANA PREVIEW */}
                <div className="mb-4">
                  <label className="mb-2 block text-xs font-bold text-slate-700">
                    {q.type === "star"
                      ? tr(
                        "4 mảnh ghép từ vựng (Chọn radio ở mảnh ghép nằm đúng vào vị trí ★):",
                        "4 word fragments (Select radio for the item placed at ★):",
                        "4つの語句（★に入る正解を選択）："
                      )
                      : tr(
                        "4 phương án lựa chọn A, B, C, D (Chọn radio ở đáp án đúng):",
                        "4 choices A, B, C, D (Select radio for correct answer):",
                        "4つの選択肢（正解のラジオボタンを選択）："
                      )}
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {q.options.map((opt, optIdx) => {
                      const isCorrect = q.correctIndex === optIdx;
                      return (
                        <div
                          key={optIdx}
                          className={`rounded-xl border p-3 transition ${isCorrect
                            ? "border-[#135E36] bg-emerald-50/40"
                            : "border-slate-200 bg-white"
                            }`}
                        >
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <label className="inline-flex cursor-pointer items-center gap-2">
                              <input
                                type="radio"
                                name={`correct-${q.id}`}
                                checked={isCorrect}
                                onChange={() =>
                                  handleUpdateQuestion(q.id, { correctIndex: optIdx })
                                }
                                className="h-4 w-4 accent-[#135E36]"
                              />
                              <span className="text-xs font-extrabold text-slate-800">
                                {tr(`Phương án ${optionLetters[optIdx]}`, `Option ${optionLetters[optIdx]}`, `選択肢 ${optionLetters[optIdx]}`)}
                              </span>
                            </label>
                            {isCorrect && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#135E36] px-2 py-0.5 text-xs font-bold text-white">
                                <CheckCircle2 className="h-3 w-3 text-[#6CC24A]" />
                                {q.type === "star"
                                  ? tr("Đáp án tại ★", "Word at ★", "★の正解")
                                  : tr("Đáp án đúng", "Correct Answer", "正解")}
                              </span>
                            )}
                          </div>

                          <input
                            type="text"
                            value={opt}
                            onChange={(e) =>
                              handleUpdateOption(q.id, optIdx, e.target.value)
                            }
                            placeholder={tr(
                              `Nhập phương án ${optionLetters[optIdx]} (hỗ trợ 漢字[かんじ])`,
                              `Enter option ${optionLetters[optIdx]} (Kanji[reading] supported)`,
                              `選択肢 ${optionLetters[optIdx]} を入力（漢字[かんじ] ルビ対応）`
                            )}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-jp text-xs text-slate-900"
                          />

                          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-600">
                            <span className="font-semibold text-slate-400">{tr("Hiển thị:", "Display:", "表示:")}</span>
                            <span className="font-jp text-xs font-bold text-slate-900">
                              <FuriganaText text={opt || "—"} />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* DETAILED EXPLANATION FIELD */}
                <div className="rounded-xl border border-slate-200/80 bg-[#FAF8F2] p-3.5">
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-[#135E36]">
                    <HelpCircle className="h-3.5 w-3.5" />
                    {tr(
                      "Giải thích đáp án chi tiết (chỉ hiển thị sau khi học viên nộp bài)",
                      "Detailed Explanation (only shown after student submits)",
                      "詳細な解説（受講生の提出後にのみ表示）"
                    )}
                  </label>
                  <textarea
                    rows={2}
                    value={q.explanation}
                    onChange={(e) =>
                      handleUpdateQuestion(q.id, { explanation: e.target.value })
                    }
                    placeholder={tr(
                      "Giải thích cấu trúc ngữ pháp, từ vựng và lý do chọn đáp án đúng (hỗ trợ 漢字[かんじ])...",
                      "Explain grammar structure, vocabulary, and why this is the correct answer (Kanji[reading] supported)...",
                      "文法構造、語彙、正解の理由などを入力（漢字[かんじ] ルビ対応）..."
                    )}
                    className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800"
                  />
                  {q.explanation && (
                    <div className="mt-2 text-xs text-slate-700">
                      <span className="font-bold text-[#135E36]">{tr("Xem trước lời giải: ", "Explanation preview: ", "解説プレビュー: ")}</span>
                      <FuriganaText text={q.explanation} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sticky Bottom Save Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#135E36]/20 bg-white p-5 shadow-md">
          <div>
            <p className="text-sm font-extrabold text-slate-900">
              {tr("Sẵn sàng xuất bản đề thi cho học viên?", "Ready to publish exam for students?", "受講生向けに試験を公開する準備はできましたか？")}
            </p>
            <p className="text-xs text-slate-600">
              {lang === "vi" ? (
                <>Tổng cộng <strong>{questions.length} câu hỏi</strong> · <strong>{totalPoints} điểm</strong> · Điểm đạt: <strong>{passScore} điểm</strong></>
              ) : lang === "ja" ? (
                <>合計 <strong>{questions.length}問</strong> · <strong>{totalPoints}点</strong> · 合格点: <strong>{passScore}点</strong></>
              ) : (
                <>Total <strong>{questions.length} questions</strong> · <strong>{totalPoints} points</strong> · Pass score: <strong>{passScore} points</strong></>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/portal/tests"
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              {tr("Hủy", "Cancel", "キャンセル")}
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#135E36] px-6 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#0f4a2a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#6CC24A]" />
              ) : (
                <Save className="h-4 w-4 text-[#6CC24A]" />
              )}
              {isSaving
                ? tr("Đang lưu đề...", "Saving...", "保存中...")
                : tr("Lưu & Xuất bản Đề thi", "Save & Publish Exam", "保存して試験を公開")}
            </button>
          </div>
        </div>
      </form>

      <PdfImportDialog
        open={isPdfImportOpen}
        onOpenChange={setIsPdfImportOpen}
        defaultLevel={classes.find((c) => c.id === classId)?.level || "N3"}
        onImported={handlePdfImported}
      />

      <BatchAnswerDialog
        open={isBatchAnswerOpen}
        onOpenChange={setIsBatchAnswerOpen}
        questions={questions}
        defaultScope={activeSectionTab}
        showSections={true}
        onApply={handleApplyBatchAnswers}
      />
    </div>
  );
}

export default function SenseiTestCreatePage() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm font-semibold text-slate-600">
          Loading JLPT Exam Builder...
        </div>
      }
    >
      <SenseiTestCreateContent />
    </Suspense>
  );
}
