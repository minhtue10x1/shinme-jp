"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, RotateCcw, Sprout, XCircle } from "lucide-react";
import { FuriganaText } from "@/components/furigana-text";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PLACEMENT_TEST, recommendByScore } from "@/data/placement-test";
import { cn } from "@/lib/utils";
import { useHome } from "./home-context";

const TOTAL = PLACEMENT_TEST.length;
const CURRENT_LEVEL_BY_SCORE = ["Mới bắt đầu", "Mới bắt đầu", "N5", "N4", "N3", "N2"];

export function PlacementTestDialog() {
  const { testOpen, closeTest } = useHome();
  return (
    <Dialog open={testOpen} onOpenChange={(o) => !o && closeTest()}>
      <DialogContent className="max-w-2xl">
        <Quiz />
      </DialogContent>
    </Dialog>
  );
}

function Quiz() {
  const { firstAnswer, goToCourses, goToConsultation } = useHome();
  const [answers, setAnswers] = useState<(number | null)[]>(() =>
    PLACEMENT_TEST.map((_, i) => (i === 0 ? firstAnswer : null)),
  );
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);

  const q = PLACEMENT_TEST[index];
  const picked = answers[index];
  const answered = picked !== null;
  const score = answers.filter((a, i) => a === PLACEMENT_TEST[i].answer).length;

  const pick = (opt: number) => {
    if (answered) return;
    setAnswers((prev) => prev.map((a, i) => (i === index ? opt : a)));
  };

  const next = () => {
    if (index < TOTAL - 1) setIndex(index + 1);
    else setDone(true);
  };

  const restart = () => {
    setAnswers(PLACEMENT_TEST.map(() => null));
    setIndex(0);
    setDone(false);
  };

  if (done) {
    const rec = recommendByScore(score);
    return (
      <div className="p-6 sm:p-8">
        <DialogTitle className="pr-10 text-2xl font-extrabold text-shinme-ink">Kết quả Thi thử Mini</DialogTitle>
        <DialogDescription className="mt-1 text-shinme-muted">
          Bạn trả lời đúng <strong className="text-shinme-primary">{score}/{TOTAL}</strong> câu.
        </DialogDescription>

        <ol className="mt-5 flex gap-2" aria-label="Đáp án từng câu">
          {PLACEMENT_TEST.map((item, i) => {
            const ok = answers[i] === item.answer;
            return (
              <li
                key={item.id}
                className={cn(
                  "flex h-12 flex-1 flex-col items-center justify-center rounded-xl text-xs font-extrabold",
                  ok ? "bg-shinme-leaf text-shinme-primary" : "bg-shinme-danger-soft text-shinme-danger",
                )}
              >
                {ok ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
                <span>
                  Câu {i + 1} · {item.level}
                </span>
              </li>
            );
          })}
        </ol>

        <div className="mt-6 rounded-2xl bg-shinme-primary p-6 text-white">
          <p className="flex items-center gap-2 text-sm font-bold text-shinme-accent">
            <Sprout className="size-4" /> Shinme gợi ý cho bạn
          </p>
          <p className="mt-2 text-2xl font-black">{rec.title}</p>
          <p className="mt-2 leading-relaxed text-white/80">{rec.message}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              variant="onDark"
              onClick={() =>
                goToConsultation({
                  level: CURRENT_LEVEL_BY_SCORE[score],
                  course: rec.title,
                  testScore: score,
                })
              }
            >
              Nhận lộ trình chi tiết
              <ArrowRight />
            </Button>
            <Button variant="onDarkOutline" onClick={() => goToCourses(rec.level)}>
              Xem lịch khóa {rec.level}
            </Button>
          </div>
        </div>

        <p className="mt-4 text-sm text-shinme-muted">
          Bài thi thử chỉ mang tính tham khảo. Sensei sẽ kiểm tra thêm kỹ năng nghe – nói khi bạn đến tư vấn.
        </p>
        <Button variant="ghost" size="sm" className="mt-3" onClick={restart}>
          <RotateCcw /> Làm lại từ đầu
        </Button>
      </div>
    );
  }

  const correct = picked === q.answer;

  return (
    <div className="p-6 sm:p-8">
      <div className="pr-10">
        <DialogTitle className="text-lg font-extrabold text-shinme-ink">Thi thử Mini — 5 câu, ~3 phút</DialogTitle>
        <DialogDescription className="sr-only">
          Bài kiểm tra nhanh 5 câu từ N5 đến N2, chấm điểm ngay và gợi ý khóa học phù hợp.
        </DialogDescription>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div
          className="h-2 flex-1 overflow-hidden rounded-full bg-shinme-bg-deep"
          role="progressbar"
          aria-label="Tiến độ bài thi"
          aria-valuemin={0}
          aria-valuemax={TOTAL}
          aria-valuenow={index + (answered ? 1 : 0)}
        >
          <div
            className="h-full rounded-full bg-shinme-accent transition-[width] duration-500 ease-[var(--ease-out-expo)]"
            style={{ width: `${((index + (answered ? 1 : 0)) / TOTAL) * 100}%` }}
          />
        </div>
        <span className="tabular text-sm font-bold text-shinme-muted">
          {index + 1}/{TOTAL}
        </span>
      </div>

      <div key={q.id} className="animate-[rise-in_360ms_var(--ease-out-expo)_both]">
        <p className="mt-6 flex items-center gap-2 text-sm font-bold text-shinme-muted">
          <span className="rounded-full bg-shinme-leaf px-2 py-0.5 text-xs font-extrabold text-shinme-primary">
            Mondai · {q.level}
          </span>
          {q.hint}
        </p>
        <FuriganaText
          as="p"
          text={q.prompt}
          className="mt-3 text-2xl font-bold leading-[2] text-shinme-ink sm:text-[1.7rem]"
        />

        <div role="group" aria-label="Các lựa chọn" className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {q.options.map((opt, i) => {
            const isPicked = picked === i;
            const isAnswer = q.answer === i;
            return (
              <button
                key={opt}
                type="button"
                aria-pressed={isPicked}
                disabled={answered && !isPicked && !isAnswer}
                onClick={() => pick(i)}
                className={cn(
                  "flex min-h-14 items-center gap-3 rounded-xl border-2 px-4 text-left transition-[border-color,background-color,opacity] duration-200",
                  !answered && "border-shinme-border hover:border-shinme-accent hover:bg-shinme-leaf-faint",
                  answered && isAnswer && "border-shinme-accent bg-shinme-leaf",
                  answered && isPicked && !isAnswer && "border-shinme-danger bg-shinme-danger-soft",
                  answered && !isPicked && !isAnswer && "border-shinme-border opacity-50",
                )}
              >
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full text-sm font-extrabold",
                    answered && isAnswer
                      ? "bg-shinme-primary text-white"
                      : answered && isPicked
                        ? "bg-shinme-danger text-white"
                        : "bg-shinme-bg-deep text-shinme-ink-soft",
                  )}
                >
                  {String.fromCharCode(65 + i)}
                </span>
                <span lang="ja" className="font-jp text-lg font-bold text-shinme-ink">
                  {opt}
                </span>
              </button>
            );
          })}
        </div>

        <div aria-live="polite" className="min-h-[5.5rem]">
          {answered && (
            <div
              className={cn(
                "mt-4 flex gap-3 rounded-xl p-4 animate-[rise-in_300ms_var(--ease-out-expo)_both]",
                correct ? "bg-shinme-leaf-faint" : "bg-shinme-danger-soft",
              )}
            >
              {correct ? (
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-shinme-primary" />
              ) : (
                <XCircle className="mt-0.5 size-5 shrink-0 text-shinme-danger" />
              )}
              <div>
                <p className={cn("font-extrabold", correct ? "text-shinme-primary" : "text-shinme-danger")}>
                  {correct ? "Chính xác! すごい！" : `Chưa đúng — đáp án là ${String.fromCharCode(65 + q.answer)}`}
                </p>
                <FuriganaText as="p" lang="vi" text={q.explain} className="mt-0.5 text-sm leading-[1.9] text-shinme-ink-soft" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" disabled={index === 0} onClick={() => setIndex(index - 1)}>
          Câu trước
        </Button>
        <Button disabled={!answered} onClick={next}>
          {index < TOTAL - 1 ? "Câu tiếp theo" : "Xem kết quả"}
          <ArrowRight />
        </Button>
      </div>
    </div>
  );
}
