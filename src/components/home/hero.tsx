"use client";

import Image from "next/image";
import { ArrowRight, Check, Heart, Sparkles } from "lucide-react";
import { FuriganaText } from "@/components/furigana-text";
import { Button } from "@/components/ui/button";
import { PLACEMENT_TEST } from "@/data/placement-test";
import { useHome } from "./home-context";

const FIRST = PLACEMENT_TEST[0];

export function Hero() {
  const { openTest, goToConsultation } = useHome();

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 pb-20 pt-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-10 lg:px-8 lg:pb-28 lg:pt-16">
        <div className="animate-[rise-in_700ms_var(--ease-out-expo)_both]">
          <FuriganaText
            as="p"
            text="日本語[にほんご]で未来[みらい]をひらく"
            className="text-[clamp(2.3rem,5.4vw,4.4rem)] font-black leading-[1.55] tracking-[0.02em] text-shinme-primary"
            rtClassName="text-shinme-primary-soft tracking-[0.18em]"
          />

          <h1
            id="hero-title"
            className="mt-4 max-w-[22ch] text-balance text-[clamp(1.5rem,2.5vw,2.15rem)] font-extrabold leading-snug text-shinme-ink"
          >
            Học tiếng Nhật bài bản — từ chữ あ đầu tiên đến tấm bằng JLPT N1.
          </h1>

          <p className="mt-5 max-w-[58ch] text-lg leading-relaxed text-shinme-muted">
            Lộ trình rõ ràng theo từng cấp độ, lớp nhỏ cùng Sensei người Nhật và người Việt, bài tập được chấm
            mỗi tuần trên Cổng học viên. Bạn chỉ cần bắt đầu — Shinme đồng hành phần còn lại.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => goToConsultation()}>
              Đăng ký tư vấn
              <ArrowRight />
            </Button>
            <Button size="lg" variant="outline" onClick={() => openTest()}>
              <Sparkles />
              Test trình độ miễn phí
            </Button>
          </div>

          <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-[0.95rem] font-semibold text-shinme-ink-soft">
            {["Lớp tối đa 12 học viên", "Offline · Online · Hybrid", "Lộ trình N5 → N1 & Kaiwa"].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <span className="grid size-5 place-items-center rounded-full bg-shinme-leaf text-shinme-primary">
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* Mascot + inline first question */}
        <div className="relative mx-auto w-full max-w-[30rem] pb-36 sm:pb-28 lg:mx-0 lg:ml-auto">
          <figure className="relative aspect-[338/352] w-[88%] overflow-hidden rounded-[2rem] bg-shinme-primary shadow-[var(--shadow-lift)] sm:ml-auto">
            <Image
              src="/brand/shinme-mascot.jpg"
              alt="Linh vật Shinme — bé mầm xanh đội mũ hai lá đang cổ vũ học viên"
              fill
              priority
              sizes="(min-width: 1024px) 420px, 88vw"
              className="object-cover"
            />
            <figcaption className="sr-only">Linh vật Shinme cổ vũ: Cố lên!</figcaption>
          </figure>

          <div
            aria-hidden="true"
            className="absolute -top-3 left-0 animate-[leaf-pop_700ms_var(--ease-out-expo)_400ms_both] rounded-2xl rounded-bl-sm bg-shinme-surface px-4 py-2.5 text-lg font-black text-shinme-primary shadow-[var(--shadow-card)] sm:left-2"
          >
            <span className="inline-flex items-center gap-1.5">
              Cố lên! <Heart className="size-4 fill-shinme-accent text-shinme-accent" />
            </span>
          </div>

          <div className="absolute bottom-0 left-0 right-6 rounded-2xl border border-shinme-border bg-shinme-surface p-5 shadow-[var(--shadow-lift)] sm:right-16">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-extrabold text-shinme-primary">Thi thử Mini · Câu 1/5</p>
              <span className="text-xs font-semibold text-shinme-muted">~3 phút</span>
            </div>
            <p className="mt-2 text-sm text-shinme-muted">{FIRST.hint}</p>
            <FuriganaText as="p" text={FIRST.prompt} className="mt-1 text-xl font-bold text-shinme-ink" />
            <div className="mt-3 grid grid-cols-4 gap-2">
              {FIRST.options.map((opt, i) => (
                <button
                  key={opt}
                  type="button"
                  lang="ja"
                  onClick={() => openTest(i)}
                  className="h-11 rounded-xl border-2 border-shinme-border font-jp text-lg font-bold text-shinme-ink transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:border-shinme-accent hover:bg-shinme-leaf-faint"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

