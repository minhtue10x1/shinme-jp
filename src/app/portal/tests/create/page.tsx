"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { toast } from "sonner";
import { FuriganaText } from "@/components/furigana-text";
import { MOCK_CLASSES } from "@/lib/classroom-store";
import { getClasses, saveTestDoc } from "@/lib/db/services";
import type { ClassDoc } from "@/lib/db/schema";
import {
  saveTest,
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
  sharedPassage?: { groupId: string; title: string; text: string },
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

export default function SenseiTestCreatePage() {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassDoc[]>([]);

  useEffect(() => {
    getClasses().then((res) => {
      if (res && res.length > 0) {
        setClasses(res);
        setClassId(res[0].id);
      }
    }).catch(console.error);
  }, []);

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

  const totalPoints = questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0);

  const handleAddQuestion = (type: MondaiType, sharedPassage?: { groupId: string; title: string; text: string }) => {
    const newQ = createTemplateQuestion(
      type,
      questions.length + 1,
      sharedPassage,
      Date.now().toString(36)
    );
    setQuestions((prev) => [...prev, newQ]);
    toast.success(`Đã thêm câu hỏi ${MONDAI_META[type].shortLabel}`);
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
      toast.error("Đề thi cần ít nhất 1 câu hỏi.");
      return;
    }
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    toast.info("Đã xóa câu hỏi khỏi đề thi.");
  };

  const handleSaveTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Vui lòng nhập tên bài kiểm tra.");
      return;
    }
    const targetClass =
      classes.find((c) => c.id === classId) ??
      MOCK_CLASSES.find((c) => c.id === classId) ??
      MOCK_CLASSES[0];

    const newTest: JLPTTest = {
      id: `test-${Date.now().toString(36)}`,
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
      await saveTestDoc(newTest as any);
      saveTest(newTest);
      toast.success("Đã xuất bản đề thi thành công!", {
        description: `Đề "${newTest.title}" (${questions.length} câu · ${totalPoints} điểm) đã được lưu vào Firestore cho lớp ${targetClass.shortName}.`,
      });
      router.push("/portal/tests");
    } catch (err) {
      console.error("Save test error:", err);
      toast.error("Lỗi khi lưu đề thi vào cơ sở dữ liệu.");
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Bar */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm lg:flex-row lg:items-center">
        <div className="space-y-1.5">
          <Link
            href="/portal/tests"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#135E36] hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Quay lại Trung tâm Khảo thí JLPT
          </Link>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Sensei Test Builder — Soạn đề thi tiếng Nhật chuẩn JLPT
            </h1>
            <span className="rounded-full bg-[#6CC24A]/20 px-3 py-0.5 text-xs font-bold text-[#135E36]">
              Hỗ trợ Furigana 漢字[かんじ] trực tiếp
            </span>
          </div>
          <p className="text-sm text-slate-600">
            Cấu hình thông số bài thi, biên soạn 4 dạng Mondai đặc thù và viết giải thích ngữ pháp chi tiết cho học viên sau khi nộp bài.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/portal/tests/manage"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            Quản lý kho đề
          </Link>
          <button
            type="button"
            onClick={handleSaveTest}
            className="inline-flex items-center gap-2 rounded-xl bg-[#135E36] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#0f4a2a]"
          >
            <Save className="h-4 w-4 text-[#6CC24A]" />
            Xuất bản đề thi ({questions.length} câu · {totalPoints}đ)
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
              Mẹo nhập Furigana trực tiếp (`Live Furigana Input`)
            </p>
            <p className="text-xs text-slate-600">
              Gõ chữ Hán kèm cách đọc trong ngoặc vuông như{" "}
              <code className="rounded bg-white px-1.5 py-0.5 font-mono text-xs font-bold text-[#135E36]">
                日本語[にほんご]で未来[みらい]をひらく
              </code>{" "}
              để hệ thống tự động hiển thị{" "}
              <span className="inline-block rounded bg-white px-2 py-0.5 font-jp text-slate-900">
                <FuriganaText text="日本語[にほんご]で未来[みらい]をひらく" />
              </span>{" "}
              trên cả đề bài, đáp án và lời giải.
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
                1. Thông tin cấu hình bài kiểm tra (Test Metadata)
              </h2>
              <p className="text-xs text-slate-500">
                Thiết lập lớp áp dụng, thời gian đếm ngược, hạn nộp và quy tắc chấm đạt.
              </p>
            </div>
            <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
              Tổng điểm tự động: <strong className="text-[#135E36]">{totalPoints} điểm</strong>
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Tên bài kiểm tra (Tiếng Việt) *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Kiểm tra Định kỳ N3 Đợt 1 — Tổng hợp 4 Mondai"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-[#135E36] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Mã đề thi (Code)
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="VD: N3-MID-01"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-mono text-sm font-bold text-slate-900 focus:border-[#135E36] focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Tiêu đề tiếng Nhật (Hỗ trợ Furigana `漢字[かんじ]`)
              </label>
              <input
                type="text"
                value={titleJa}
                onChange={(e) => setTitleJa(e.target.value)}
                placeholder="VD: N3 第1回[だいいっかい] 実力[じつりょく]テスト"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 font-jp text-sm text-slate-900 focus:border-[#135E36] focus:outline-none"
              />
              {titleJa && (
                <div className="mt-1.5 flex items-center gap-2 rounded-lg bg-[#FAF8F2] px-3 py-1.5 text-xs text-slate-600">
                  <Eye className="h-3.5 w-3.5 text-[#135E36]" />
                  <span>Xem trước:</span>
                  <span className="font-jp text-sm font-bold text-[#135E36]">
                    <FuriganaText text={titleJa} />
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Lớp áp dụng *
              </label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-[#135E36] focus:outline-none"
              >
                {(classes.length > 0 ? classes : MOCK_CLASSES).map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.level})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Thời gian làm bài (Phút) *
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
                Hạn chót nộp bài (Deadline) *
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
                  Số lần làm tối đa
                </label>
                <select
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 focus:border-[#135E36] focus:outline-none"
                >
                  <option value={1}>1 lần duy nhất</option>
                  <option value={2}>Tối đa 2 lần</option>
                  <option value={3}>Tối đa 3 lần</option>
                  <option value={0}>Không giới hạn</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Điểm đạt (Pass)
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
                  Trộn câu hỏi ngẫu nhiên (Shuffle Questions)
                </p>
                <p className="text-xs text-slate-600">
                  Tự động đảo thứ tự các câu hỏi độc lập mỗi khi học viên bắt đầu lượt thi mới (giữ nguyên nhóm câu hỏi đọc hiểu Dokkai).
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={shuffleQuestions}
              onClick={() => setShuffleQuestions((v) => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                shuffleQuestions ? "bg-[#135E36]" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                  shuffleQuestions ? "translate-x-5" : "translate-x-0"
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
                2. Thêm câu hỏi theo 4 định dạng Mondai chuẩn JLPT
              </h2>
              <p className="text-xs text-slate-500">
                Chọn loại câu hỏi bên dưới để chèn thêm vào cuối đề thi.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Đang có <strong className="text-slate-900">{questions.length}</strong> câu hỏi
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
                  + Trắc nghiệm chuẩn
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
                  + Bài tập dấu sao ★
                </p>
                <p className="mt-0.5 text-xs text-slate-600">
                  Sắp xếp 4 mảnh ghép ___ ___ ★ ___
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
                  + Đọc hiểu (Dokkai)
                </p>
                <p className="mt-0.5 text-xs text-slate-600">
                  Đoạn văn dài + nhóm câu hỏi con
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
                  + Nghe hiểu (Choukai)
                </p>
                <p className="mt-0.5 text-xs text-slate-600">
                  Đính kèm MP3 & giới hạn lượt nghe
                </p>
              </div>
            </button>
          </div>
        </section>

        {/* SECTION 3: QUESTION EDITORS */}
        <div className="space-y-5">
          {questions.map((q, idx) => {
            const meta = MONDAI_META[q.type];
            const optionLetters = ["A", "B", "C", "D"];

            return (
              <div
                key={q.id}
                className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm"
              >
                {/* Question Card Header */}
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#135E36] font-mono text-xs font-bold text-white">
                      {idx + 1}
                    </span>
                    <span
                      className={`rounded-full border px-3 py-0.5 text-xs font-bold ${meta.badgeClass}`}
                    >
                      {meta.label}
                    </span>

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
                      <option value="standard">Đổi sang: Trắc nghiệm chuẩn</option>
                      <option value="star">Đổi sang: Bài tập dấu sao ★</option>
                      <option value="dokkai">Đổi sang: Đọc hiểu (Dokkai)</option>
                      <option value="choukai">Đổi sang: Nghe hiểu (Choukai)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <label className="text-xs font-bold text-slate-500">Điểm:</label>
                      <input
                        type="number"
                        min={5}
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
                          })
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-800 hover:bg-sky-100"
                      >
                        <CopyPlus className="h-3.5 w-3.5" />
                        + Thêm câu hỏi con cùng bài đọc
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Xóa
                    </button>
                  </div>
                </div>

                {/* Mondai Section Title & Grammar Tag */}
                <div className="mb-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-600">
                      Nhãn Mondai hiển thị
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
                      Chủ điểm Ngữ pháp / Kỹ năng (Dùng cho Thống kê câu hay sai)
                    </label>
                    <input
                      type="text"
                      value={q.grammarPoint}
                      onChange={(e) =>
                        handleUpdateQuestion(q.id, { grammarPoint: e.target.value })
                      }
                      placeholder="VD: Ngữ pháp N3 ～わりに / Trường âm Hán tự"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-[#135E36]"
                    />
                  </div>
                </div>

                {/* DOKKAI PASSAGE EDITOR */}
                {q.type === "dokkai" && (
                  <div className="mb-5 rounded-2xl border border-sky-200 bg-sky-50/40 p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-sky-900">
                        📖 Đoạn văn Đọc hiểu (Dokkai Passage — hiển thị cột bên trái khi thi)
                      </span>
                      <span className="font-mono text-xs text-sky-700">
                        Mã nhóm bài đọc: {q.passageGroupId || "passage-default"}
                      </span>
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="space-y-3">
                        <div>
                          <label className="mb-1 block text-xs font-bold text-slate-700">
                            Tiêu đề bài đọc (Hỗ trợ `漢字[かんじ]`)
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
                        <div>
                          <label className="mb-1 block text-xs font-bold text-slate-700">
                            Nội dung đoạn văn tiếng Nhật (Hỗ trợ `漢字[かんじ]`)
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

                      {/* Live Furigana Passage Preview */}
                      <div className="rounded-xl border border-sky-200/80 bg-[#FAF8F2] p-4">
                        <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-[#135E36]">
                          <Eye className="h-3.5 w-3.5" />
                          Xem trước hiển thị bài đọc `<FuriganaText text="読解[どっかい]" />`:
                        </div>
                        {q.passageTitle && (
                          <p className="mb-2 border-b border-slate-200 pb-1.5 font-jp text-sm font-bold text-slate-900">
                            <FuriganaText text={q.passageTitle} />
                          </p>
                        )}
                        <div className=" whitespace-pre-line font-jp text-sm leading-loose text-slate-800">
                          <FuriganaText text={q.passageText || ""} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* CHOUKAI AUDIO CONFIG EDITOR */}
                {q.type === "choukai" && (
                  <div className="mb-5 rounded-2xl border border-purple-200 bg-purple-50/40 p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-purple-900">
                        🎧 Cấu hình File Nghe Choukai (MP3 & Giới hạn lượt phát)
                      </span>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-bold text-slate-700">
                          Tên file MP3 hoặc tiêu đề băng nghe
                        </label>
                        <input
                          type="text"
                          value={q.audioTitle || ""}
                          onChange={(e) =>
                            handleUpdateQuestion(q.id, { audioTitle: e.target.value })
                          }
                          placeholder="VD: Choukai_N3_Mondai1_Track04.mp3"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-bold text-purple-900">
                          Giới hạn số lần nghe *
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
                          <option value={1}>Nghe 1 lần duy nhất (Chuẩn thi JLPT)</option>
                          <option value={2}>Giới hạn nghe 2 lần</option>
                          <option value={0}>Không giới hạn số lần nghe</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* QUESTION PROMPT + LIVE FURIGANA PREVIEW */}
                <div className="mb-4 grid gap-4 lg:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold text-slate-700">
                      Câu hỏi / Đề bài (Hỗ trợ cú pháp `漢字[かんじ]`) *
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
                      Xem trước Furigana câu hỏi:
                    </span>
                    <div className="font-jp text-base font-bold leading-relaxed text-slate-900">
                      <FuriganaText text={q.prompt || "（Chưa nhập nội dung）"} />
                    </div>
                  </div>
                </div>

                {/* STAR (★) SENTENCE BUILDER SPECIFIC FIELDS */}
                {q.type === "star" && (
                  <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
                    <p className="mb-3 text-xs font-extrabold text-amber-900">
                      ★ Cấu hình khung câu 4 chỗ trống `___ ___ ★ ___`
                    </p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <label className="mb-1 block text-xs font-bold text-slate-700">
                          Vế đầu câu (Trước 4 ô trống)
                        </label>
                        <input
                          type="text"
                          value={q.starPrefix || ""}
                          onChange={(e) =>
                            handleUpdateQuestion(q.id, { starPrefix: e.target.value })
                          }
                          placeholder="VD: この 薬[くすり]を"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-jp text-xs text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold text-slate-700">
                          Vị trí dấu sao ★ (Ô thứ mấy?)
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
                          <option value={0}>Ô số 1: ★ ___ ___ ___</option>
                          <option value={1}>Ô số 2: ___ ★ ___ ___</option>
                          <option value={2}>Ô số 3: ___ ___ ★ ___ (Chuẩn JLPT)</option>
                          <option value={3}>Ô số 4: ___ ___ ___ ★</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold text-slate-700">
                          Vế cuối câu (Sau 4 ô trống)
                        </label>
                        <input
                          type="text"
                          value={q.starSuffix || ""}
                          onChange={(e) =>
                            handleUpdateQuestion(q.id, { starSuffix: e.target.value })
                          }
                          placeholder="VD: なりました。"
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-jp text-xs text-slate-900"
                        />
                      </div>
                    </div>

                    {/* Live Preview of the 4 Star Slots */}
                    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-white p-3 font-jp text-sm text-slate-900 shadow-2xs">
                      <span className="text-xs font-bold text-amber-800">Xem trước khung câu:</span>
                      <FuriganaText text={q.starPrefix || ""} />
                      {[0, 1, 2, 3].map((slotIdx) => {
                        const isStar = (q.starSlotIndex ?? 2) === slotIdx;
                        return (
                          <span
                            key={slotIdx}
                            className={`inline-flex min-w-16 items-center justify-center rounded-lg border-2 px-3 py-1 text-xs font-bold ${
                              isStar
                                ? "border-amber-500 bg-amber-100 text-amber-900"
                                : "border-dashed border-slate-300 bg-slate-50 text-slate-400"
                            }`}
                          >
                            {isStar ? "★" : `Ô ${slotIdx + 1}`}
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
                      ? "4 mảnh ghép từ vựng (Chọn radio ở mảnh ghép nằm đúng vào vị trí ★):"
                      : "4 phương án lựa chọn A, B, C, D (Chọn radio ở đáp án đúng):"}
                  </label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {q.options.map((opt, optIdx) => {
                      const isCorrect = q.correctIndex === optIdx;
                      return (
                        <div
                          key={optIdx}
                          className={`rounded-xl border p-3 transition ${
                            isCorrect
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
                                Phương án {optionLetters[optIdx]}
                              </span>
                            </label>
                            {isCorrect && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#135E36] px-2 py-0.5 text-xs font-bold text-white">
                                <CheckCircle2 className="h-3 w-3 text-[#6CC24A]" />
                                {q.type === "star" ? "Đáp án tại ★" : "Đáp án đúng"}
                              </span>
                            )}
                          </div>

                          <input
                            type="text"
                            value={opt}
                            onChange={(e) =>
                              handleUpdateOption(q.id, optIdx, e.target.value)
                            }
                            placeholder={`Nhập phương án ${optionLetters[optIdx]} (hỗ trợ 漢字[かんじ])`}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-jp text-xs text-slate-900"
                          />

                          <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-600">
                            <span className="font-semibold text-slate-400">Hiển thị:</span>
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
                    Giải thích đáp án chi tiết (`Giải thích đáp án` — chỉ hiển thị sau khi học viên nộp bài)
                  </label>
                  <textarea
                    rows={2}
                    value={q.explanation}
                    onChange={(e) =>
                      handleUpdateQuestion(q.id, { explanation: e.target.value })
                    }
                    placeholder="Giải thích cấu trúc ngữ pháp, từ vựng và lý do chọn đáp án đúng (hỗ trợ 漢字[かんじ])..."
                    className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-800"
                  />
                  {q.explanation && (
                    <div className="mt-2 text-xs text-slate-700">
                      <span className="font-bold text-[#135E36]">Xem trước lời giải: </span>
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
              Sẵn sàng xuất bản đề thi cho học viên?
            </p>
            <p className="text-xs text-slate-600">
              Tổng cộng <strong>{questions.length} câu hỏi</strong> ·{" "}
              <strong>{totalPoints} điểm</strong> · Điểm đạt:{" "}
              <strong>{passScore} điểm</strong>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/portal/tests"
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              Hủy
            </Link>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-[#135E36] px-6 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#0f4a2a]"
            >
              <Save className="h-4 w-4 text-[#6CC24A]" />
              Lưu & Xuất bản Đề thi
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
