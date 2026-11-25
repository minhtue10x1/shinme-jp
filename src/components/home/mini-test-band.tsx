"use client";

import Image from "next/image";
import { Sparkles, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLACEMENT_TEST } from "@/data/placement-test";
import { useHome } from "./home-context";
import { useTranslation } from "@/lib/i18n/context";

export function MiniTestBand() {
  const { openTest } = useHome();
  const { t, tr } = useTranslation();

  return (
    <section id="thi-thu" aria-labelledby="mini-test-title" className="px-5 lg:px-8">
      <div className="relative mx-auto grid max-w-7xl items-center gap-8 overflow-hidden rounded-[2rem] bg-shinme-leaf px-6 py-10 sm:px-10 md:grid-cols-[auto_1fr_auto] lg:px-14 lg:py-12">
        <div className="relative hidden size-36 overflow-hidden rounded-full border-4 border-shinme-surface shadow-[var(--shadow-card)] md:block">
          <Image
            src="/brand/shinme-mascot.jpg"
            alt=""
            fill
            sizes="144px"
            className="object-cover object-[45%_30%] scale-125"
          />
        </div>

        <div>
          <h2 id="mini-test-title" className="text-balance text-3xl font-extrabold text-shinme-primary-deep">
            {t.home.miniTest.title}
          </h2>
          <p className="mt-2 max-w-[56ch] text-lg leading-relaxed text-shinme-ink-soft">
            {tr(
              "5 câu Mondai từ N5 đến N2, chấm điểm ngay sau mỗi câu và gợi ý lớp phù hợp. Không cần đăng nhập.",
              "5 quick Mondai questions from N5 to N2, instant feedback and class recommendations. No login required.",
              "N5からN2までの5問を約3分でチェック。即時採点と最適なクラス提案がログイン不要で受けられます。"
            )}
          </p>
          <ol className="mt-4 flex flex-wrap gap-2" aria-label={tr("Cấu trúc bài thi", "Test Structure", "テスト構成")}>
            {PLACEMENT_TEST.map((q, i) => (
              <li
                key={q.id}
                className="rounded-full bg-shinme-surface px-3 py-1 text-sm font-bold text-shinme-ink-soft"
              >
                {tr(`Câu ${i + 1}`, `Q ${i + 1}`, `第${i + 1}問`)} · <span className="text-shinme-primary">{q.level}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-col items-start gap-2 md:items-end">
          <Button size="lg" onClick={() => openTest()}>
            <Sparkles />
            {t.home.miniTest.ctaButton}
          </Button>
          <span className="flex items-center gap-1.5 text-sm font-semibold text-shinme-ink-soft">
            <Timer className="size-4" /> {tr("Khoảng 3 phút", "~3 minutes", "約3分")}
          </span>
        </div>
      </div>
    </section>
  );
}
