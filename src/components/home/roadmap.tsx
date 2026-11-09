"use client";

import { useRef, type KeyboardEvent } from "react";
import { BellRing, CalendarDays, Check, Clock, MapPin, Sprout, UserRound } from "lucide-react";
import { FuriganaText } from "@/components/furigana-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { COURSES, LEVELS, STATUS_META, type LevelId } from "@/data/courses";
import { cn, formatVnd } from "@/lib/utils";
import { useHome } from "./home-context";

const STAGES = LEVELS.filter((l) => l.id !== "KAIWA");
const KAIWA = LEVELS.find((l) => l.id === "KAIWA")!;

export function Roadmap() {
  const { activeLevel, setActiveLevel, goToConsultation } = useHome();
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const order = LEVELS.map((l) => l.id);
  const stageIndex = STAGES.findIndex((s) => s.id === activeLevel);
  const level = LEVELS.find((l) => l.id === activeLevel)!;
  const courses = COURSES.filter((c) => c.level === activeLevel);

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const i = order.indexOf(activeLevel);
    let next: number | null = null;
    if (e.key === "ArrowRight") next = (i + 1) % order.length;
    if (e.key === "ArrowLeft") next = (i - 1 + order.length) % order.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = order.length - 1;
    if (next === null) return;
    e.preventDefault();
    const id = order[next] as LevelId;
    setActiveLevel(id);
    tabRefs.current[id]?.focus();
  };

  const renderTab = (l: (typeof LEVELS)[number], growth: number) => {
    const active = l.id === activeLevel;
    const reached = l.id !== "KAIWA" && stageIndex >= 0 && STAGES.findIndex((s) => s.id === l.id) <= stageIndex;
    return (
      <button
        key={l.id}
        ref={(el) => {
          tabRefs.current[l.id] = el;
        }}
        role="tab"
        id={`tab-${l.id}`}
        aria-selected={active}
        aria-controls="roadmap-panel"
        tabIndex={active ? 0 : -1}
        onClick={() => setActiveLevel(l.id)}
        onKeyDown={onKeyDown}
        className="group relative flex flex-1 flex-col items-center gap-2 rounded-2xl px-1 pb-3 pt-1 text-center focus-visible:outline-shinme-accent"
      >
        <span
          className={cn(
            "relative z-10 grid size-14 place-items-center rounded-full border-2 transition-[background-color,border-color,transform] duration-500 ease-[var(--ease-out-expo)]",
            active
              ? "scale-110 border-shinme-accent bg-shinme-accent text-shinme-primary-deep"
              : reached
                ? "border-shinme-accent bg-shinme-primary-deep text-shinme-accent"
                : "border-white/20 bg-shinme-primary-deep text-white/60 group-hover:border-white/50 group-hover:text-white",
          )}
        >
          <Sprout
            key={active ? "on" : "off"}
            style={{ width: `${14 + growth * 3}px`, height: `${14 + growth * 3}px` }}
            className={cn(active && "animate-[leaf-pop_500ms_var(--ease-out-expo)]")}
            strokeWidth={2.2}
          />
        </span>
        <span className={cn("text-xl font-black", active ? "text-white" : "text-white/75")}>{l.label}</span>
        <span className={cn("text-sm font-semibold", active ? "text-shinme-accent" : "text-white/55")}>
          {l.stageVi}
        </span>
      </button>
    );
  };

  return (
    <section
      id="lo-trinh"
      aria-labelledby="roadmap-title"
      className="bg-shinme-primary text-white [background-image:radial-gradient(60rem_30rem_at_85%_-10%,rgb(108_194_74/0.18),transparent_60%)]"
    >
      <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <h2 id="roadmap-title" className="text-3xl font-extrabold sm:text-4xl">
              Lộ trình khóa học
            </h2>
            <p className="mt-3 max-w-[56ch] text-lg leading-relaxed text-white/75">
              Từ hạt giống N5 đến cánh rừng N1 — chọn cấp độ để xem lịch học, học phí và kết quả đầu ra của
              từng lớp.
            </p>
          </div>
        </div>

        {/* Growth track */}
        <div className="-mx-5 mt-12 overflow-x-auto px-5 pb-2 lg:mx-0 lg:px-0">
          <div role="tablist" aria-label="Chọn cấp độ" className="flex min-w-[46rem] items-start gap-4">
            <div className="relative flex flex-[5]">
              <span aria-hidden className="absolute left-[10%] right-[10%] top-[1.95rem] h-1 rounded-full bg-white/15" />
              <span
                aria-hidden
                className="absolute left-[10%] top-[1.95rem] h-1 rounded-full bg-shinme-accent transition-[width] duration-700 ease-[var(--ease-out-expo)]"
                style={{ width: `${Math.max(stageIndex, 0) * 20}%` }}
              />
              {STAGES.map((s, i) => renderTab(s, i))}
            </div>
            <div className="relative flex flex-1 items-start">
              <span
                aria-hidden
                className={cn(
                  "absolute -left-4 top-[1.95rem] h-0 w-[calc(50%+1rem)] border-t-[3px] border-dashed",
                  activeLevel === "KAIWA" ? "border-shinme-accent" : "border-white/20",
                )}
              />
              {renderTab(KAIWA, 2)}
            </div>
          </div>
        </div>

        {/* Panel */}
        <div
          id="roadmap-panel"
          role="tabpanel"
          aria-labelledby={`tab-${activeLevel}`}
          key={activeLevel}
          className="mt-10 animate-[rise-in_420ms_var(--ease-out-expo)_both]"
        >
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-white/15 pb-5">
            <FuriganaText text={level.stageJa} className="text-3xl font-black text-shinme-accent" />
            <p className="text-lg font-semibold text-white/85">{level.summary}</p>
            <p className="text-sm font-bold text-white/60 sm:ml-auto">Thời lượng: {level.duration}</p>
          </div>

          <ul className="mt-6 grid gap-5 lg:grid-cols-2">
            {courses.map((c) => {
              const status = STATUS_META[c.status];
              return (
                <li
                  key={c.id}
                  className="flex flex-col rounded-2xl border border-shinme-border bg-shinme-surface p-6 text-shinme-ink shadow-[var(--shadow-card)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-extrabold">{c.name}</h3>
                      <FuriganaText text={c.nameJa} className="mt-0.5 block text-sm font-bold text-shinme-primary" />
                    </div>
                    <Badge tone={status.tone}>
                      {c.status === "open" && <span className="size-1.5 rounded-full bg-shinme-accent" />}
                      {status.label}
                      {c.seatsLeft !== undefined && c.status === "open" && ` · còn ${c.seatsLeft} chỗ`}
                    </Badge>
                  </div>

                  <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <CalendarDays className="mt-0.5 size-4 shrink-0 text-shinme-primary" />
                      <div>
                        <dt className="sr-only">Lịch học</dt>
                        <dd className="font-bold">{c.schedule}</dd>
                        <dd className="tabular text-shinme-muted">{c.time}</dd>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="mt-0.5 size-4 shrink-0 text-shinme-primary" />
                      <div>
                        <dt className="sr-only">Khai giảng</dt>
                        <dd className="font-bold">KG {c.startDate}</dd>
                        <dd className="text-shinme-muted">{c.sessions} buổi</dd>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 size-4 shrink-0 text-shinme-primary" />
                      <div>
                        <dt className="sr-only">Hình thức</dt>
                        <dd className="font-bold">{c.format}</dd>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <UserRound className="mt-0.5 size-4 shrink-0 text-shinme-primary" />
                      <div>
                        <dt className="sr-only">Sensei</dt>
                        <dd className="font-bold">
                          <FuriganaText text={c.sensei} lang="vi" />
                        </dd>
                      </div>
                    </div>
                  </dl>

                  <div className="mt-5 rounded-xl bg-shinme-leaf-faint p-4">
                    <p className="text-sm font-extrabold text-shinme-primary">Đầu ra sau khóa học</p>
                    <ul className="mt-2 space-y-1.5">
                      {c.outcomes.map((o) => (
                        <li key={o} className="flex gap-2 text-sm text-shinme-ink-soft">
                          <Check className="mt-0.5 size-4 shrink-0 text-shinme-primary" strokeWidth={3} />
                          {o}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-6">
                    <div>
                      <p className="text-xs font-bold text-shinme-muted">Học phí trọn khóa</p>
                      <p className="tabular text-2xl font-black text-shinme-primary">{formatVnd(c.tuition)}</p>
                    </div>
                    {c.status === "full" ? (
                      <Button variant="outline" onClick={() => goToConsultation({ course: `${c.name} (lớp kế tiếp)` })}>
                        <BellRing />
                        Báo tôi lớp kế tiếp
                      </Button>
                    ) : (
                      <Button onClick={() => goToConsultation({ course: c.name })}>
                        Đăng ký giữ chỗ
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-6 text-sm text-white/55">
            Lịch khai giảng và học phí mang tính tham khảo (dữ liệu demo). Học phí đã gồm giáo trình và tài khoản Cổng học viên.
          </p>
        </div>
      </div>
    </section>
  );
}
