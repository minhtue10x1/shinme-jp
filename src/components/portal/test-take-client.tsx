"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useSyncExternalStore,
} from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Clock,
  Flag,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Pause,
  Volume2,
  RotateCcw,
  Send,
  Sparkles,
  BookOpen,
  Star,
  FileText,
  Headphones,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Award,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { FuriganaText } from "@/components/furigana-text";
import { useRole } from "@/lib/role-context";
import {
  readTests,
  getTestsServerSnapshot,
  subscribeTests,
  saveAttempt,
  type JLPTTest,
  type TestQuestion,
} from "@/lib/test-center-store";

type SavedExamSession = {
  answers: Record<string, number>;
  flagged: Record<string, boolean>;
  audioPlays: Record<string, number>;
  starSlots: Record<string, (number | null)[]>;
  remainingSeconds: number;
  questionOrder?: string[];
  updatedAt: number;
};

function formatMMSS(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function TestTakeClient({ testId }: { testId: string }) {
  const { user: currentUser } = useRole();
  const tests = useSyncExternalStore(
    subscribeTests,
    readTests,
    getTestsServerSnapshot
  );

  const test: JLPTTest =
    tests.find((t) => t.id === testId) ?? tests[0];

  const storageKey = `shinme:exam-session:${test.id}`;

  // Exam state
  const [orderedQuestions, setOrderedQuestions] = useState<TestQuestion[]>(
    () => test.questions
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [audioPlays, setAudioPlays] = useState<Record<string, number>>({});
  const [starSlots, setStarSlots] = useState<
    Record<string, (number | null)[]>
  >({});
  const [remainingSeconds, setRemainingSeconds] = useState<number>(
    test.durationMinutes * 60
  );
  const [restoredFromStorage, setRestoredFromStorage] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<{
    score: number;
    totalPoints: number;
    passed: boolean;
    durationSeconds: number;
    correctCount: number;
  } | null>(null);

  // Audio simulator state for Choukai questions
  const [playingQuestionId, setPlayingQuestionId] = useState<string | null>(
    null
  );
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const audioTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Restore saved session from localStorage on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as SavedExamSession;
        if (parsed && typeof parsed === "object") {
          setAnswers(parsed.answers || {});
          setFlagged(parsed.flagged || {});
          setAudioPlays(parsed.audioPlays || {});
          setStarSlots(parsed.starSlots || {});
          if (
            typeof parsed.remainingSeconds === "number" &&
            parsed.remainingSeconds > 0
          ) {
            setRemainingSeconds(parsed.remainingSeconds);
          }
          if (parsed.questionOrder && parsed.questionOrder.length > 0) {
            const map = new Map(test.questions.map((q) => [q.id, q]));
            const restored = parsed.questionOrder
              .map((qid) => map.get(qid))
              .filter((q): q is TestQuestion => Boolean(q));
            if (restored.length === test.questions.length) {
              setOrderedQuestions(restored);
            }
          }
          setRestoredFromStorage(true);
          return;
        }
      }
    } catch {
      // ignore corrupted storage
    }

    // Fresh start: apply shuffle if enabled (preserving Dokkai passage groups together)
    if (test.shuffleQuestions) {
      const shuffled = [...test.questions];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      setOrderedQuestions(shuffled);
    } else {
      setOrderedQuestions(test.questions);
    }
    setRemainingSeconds(test.durationMinutes * 60);
  }, [storageKey, test.durationMinutes, test.questions, test.shuffleQuestions]);

  // Auto-save to localStorage on every state update while exam is active
  useEffect(() => {
    if (submittedResult) return;
    try {
      const payload: SavedExamSession = {
        answers,
        flagged,
        audioPlays,
        starSlots,
        remainingSeconds,
        questionOrder: orderedQuestions.map((q) => q.id),
        updatedAt: Date.now(),
      };
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      // ignore storage quota errors
    }
  }, [
    answers,
    flagged,
    audioPlays,
    starSlots,
    remainingSeconds,
    orderedQuestions,
    storageKey,
    submittedResult,
  ]);

  const handleSubmitExam = useCallback(
    (isAutoSubmit = false) => {
      if (submittedResult) return;

      // Stop audio if playing
      if (audioTimerRef.current) {
        clearInterval(audioTimerRef.current);
        audioTimerRef.current = null;
      }
      setPlayingQuestionId(null);

      let earned = 0;
      let correctCount = 0;
      for (const q of orderedQuestions) {
        if (answers[q.id] === q.correctIndex) {
          earned += q.points;
          correctCount += 1;
        }
      }

      const total = test.totalPoints;
      const passed = earned >= test.passScore;
      const elapsedSeconds = Math.max(
        15,
        test.durationMinutes * 60 - remainingSeconds
      );

      saveAttempt({
        testId: test.id,
        studentId: "std-01",
        studentCode: currentUser.code || "HV-202601",
        studentName: currentUser.name || "Lê Hoàng Nam",
        score: earned,
        totalPoints: total,
        passed,
        durationSeconds: elapsedSeconds,
        answers,
      });

      try {
        window.localStorage.removeItem(storageKey);
      } catch {
        // ignore
      }

      setSubmittedResult({
        score: earned,
        totalPoints: total,
        passed,
        durationSeconds: elapsedSeconds,
        correctCount,
      });

      if (isAutoSubmit) {
        toast.warning("Hết giờ làm bài! Hệ thống đã tự động thu bài và chấm điểm.");
      } else {
        toast.success(
          `Đã nộp bài thành công! Điểm của bạn: ${earned}/${total} điểm.`
        );
      }
    },
    [
      submittedResult,
      orderedQuestions,
      answers,
      test.totalPoints,
      test.passScore,
      test.durationMinutes,
      test.id,
      remainingSeconds,
      currentUser.code,
      currentUser.name,
      storageKey,
    ]
  );

  // Countdown timer effect
  useEffect(() => {
    if (submittedResult) return;
    if (remainingSeconds <= 0) {
      handleSubmitExam(true);
      return;
    }
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [remainingSeconds, submittedResult, handleSubmitExam]);

  // Select standard answer
  const handleSelectOption = (questionId: string, optionIdx: number) => {
    if (submittedResult) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
  };

  // Toggle flag for review
  const handleToggleFlag = (questionId: string) => {
    if (submittedResult) return;
    setFlagged((prev) => ({ ...prev, [questionId]: !prev[questionId] }));
  };

  // Interactive Star (★) slot filler
  const handleStarWordClick = (q: TestQuestion, optIdx: number) => {
    if (submittedResult) return;
    const starIdx = q.starSlotIndex ?? 2;
    const currentSlots = starSlots[q.id] ?? [null, null, null, null];

    // If already placed in a slot, remove it from that slot
    const existingPos = currentSlots.indexOf(optIdx);
    const nextSlots = [...currentSlots];
    if (existingPos !== -1) {
      nextSlots[existingPos] = null;
    } else {
      // Place in first empty slot, or overwrite the ★ slot if all 4 are filled
      const firstEmpty = nextSlots.findIndex((s) => s === null);
      if (firstEmpty !== -1) {
        nextSlots[firstEmpty] = optIdx;
      } else {
        nextSlots[starIdx] = optIdx;
      }
    }

    setStarSlots((prev) => ({ ...prev, [q.id]: nextSlots }));

    // Whatever word is inside the ★ slot becomes the selected answer for this question
    const starAnswer = nextSlots[starIdx];
    if (starAnswer !== null && starAnswer !== undefined) {
      setAnswers((prev) => ({ ...prev, [q.id]: starAnswer }));
    } else {
      // Also allow direct selection if user clicked a word block
      setAnswers((prev) => ({ ...prev, [q.id]: optIdx }));
    }
  };

  const handleResetStarSlots = (q: TestQuestion) => {
    if (submittedResult) return;
    setStarSlots((prev) => ({ ...prev, [q.id]: [null, null, null, null] }));
  };

  // Choukai Audio Playback with Play-Limit Enforcement
  const handlePlayChoukaiAudio = (q: TestQuestion) => {
    if (submittedResult) return;
    const limit = q.audioPlayLimit ?? 0; // 0 = unlimited
    const usedPlays = audioPlays[q.id] ?? 0;

    if (playingQuestionId === q.id) {
      // Pause current playback without consuming another play
      if (audioTimerRef.current) {
        clearInterval(audioTimerRef.current);
        audioTimerRef.current = null;
      }
      setPlayingQuestionId(null);
      return;
    }

    if (limit > 0 && usedPlays >= limit) {
      toast.error(
        `Bạn đã sử dụng hết ${limit}/${limit} lượt nghe cho phép của câu hỏi này.`
      );
      return;
    }

    // Increment play count when starting a new playback
    setAudioPlays((prev) => ({ ...prev, [q.id]: usedPlays + 1 }));
    setPlayingQuestionId(q.id);
    setAudioProgress(0);

    const durationSec = q.audioDurationSec || 20;
    let step = 0;
    if (audioTimerRef.current) clearInterval(audioTimerRef.current);
    audioTimerRef.current = setInterval(() => {
      step += 1;
      const pct = Math.min(100, Math.round((step / durationSec) * 100));
      setAudioProgress(pct);
      if (pct >= 100) {
        if (audioTimerRef.current) clearInterval(audioTimerRef.current);
        audioTimerRef.current = null;
        setPlayingQuestionId(null);
      }
    }, 450);
  };

  const activeQuestion = orderedQuestions[activeIndex] ?? orderedQuestions[0];
  const answeredCount = orderedQuestions.filter(
    (q) => answers[q.id] !== undefined
  ).length;
  const flaggedCount = orderedQuestions.filter((q) => flagged[q.id]).length;
  const progressPercent = Math.round(
    (answeredCount / Math.max(1, orderedQuestions.length)) * 100
  );

  // Group child questions if active question is Dokkai
  const dokkaiGroupQuestions =
    activeQuestion?.type === "dokkai" && activeQuestion.passageGroupId
      ? orderedQuestions.filter(
          (q) => q.passageGroupId === activeQuestion.passageGroupId
        )
      : [activeQuestion];

  /* ==================================================================
   * VIEW 1: POST-SUBMISSION RESULT & DETAILED REVIEW SCREEN
   * ================================================================== */
  if (submittedResult) {
    return (
      <div className="space-y-6 pb-16">
        {/* Top Result Banner with Shinme Mascot ("Cố lên! ♡") */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
          <div
            className={`px-6 py-3 text-xs font-extrabold text-white ${
              submittedResult.passed ? "bg-[#135E36]" : "bg-amber-700"
            }`}
          >
            {submittedResult.passed
              ? "🎉 CHÚC MỪNG! BẠN ĐÃ VƯỢT QUA BÀI KIỂM TRA TIẾNG NHẬT JLPT"
              : "🌱 CHƯA ĐẠT ĐIỂM CHUẨN — HÃY XEM KỸ LỜI GIẢI CỦA SENSEI ĐỂ PHỤC THÙ NHÉ!"}
          </div>

          <div className="grid items-center gap-6 p-6 lg:grid-cols-12">
            {/* Score Summary */}
            <div className="space-y-4 lg:col-span-8">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="rounded-lg bg-[#135E36] px-2.5 py-1 font-mono text-xs font-bold text-white">
                  {test.code}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-extrabold ${
                    submittedResult.passed
                      ? "bg-[#6CC24A]/20 text-[#135E36]"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {submittedResult.passed ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-[#135E36]" />
                      KẾT QUẢ: ĐẠT (GOUKAKU 合格)
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4 text-rose-700" />
                      KẾT QUẢ: CHƯA ĐẠT (Cần {test.passScore} điểm)
                    </>
                  )}
                </span>
              </div>

              <div>
                <h1 className="text-2xl font-extrabold text-slate-900">
                  {test.title}
                </h1>
                <p className="mt-1 font-jp text-sm font-bold text-[#135E36]">
                  <FuriganaText text={test.titleJa} />
                </p>
              </div>

              {/* 4 Score KPI Cards */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3.5">
                  <p className="text-xs font-bold text-slate-500">Tổng điểm</p>
                  <p className="mt-1 font-mono text-2xl font-extrabold text-[#135E36]">
                    {submittedResult.score}
                    <span className="text-sm font-semibold text-slate-500">
                      /{submittedResult.totalPoints}
                    </span>
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-[#FAF8F2] p-3.5">
                  <p className="text-xs font-bold text-slate-500">Số câu đúng</p>
                  <p className="mt-1 font-mono text-2xl font-extrabold text-slate-900">
                    {submittedResult.correctCount}
                    <span className="text-sm font-semibold text-slate-500">
                      /{orderedQuestions.length} câu
                    </span>
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-[#FAF8F2] p-3.5">
                  <p className="text-xs font-bold text-slate-500">
                    Thời gian hoàn thành
                  </p>
                  <p className="mt-1 font-mono text-2xl font-extrabold text-slate-900">
                    {formatMMSS(submittedResult.durationSeconds)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-[#FAF8F2] p-3.5">
                  <p className="text-xs font-bold text-slate-500">Điểm chuẩn</p>
                  <p className="mt-1 font-mono text-2xl font-extrabold text-[#135E36]">
                    {test.passScore}đ
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedResult(null);
                    setAnswers({});
                    setFlagged({});
                    setAudioPlays({});
                    setStarSlots({});
                    setRemainingSeconds(test.durationMinutes * 60);
                    setActiveIndex(0);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#135E36] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#0f4a2a]"
                >
                  <RotateCcw className="h-4 w-4 text-[#6CC24A]" />
                  Làm lại đề thi này
                </button>

                <Link
                  href="/portal/gradebook"
                  className="inline-flex items-center gap-2 rounded-xl border border-[#135E36]/20 bg-[#FAF8F2] px-4 py-2.5 text-xs font-bold text-[#135E36] hover:bg-emerald-50"
                >
                  <BarChart3 className="h-4 w-4" />
                  Xem Bảng điểm lớp & Phân tích câu sai
                </Link>

                <Link
                  href="/portal/tests"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Về danh sách bài thi
                </Link>
              </div>
            </div>

            {/* Encouraging Shinme Mascot Illustration ("Cố lên! ♡") */}
            <div className="flex flex-col items-center justify-center rounded-2xl border border-[#6CC24A]/40 bg-[#FAF8F2] p-5 text-center lg:col-span-4">
              <div className="relative mb-3">
                <div className="overflow-hidden rounded-2xl border-2 border-[#6CC24A] bg-white p-1.5 shadow-sm">
                  <Image
                    src="/brand/shinme-mascot.jpg"
                    alt="Shinme Mascot cheering Cố lên!"
                    width={140}
                    height={140}
                    className="h-32 w-32 rounded-xl object-cover"
                  />
                </div>
                <span className="absolute -top-2.5 -right-3 rounded-full bg-[#135E36] px-3 py-1 text-xs font-extrabold text-white shadow">
                  Cố lên! ♡
                </span>
              </div>
              <p className="font-jp text-xs font-bold text-[#135E36]">
                <FuriganaText text="一歩[いっぽ]ずつ、着実[ちゃくじつ]に！" />
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-600">
                {submittedResult.passed
                  ? "Tuyệt vời lắm! Hãy đọc lại giải thích chi tiết bên dưới để nhớ sâu hơn các cấu trúc ngữ pháp N3 nhé!"
                  : "Đừng nản lòng nhé! Mỗi câu sai hôm nay là một điểm ngữ pháp bạn sẽ không bao giờ quên trong kỳ thi JLPT thật!"}
              </p>
            </div>
          </div>
        </div>

        {/* Question-by-Question Review Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900">
              Chi tiết đáp án & Lời giải từ Sensei ({orderedQuestions.length} câu)
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              So sánh lựa chọn của bạn với đáp án chuẩn
            </span>
          </div>

          {orderedQuestions.map((q, idx) => {
            const studentChoice = answers[q.id];
            const isCorrect = studentChoice === q.correctIndex;
            const optionLetters = ["A", "B", "C", "D"];

            return (
              <div
                key={q.id}
                className={`rounded-2xl border bg-white p-6 shadow-sm ${
                  isCorrect ? "border-emerald-200" : "border-rose-200"
                }`}
              >
                {/* Header */}
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-extrabold text-white ${
                        isCorrect ? "bg-[#135E36]" : "bg-rose-600"
                      }`}
                    >
                      {isCorrect ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#6CC24A]" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      Câu {idx + 1} • {isCorrect ? `+${q.points}đ` : `0/${q.points}đ`}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-bold text-slate-700">
                      {q.mondaiLabel}
                    </span>
                    <span className="text-xs font-bold text-[#135E36]">
                      • {q.grammarPoint}
                    </span>
                  </div>

                  <span
                    className={`text-xs font-extrabold ${
                      isCorrect ? "text-[#135E36]" : "text-rose-700"
                    }`}
                  >
                    {studentChoice === undefined
                      ? "Bỏ trống (Chưa chọn)"
                      : isCorrect
                        ? "Trả lời chính xác"
                        : `Bạn chọn ${optionLetters[studentChoice]} • Đáp án đúng: ${optionLetters[q.correctIndex]}`}
                  </span>
                </div>

                {/* Dokkai Passage snippet if applicable */}
                {q.type === "dokkai" && q.passageText && (
                  <div className="mb-4 rounded-xl border border-sky-200/80 bg-[#FAF8F2] p-4">
                    {q.passageTitle && (
                      <p className="mb-1.5 font-jp text-xs font-bold text-[#135E36]">
                        <FuriganaText text={q.passageTitle} />
                      </p>
                    )}
                    <div className="whitespace-pre-line font-jp text-xs leading-relaxed text-slate-700">
                      <FuriganaText text={q.passageText} />
                    </div>
                  </div>
                )}

                {/* Question Prompt */}
                <div className="mb-3 font-jp text-base font-bold text-slate-900">
                  <FuriganaText text={q.prompt} />
                </div>

                {/* Star sentence full solution */}
                {q.type === "star" && (
                  <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/60 p-3.5 font-jp text-sm text-amber-950">
                    <span className="mr-2 text-xs font-extrabold text-amber-800">
                      Câu sắp xếp hoàn chỉnh:
                    </span>
                    <FuriganaText text={q.starPrefix || ""} />{" "}
                    {(q.starCorrectOrder ?? [0, 1, 2, 3]).map((optIndex, slotIdx) => {
                      const isStarSlot = (q.starSlotIndex ?? 2) === slotIdx;
                      return (
                        <span
                          key={slotIdx}
                          className={`mx-1 inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-xs font-bold ${
                            isStarSlot
                              ? "border border-amber-500 bg-amber-200 text-amber-950"
                              : "bg-white text-slate-800"
                          }`}
                        >
                          {isStarSlot && <Star className="h-3 w-3 fill-amber-600 text-amber-600" />}
                          <FuriganaText text={q.options[optIndex]} />
                        </span>
                      );
                    })}{" "}
                    <FuriganaText text={q.starSuffix || ""} />
                  </div>
                )}

                {/* 4 Options Comparison */}
                <div className="mb-4 grid gap-2.5 sm:grid-cols-2">
                  {q.options.map((opt, optIdx) => {
                    const isCorrectOpt = q.correctIndex === optIdx;
                    const isStudentOpt = studentChoice === optIdx;

                    let cardStyle =
                      "border-slate-200 bg-slate-50/60 text-slate-700";
                    if (isCorrectOpt) {
                      cardStyle =
                        "border-[#135E36] bg-emerald-50 font-bold text-[#135E36]";
                    } else if (isStudentOpt && !isCorrectOpt) {
                      cardStyle =
                        "border-rose-400 bg-rose-50 font-bold text-rose-800";
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`flex items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 font-jp text-sm ${cardStyle}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white/90 font-mono text-xs font-extrabold shadow-2xs">
                            {optionLetters[optIdx]}
                          </span>
                          <FuriganaText text={opt} />
                        </div>

                        <div className="flex shrink-0 items-center gap-1 text-xs font-sans font-bold">
                          {isCorrectOpt && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#135E36] px-2 py-0.5 text-xs text-white">
                              <CheckCircle2 className="h-3 w-3 text-[#6CC24A]" />
                              Đáp án đúng
                            </span>
                          )}
                          {isStudentOpt && !isCorrectOpt && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-2 py-0.5 text-xs text-white">
                              <XCircle className="h-3 w-3" />
                              Bạn đã chọn
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Choukai Transcript Reveal (if audioScript exists) */}
                {q.type === "choukai" && q.audioScript && q.audioScript.length > 0 && (
                  <div className="mb-3 rounded-xl border border-purple-200 bg-purple-50/40 p-3.5">
                    <p className="mb-2 text-xs font-extrabold text-purple-900">
                      🎧 Script Hội thoại Nghe hiểu (Choukai Transcript):
                    </p>
                    <div className="space-y-2">
                      {q.audioScript.map((line, lIdx) => (
                        <div
                          key={lIdx}
                          className="rounded-lg bg-white px-3 py-2 text-xs"
                        >
                          <p className="font-jp font-bold text-[#135E36]">
                            <FuriganaText text={line.speaker} />:{" "}
                            <span className="font-normal text-slate-900">
                              <FuriganaText text={line.textJa} />
                            </span>
                          </p>
                          <p className="mt-0.5 text-slate-500">→ {line.textVi}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sensei's Detailed Explanation */}
                <div className="rounded-xl border border-[#135E36]/20 bg-[#FAF8F2] p-4">
                  <p className="mb-1 flex items-center gap-1.5 text-xs font-extrabold text-[#135E36]">
                    <Sparkles className="h-3.5 w-3.5" />
                    Giải thích đáp án từ Sensei:
                  </p>
                  <p className="font-jp text-sm leading-relaxed text-slate-800">
                    <FuriganaText text={q.explanation} />
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ==================================================================
   * VIEW 2: ACTIVE EXAM ROOM (STICKY HEADER, NAVIGATOR & MONDAI ENGINE)
   * ================================================================== */
  const isLowTime = remainingSeconds <= 180;

  return (
    <div className="space-y-5 pb-16">
      {/* STICKY EXAM HEADER */}
      <div className="sticky top-0 z-30 rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-md backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Exam Title & Auto-save indicator */}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-[#135E36] px-2 py-0.5 font-mono text-xs font-bold text-white">
                {test.code}
              </span>
              <h1 className="text-sm font-extrabold text-slate-900 sm:text-base">
                {test.title}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-[#135E36]">
                <ShieldCheck className="h-3.5 w-3.5" />
                Đã tự động lưu (`localStorage`)
              </span>
            </div>
            {restoredFromStorage && (
              <p className="text-xs font-semibold text-amber-700">
                ⚡ Đã khôi phục tiến độ bài làm trước đó của bạn (F5 không mất bài).
              </p>
            )}
          </div>

          {/* Countdown Timer & Submit CTA */}
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 font-mono text-base font-extrabold ${
                isLowTime
                  ? "animate-pulse border-rose-300 bg-rose-50 text-rose-700"
                  : "border-[#135E36]/20 bg-[#FAF8F2] text-[#135E36]"
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>{formatMMSS(remainingSeconds)}</span>
            </div>

            <button
              type="button"
              onClick={() => handleSubmitExam(false)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#135E36] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#0f4a2a]"
            >
              <Send className="h-3.5 w-3.5 text-[#6CC24A]" />
              Nộp bài ({answeredCount}/{orderedQuestions.length})
            </button>
          </div>
        </div>

        {/* Progress Bar in #6CC24A */}
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>
              Tiến độ hoàn thành:{" "}
              <strong className="text-[#135E36]">
                {answeredCount}/{orderedQuestions.length} câu ({progressPercent}%)
              </strong>
            </span>
            <span>
              Đánh dấu xem lại: <strong className="text-amber-700">{flaggedCount}</strong>
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#6CC24A] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Question Navigator Palette (Answered / Unanswered / Flagged) */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {orderedQuestions.map((q, idx) => {
              const isCurrent = idx === activeIndex;
              const isAnswered = answers[q.id] !== undefined;
              const isFlagged = Boolean(flagged[q.id]);

              let btnClass =
                "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100";
              if (isFlagged) {
                btnClass = "border-amber-400 bg-amber-100 text-amber-900";
              } else if (isAnswered) {
                btnClass = "border-[#135E36] bg-[#135E36] text-white";
              }

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`relative flex h-8 w-9 items-center justify-center rounded-lg border font-mono text-xs font-extrabold transition ${btnClass} ${
                    isCurrent ? "ring-2 ring-[#6CC24A] ring-offset-1" : ""
                  }`}
                  title={`Câu ${idx + 1}: ${q.mondaiLabel}`}
                >
                  {idx + 1}
                  {isFlagged && (
                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Palette Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-[#135E36]" /> Đã làm
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm border border-slate-300 bg-slate-50" />{" "}
              Chưa làm
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm border border-amber-400 bg-amber-100" />{" "}
              Đánh dấu xem lại
            </span>
          </div>
        </div>
      </div>

      {/* MAIN QUESTION WORKSPACE */}
      {activeQuestion && (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
          {/* Active Question Top Meta Bar */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="rounded-xl bg-[#135E36] px-3 py-1 font-mono text-xs font-extrabold text-white">
                Câu {activeIndex + 1} / {orderedQuestions.length}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FAF8F2] px-3 py-1 text-xs font-bold text-[#135E36]">
                {activeQuestion.type === "standard" && (
                  <BookOpen className="h-3.5 w-3.5" />
                )}
                {activeQuestion.type === "star" && (
                  <Star className="h-3.5 w-3.5 text-amber-600" />
                )}
                {activeQuestion.type === "dokkai" && (
                  <FileText className="h-3.5 w-3.5 text-sky-700" />
                )}
                {activeQuestion.type === "choukai" && (
                  <Headphones className="h-3.5 w-3.5 text-purple-700" />
                )}
                {activeQuestion.mondaiLabel}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-bold text-slate-700">
                {activeQuestion.points} điểm
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleToggleFlag(activeQuestion.id)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-bold transition ${
                flagged[activeQuestion.id]
                  ? "border-amber-400 bg-amber-100 text-amber-900"
                  : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Flag
                className={`h-3.5 w-3.5 ${
                  flagged[activeQuestion.id] ? "fill-amber-600 text-amber-600" : ""
                }`}
              />
              {flagged[activeQuestion.id]
                ? "Đã đánh dấu xem lại"
                : "Đánh dấu xem lại"}
            </button>
          </div>

          {/* ==========================================================
           * FORMAT 3: DOKKAI (PASSAGE GROUP SPLIT VIEW)
           * ========================================================== */}
          {activeQuestion.type === "dokkai" ? (
            <div className="grid gap-6 lg:grid-cols-12">
              {/* Left Pane: Japanese Reading Passage */}
              <div className="rounded-2xl border border-sky-200/80 bg-[#FAF8F2] p-5 lg:col-span-6">
                <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#135E36]">
                    <FileText className="h-4 w-4" />
                    Văn bản Đọc hiểu (Dokkai Passage)
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-slate-600">
                    Đi kèm {dokkaiGroupQuestions.length} câu hỏi
                  </span>
                </div>

                {activeQuestion.passageTitle && (
                  <h2 className="mb-3 font-jp text-base font-extrabold text-slate-900">
                    <FuriganaText text={activeQuestion.passageTitle} />
                  </h2>
                )}

                <div className="whitespace-pre-line font-jp text-base leading-loose text-slate-800">
                  <FuriganaText text={activeQuestion.passageText || ""} />
                </div>
              </div>

              {/* Right Pane: Paired Child Sub-Questions */}
              <div className="space-y-5 lg:col-span-6">
                {dokkaiGroupQuestions.map((subQ) => {
                  const subGlobalIdx = orderedQuestions.findIndex(
                    (item) => item.id === subQ.id
                  );
                  const selectedOpt = answers[subQ.id];
                  const isFocused = subQ.id === activeQuestion.id;

                  return (
                    <div
                      key={subQ.id}
                      onClick={() => setActiveIndex(subGlobalIdx)}
                      className={`rounded-2xl border p-5 transition ${
                        isFocused
                          ? "border-[#135E36] bg-white shadow-xs"
                          : "border-slate-200 bg-slate-50/50"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="rounded-lg bg-[#135E36] px-2.5 py-0.5 font-mono text-xs font-bold text-white">
                          Câu {subGlobalIdx + 1} ({subQ.points}đ)
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFlag(subQ.id);
                          }}
                          className={`inline-flex items-center gap-1 text-xs font-bold ${
                            flagged[subQ.id] ? "text-amber-700" : "text-slate-400"
                          }`}
                        >
                          <Flag className="h-3.5 w-3.5" />
                          {flagged[subQ.id] ? "Đã đánh dấu" : "Xem lại"}
                        </button>
                      </div>

                      {subQ.instruction && (
                        <p className="mb-1.5 text-xs font-semibold text-slate-500">
                          {subQ.instruction}
                        </p>
                      )}

                      <p className="mb-4 font-jp text-base font-bold text-slate-900">
                        <FuriganaText text={subQ.prompt} />
                      </p>

                      <div className="space-y-2.5">
                        {subQ.options.map((opt, optIdx) => {
                          const isSelected = selectedOpt === optIdx;
                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectOption(subQ.id, optIdx);
                              }}
                              className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left font-jp text-sm transition ${
                                isSelected
                                  ? "border-[#135E36] bg-emerald-50 font-bold text-[#135E36] shadow-2xs"
                                  : "border-slate-200 bg-white text-slate-800 hover:border-[#135E36]/40"
                              }`}
                            >
                              <span
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-extrabold ${
                                  isSelected
                                    ? "bg-[#135E36] text-white"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {["A", "B", "C", "D"][optIdx]}
                              </span>
                              <span className="leading-relaxed">
                                <FuriganaText text={opt} />
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* ==========================================================
             * FORMATS 1, 2, 4: STANDARD, STAR (★), AND CHOUKAI
             * ========================================================== */
            <div className="space-y-5">
              {activeQuestion.instruction && (
                <p className="text-xs font-bold text-slate-500">
                  💡 Hướng dẫn: {activeQuestion.instruction}
                </p>
              )}

              {/* Question Prompt */}
              <div className="rounded-2xl border border-slate-200/80 bg-[#FAF8F2] p-5">
                <p className="font-jp text-lg font-bold leading-loose text-slate-900">
                  <FuriganaText text={activeQuestion.prompt} />
                </p>
              </div>

              {/* ========================================================
               * FORMAT 4: CHOUKAI AUDIO PLAYER WITH PLAY-LIMIT CONTROL
               * ======================================================== */}
              {activeQuestion.type === "choukai" && (
                <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-5">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3.5">
                      <button
                        type="button"
                        onClick={() => handlePlayChoukaiAudio(activeQuestion)}
                        disabled={
                          playingQuestionId !== activeQuestion.id &&
                          (activeQuestion.audioPlayLimit ?? 0) > 0 &&
                          (audioPlays[activeQuestion.id] ?? 0) >=
                            (activeQuestion.audioPlayLimit ?? 0)
                        }
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#135E36] text-white shadow-sm transition hover:bg-[#0f4a2a] disabled:cursor-not-allowed disabled:bg-slate-300"
                      >
                        {playingQuestionId === activeQuestion.id ? (
                          <Pause className="h-5 w-5 text-[#6CC24A]" />
                        ) : (
                          <Play className="ml-0.5 h-5 w-5 text-[#6CC24A]" />
                        )}
                      </button>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-xs font-extrabold text-purple-950">
                            <Volume2 className="h-4 w-4 text-purple-700" />
                            {activeQuestion.audioTitle || "Choukai Audio Track.mp3"}
                          </span>
                          <span className="rounded-full bg-white px-2.5 py-0.5 font-mono text-xs font-bold text-slate-600">
                            00:{String(activeQuestion.audioDurationSec || 24).padStart(2, "0")}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-600">
                          {playingQuestionId === activeQuestion.id
                            ? "Đang phát băng nghe tiếng Nhật... Hãy chú ý lắng nghe!"
                            : "Nhấn nút Play để bắt đầu nghe đoạn hội thoại."}
                        </p>
                      </div>
                    </div>

                    {/* Play Limit Counter Badge */}
                    <div className="rounded-xl border border-purple-200 bg-white px-4 py-2.5 text-right">
                      <p className="text-xs font-bold text-slate-500">
                        Giới hạn số lần nghe
                      </p>
                      <p className="font-mono text-sm font-extrabold text-purple-900">
                        {(activeQuestion.audioPlayLimit ?? 0) === 0
                          ? `Đã nghe ${audioPlays[activeQuestion.id] ?? 0} lần (Không giới hạn)`
                          : `Đã nghe ${audioPlays[activeQuestion.id] ?? 0} / ${activeQuestion.audioPlayLimit} lần`}
                      </p>
                    </div>
                  </div>

                  {/* Audio Progress Bar */}
                  <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-[#135E36] transition-all duration-300"
                      style={{
                        width:
                          playingQuestionId === activeQuestion.id
                            ? `${audioProgress}%`
                            : "0%",
                      }}
                    />
                  </div>
                </div>
              )}

              {/* ========================================================
               * FORMAT 2: STAR (★) SENTENCE BUILDER INTERACTIVE SLOTS
               * ======================================================== */}
              {activeQuestion.type === "star" && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-900">
                      <Star className="h-4 w-4 fill-amber-500 text-amber-600" />
                      Khung lắp ghép câu 4 vị trí (Nhấn vào các mảnh từ bên dưới để điền vào ô và chọn đáp án ở vị trí ★)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleResetStarSlots(activeQuestion)}
                      className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-white px-2.5 py-1 text-xs font-bold text-amber-900 hover:bg-amber-100"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Xóa xếp lại
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 rounded-xl border border-amber-200/80 bg-white p-4 font-jp text-base text-slate-900">
                    <span className="font-bold">
                      <FuriganaText text={activeQuestion.starPrefix || ""} />
                    </span>

                    {[0, 1, 2, 3].map((slotIdx) => {
                      const isStar = (activeQuestion.starSlotIndex ?? 2) === slotIdx;
                      const currentSlots =
                        starSlots[activeQuestion.id] ?? [null, null, null, null];
                      const filledOptIdx = currentSlots[slotIdx];
                      const filledText =
                        filledOptIdx !== null && filledOptIdx !== undefined
                          ? activeQuestion.options[filledOptIdx]
                          : null;

                      return (
                        <div
                          key={slotIdx}
                          className={`inline-flex min-h-11 min-w-28 items-center justify-center gap-1.5 rounded-xl border-2 px-3.5 py-1.5 text-sm font-bold transition ${
                            isStar
                              ? "border-amber-500 bg-amber-100/90 text-amber-950 shadow-2xs"
                              : "border-dashed border-slate-300 bg-slate-50 text-slate-700"
                          }`}
                        >
                          {isStar && (
                            <Star className="h-4 w-4 shrink-0 fill-amber-500 text-amber-600" />
                          )}
                          {filledText ? (
                            <FuriganaText text={filledText} />
                          ) : (
                            <span className="font-sans text-xs font-semibold text-slate-400">
                              {isStar ? "Vị trí ★" : `Ô trống ${slotIdx + 1}`}
                            </span>
                          )}
                        </div>
                      );
                    })}

                    <span className="font-bold">
                      <FuriganaText text={activeQuestion.starSuffix || ""} />
                    </span>
                  </div>
                </div>
              )}

              {/* 4 OPTIONS (A, B, C, D) */}
              <div className="grid gap-3 sm:grid-cols-2">
                {activeQuestion.options.map((opt, optIdx) => {
                  const isSelected = answers[activeQuestion.id] === optIdx;
                  const currentSlots =
                    starSlots[activeQuestion.id] ?? [null, null, null, null];
                  const slotOrder = currentSlots.indexOf(optIdx);

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => {
                        if (activeQuestion.type === "star") {
                          handleStarWordClick(activeQuestion, optIdx);
                        } else {
                          handleSelectOption(activeQuestion.id, optIdx);
                        }
                      }}
                      className={`flex items-center justify-between gap-3 rounded-2xl border p-4 text-left font-jp text-base transition ${
                        isSelected
                          ? "border-[#135E36] bg-emerald-50/90 font-bold text-[#135E36] shadow-xs"
                          : "border-slate-200 bg-white text-slate-800 hover:border-[#135E36]/40 hover:bg-slate-50/60"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-extrabold ${
                            isSelected
                              ? "bg-[#135E36] text-white"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {["A", "B", "C", "D"][optIdx]}
                        </span>
                        <span className="leading-relaxed">
                          <FuriganaText text={opt} />
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {activeQuestion.type === "star" && slotOrder !== -1 && (
                          <span className="rounded-lg bg-amber-100 px-2 py-0.5 font-sans text-xs font-bold text-amber-900">
                            Ô {slotOrder + 1}
                            {(activeQuestion.starSlotIndex ?? 2) === slotOrder
                              ? " (★)"
                              : ""}
                          </span>
                        )}
                        {isSelected && (
                          <CheckCircle2 className="h-5 w-5 shrink-0 text-[#135E36]" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Question Footer Navigation */}
          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
            <button
              type="button"
              disabled={activeIndex === 0}
              onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Câu trước
            </button>

            <span className="text-xs font-semibold text-slate-500">
              Đã chọn{" "}
              <strong className="text-[#135E36]">
                {answeredCount}/{orderedQuestions.length}
              </strong>{" "}
              câu hỏi
            </span>

            {activeIndex < orderedQuestions.length - 1 ? (
              <button
                type="button"
                onClick={() =>
                  setActiveIndex((i) =>
                    Math.min(orderedQuestions.length - 1, i + 1)
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#135E36] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#0f4a2a]"
              >
                Câu tiếp theo
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmitExam(false)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#135E36] px-5 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-[#0f4a2a]"
              >
                <Award className="h-4 w-4 text-[#6CC24A]" />
                Hoàn thành & Nộp bài
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
