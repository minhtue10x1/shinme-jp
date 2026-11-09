"use client";

import Image from "next/image";
import { Sparkles, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLACEMENT_TEST } from "@/data/placement-test";
import { useHome } from "./home-context";

export function MiniTestBand() {
  const { openTest } = useHome();
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
            Bạn đang ở trình độ nào?
          </h2>
          <p className="mt-2 max-w-[56ch] text-lg leading-relaxed text-shinme-ink-soft">
            5 câu Mondai từ N5 đến N2, chấm điểm ngay sau mỗi câu và gợi ý lớp phù hợp. Không cần đăng nhập.
          </p>
          <ol className="mt-4 flex flex-wrap gap-2" aria-label="Cấu trúc bài thi">
            {PLACEMENT_TEST.map((q, i) => (
              <li
                key={q.id}
                className="rounded-full bg-shinme-surface px-3 py-1 text-sm font-bold text-shinme-ink-soft"
              >
                Câu {i + 1} · <span className="text-shinme-primary">{q.level}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex flex-col items-start gap-2 md:items-end">
          <Button size="lg" onClick={() => openTest()}>
            <Sparkles />
            Bắt đầu Thi thử Mini
          </Button>
          <span className="flex items-center gap-1.5 text-sm font-semibold text-shinme-ink-soft">
            <Timer className="size-4" /> Khoảng 3 phút
          </span>
        </div>
      </div>
    </section>
  );
}

