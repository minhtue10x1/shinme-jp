"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  Flag,
  RotateCcw,
  Sparkles,
  XCircle,
} from "lucide-react";
import { FuriganaText } from "@/components/furigana-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MOCK_EXAM_N4, type ExamQuestion } from "@/data/exam-data";
import { cn } from "@/lib/utils";

export function ExamClient() {
  const router = useRouter();
  const exam = MOCK_EXAM_N4; // Default to N4 mock exam
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(exam.durationMinutes * 60);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  // Timer countdown
  useEffect(() => {
    if (isSubmitted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isSubmitted, timeLeft]);

  const currentQ: ExamQuestion = exam.questions[currentIndex];
  const totalQuestions = exam.questions.length;
  const answeredCount = Object.keys(answers).length;

  const selectAnswer = (optIndex: number) => {
    if (isSubmitted) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: optIndex }));
  };

  const toggleFlag = (qId: string) => {
    setFlags((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Score Calculation
  const totalEarnedPoints = exam.questions.reduce((sum, q) => {
    return answers[q.id] === q.correctIndex ? sum + q.points : sum;
  }, 0);
  const isPassed = totalEarnedPoints >= exam.passPoints;

  if (isSubmitted) {
    return (
      <div className="mx-auto max-w-4xl space-y-8 py-6 animate-[rise-in_260ms_var(--ease-out-expo)_both]">
        {/* Results Banner */}
        <div className="rounded-3xl border border-shinme-border bg-shinme-surface p-6 sm:p-10 shadow-[var(--shadow-lift)] text-center">
          <div
            className={cn(
              "mx-auto grid size-20 place-items-center rounded-full text-white mb-4",
              isPassed ? "bg-shinme-primary shadow-[0_10px_30px_rgba(19,94,54,0.3)]" : "bg-shinme-danger"
            )}
          >
            {isPassed ? <Award className="size-10" /> : <AlertCircle className="size-10" />}
          </div>

          <h1 className="text-3xl font-black text-shinme-ink">
            {isPassed ? "Chúc mừng bạn đã đạt kết quả! 合格[ごうかく]！" : "Cần cố gắng thêm một chút! もう少[すこ]し！"}
          </h1>
          <p className="mt-2 text-sm text-shinme-muted">
            {exam.title} · <FuriganaText text={exam.titleJa} className="font-bold text-shinme-primary" />
          </p>

          <div className="mt-8 inline-flex items-baseline gap-3 rounded-2xl bg-shinme-bg px-8 py-4 border border-shinme-line">
            <span className="text-sm font-extrabold text-shinme-muted">Tổng điểm:</span>
            <span className="text-5xl font-black tabular text-shinme-primary">{totalEarnedPoints}</span>
            <span className="text-lg font-bold text-shinme-muted">/ {exam.totalPoints} đ</span>
          </div>

          <p className="mt-4 text-xs font-semibold text-shinme-muted">
            Điểm đỗ yêu cầu: <strong className="text-shinme-ink">{exam.passPoints} đ</strong> ({answeredCount}/{totalQuestions} câu đã trả lời)
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/portal/assignments">
                <ArrowLeft /> Quay về danh sách bài tập
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                setAnswers({});
                setFlags({});
                setTimeLeft(exam.durationMinutes * 60);
                setIsSubmitted(false);
                setCurrentIndex(0);
              }}
            >
              <RotateCcw /> Làm lại đề này
            </Button>
          </div>
        </div>

        {/* Detailed Question Review */}
        <div className="space-y-4">
          <h2 className="text-xl font-black text-shinme-ink flex items-center gap-2">
            <Sparkles className="size-5 text-shinme-accent" /> Chi tiết đáp án & Giải thích ngữ pháp
          </h2>

          <div className="space-y-4">
            {exam.questions.map((q, idx) => {
              const userAns = answers[q.id];
              const isCorrect = userAns === q.correctIndex;
              return (
                <div
                  key={q.id}
                  className={cn(
                    "rounded-2xl border p-6 bg-shinme-surface shadow-[var(--shadow-card)]",
                    isCorrect ? "border-shinme-accent/50" : "border-shinme-danger/30"
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-shinme-line pb-3">
                    <span className="text-xs font-black uppercase text-shinme-primary bg-shinme-leaf px-2.5 py-1 rounded-md">
                      Mondai {q.mondaiNumber} · Câu {idx + 1} ({q.points} điểm)
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-xs font-extrabold px-3 py-1 rounded-full",
                        isCorrect ? "bg-shinme-leaf text-shinme-primary" : "bg-shinme-danger-soft text-shinme-danger"
                      )}
                    >
                      {isCorrect ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
                      {isCorrect ? "Chính xác" : "Chưa đúng"}
                    </span>
                  </div>

                  {q.context && (
                    <div className="mt-3 rounded-xl bg-shinme-bg p-3.5 text-sm text-shinme-ink-soft border border-shinme-line/60">
                      <FuriganaText text={q.context} lang="vi" />
                    </div>
                  )}

                  <p className="mt-3 text-lg font-bold text-shinme-ink leading-relaxed">
                    <FuriganaText text={q.prompt} />
                  </p>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {q.options.map((opt, oIdx) => {
                      const isOptionCorrect = oIdx === q.correctIndex;
                      const isUserChoice = oIdx === userAns;
                      return (
                        <div
                          key={opt}
                          className={cn(
                            "flex items-center gap-3 rounded-xl border p-3 text-sm font-medium",
                            isOptionCorrect
                              ? "border-shinme-accent bg-shinme-leaf text-shinme-primary font-bold"
                              : isUserChoice
                              ? "border-shinme-danger bg-shinme-danger-soft text-shinme-danger font-bold"
                              : "border-shinme-border text-shinme-ink-soft bg-shinme-surface opacity-75"
                          )}
                        >
                          <span className="grid size-6 place-items-center rounded-full text-xs font-black border border-current">
                            {oIdx + 1}
                          </span>
                          <FuriganaText text={opt} />
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 rounded-xl bg-shinme-leaf-faint p-4 text-xs text-shinme-ink-soft leading-relaxed border border-shinme-accent/30">
                    <strong className="text-shinme-primary font-bold">Giải thích: </strong>
                    <FuriganaText text={q.explainVi} lang="vi" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Top Test Header Bar */}
      <div className="sticky top-11 z-30 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-shinme-border bg-shinme-surface/95 px-5 py-3.5 backdrop-blur-md shadow-[var(--shadow-card)]">
        <div>
          <h1 className="text-base font-black text-shinme-ink">{exam.title}</h1>
          <p className="text-xs text-shinme-muted">
            <FuriganaText text={exam.titleJa} className="font-bold text-shinme-primary" /> · Mondai {currentQ.mondaiNumber} ({currentQ.section})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={cn(
              "flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-black tabular border",
              timeLeft < 300
                ? "bg-shinme-danger-soft text-shinme-danger border-shinme-danger animate-pulse"
                : "bg-shinme-bg text-shinme-primary border-shinme-line"
            )}
          >
            <Clock className="size-4" />
            <span>{formatTime(timeLeft)}</span>
          </div>

          <Button
            size="sm"
            onClick={() => setShowConfirmSubmit(true)}
            className="shadow-sm"
          >
            Nộp bài thi
          </Button>
        </div>
      </div>

      {/* Main Grid: Question Content & Navigator */}
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Left Column: Current Question */}
        <div className="rounded-3xl border border-shinme-border bg-shinme-surface p-6 sm:p-8 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between border-b border-shinme-line pb-4">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-shinme-leaf px-2.5 py-1 text-xs font-black text-shinme-primary">
                Câu {currentIndex + 1} / {totalQuestions}
              </span>
              <span className="text-xs font-bold text-shinme-muted">({currentQ.points} điểm)</span>
            </div>

            <button
              type="button"
              onClick={() => toggleFlag(currentQ.id)}
              className={cn(
                "flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-colors",
                flags[currentQ.id]
                  ? "bg-amber-100 text-amber-700 font-black"
                  : "bg-shinme-bg text-shinme-muted hover:text-shinme-ink"
              )}
            >
              <Flag className={cn("size-3.5", flags[currentQ.id] && "fill-current")} />
              {flags[currentQ.id] ? "Đã đánh dấu xem lại" : "Đánh dấu xem lại"}
            </button>
          </div>

          {/* Context memo if any */}
          {currentQ.context && (
            <div className="mt-5 rounded-2xl bg-shinme-bg p-5 text-base leading-relaxed text-shinme-ink-soft border border-shinme-line">
              <FuriganaText text={currentQ.context} lang="vi" />
            </div>
          )}

          {/* Prompt */}
          <div className="mt-5">
            <FuriganaText
              text={currentQ.prompt}
              className="text-xl sm:text-2xl font-black text-shinme-ink leading-[1.8]"
            />
          </div>

          {/* Options */}
          <div className="mt-8 space-y-3">
            {currentQ.options.map((opt, oIdx) => {
              const isSelected = answers[currentQ.id] === oIdx;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => selectAnswer(oIdx)}
                  className={cn(
                    "flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-[border-color,background-color,transform] duration-150 active:translate-y-px",
                    isSelected
                      ? "border-shinme-primary bg-shinme-leaf text-shinme-primary font-bold shadow-sm"
                      : "border-shinme-border bg-shinme-surface hover:border-shinme-accent hover:bg-shinme-leaf-faint"
                  )}
                >
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-xl text-sm font-black transition-colors",
                      isSelected ? "bg-shinme-primary text-white" : "bg-shinme-bg text-shinme-ink-soft"
                    )}
                  >
                    {oIdx + 1}
                  </span>
                  <span className="text-lg">
                    <FuriganaText text={opt} />
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bottom Nav Controls */}
          <div className="mt-10 flex items-center justify-between border-t border-shinme-line pt-5">
            <Button
              variant="outline"
              size="sm"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            >
              <ArrowLeft /> Câu trước
            </Button>
            <Button
              size="sm"
              disabled={currentIndex === totalQuestions - 1}
              onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
            >
              Câu tiếp theo <ArrowRight />
            </Button>
          </div>
        </div>

        {/* Right Column: Question Palette Matrix */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-shinme-border bg-shinme-surface p-5 shadow-[var(--shadow-card)]">
            <h2 className="text-sm font-black text-shinme-ink">Bản đồ câu hỏi (Mondai Map)</h2>
            <p className="mt-1 text-xs text-shinme-muted">
              Đã làm: <strong className="text-shinme-primary">{answeredCount}</strong> / {totalQuestions} câu
            </p>

            <div className="mt-4 grid grid-cols-4 gap-2">
              {exam.questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = answers[q.id] !== undefined;
                const isFlagged = flags[q.id];

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={cn(
                      "relative flex h-12 flex-col items-center justify-center rounded-xl border-2 font-mono text-sm font-black transition-all",
                      isCurrent && "border-shinme-primary ring-2 ring-shinme-primary/20 scale-105",
                      isAnswered && !isCurrent && "border-shinme-accent bg-shinme-leaf text-shinme-primary",
                      !isAnswered && !isCurrent && "border-shinme-border bg-shinme-bg text-shinme-muted hover:border-shinme-primary/40",
                      isFlagged && "after:absolute after:top-1 after:right-1 after:size-2 after:rounded-full after:bg-amber-500"
                    )}
                  >
                    <span>{idx + 1}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 space-y-1.5 border-t border-shinme-line pt-4 text-xs font-semibold text-shinme-muted">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-shinme-leaf border border-shinme-accent" />
                <span>Đã trả lời ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-shinme-bg border border-shinme-border" />
                <span>Chưa làm ({totalQuestions - answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-amber-500" />
                <span>Đã đánh dấu xem lại ({Object.values(flags).filter(Boolean).length})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-shinme-border bg-shinme-surface p-6 shadow-[var(--shadow-lift)] animate-[dialog-in_200ms_var(--ease-out-expo)]">
            <h3 className="text-xl font-black text-shinme-ink">Xác nhận nộp bài thi?</h3>
            <p className="mt-2 text-sm leading-relaxed text-shinme-muted">
              Bạn đã hoàn thành <strong className="text-shinme-primary">{answeredCount}/{totalQuestions}</strong> câu hỏi.
              {answeredCount < totalQuestions && " Vẫn còn một số câu chưa chọn đáp án!"}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <Button variant="ghost" size="sm" onClick={() => setShowConfirmSubmit(false)}>
                Tiếp tục làm bài
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setShowConfirmSubmit(false);
                  setIsSubmitted(true);
                }}
              >
                Xác nhận nộp
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
