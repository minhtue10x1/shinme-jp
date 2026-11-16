"use client";

import { BookOpenCheck, Sprout, UsersRound } from "lucide-react";
import { FuriganaText } from "@/components/furigana-text";
import { useTranslation } from "@/lib/i18n/context";

export function About() {
  const { t } = useTranslation();

  const principles = [
    {
      icon: Sprout,
      title: t.home.about.principles.growth.title,
      body: t.home.about.principles.growth.body,
    },
    {
      icon: UsersRound,
      title: t.home.about.principles.smallClass.title,
      body: t.home.about.principles.smallClass.body,
    },
    {
      icon: BookOpenCheck,
      title: t.home.about.principles.lms.title,
      body: t.home.about.principles.lms.body,
    },
  ];

  return (
    <section id="ve-shinme" aria-labelledby="about-title" className="border-y border-shinme-line bg-shinme-surface">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-20 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20 lg:px-8 lg:py-28">
        <div>
          <h2 id="about-title" className="text-balance text-3xl font-extrabold leading-tight text-shinme-ink sm:text-4xl">
            {t.home.about.titlePrefix}
            <FuriganaText text="新芽[しんめ]" className="text-shinme-primary" /> — {t.home.about.meaning}
          </h2>
          <p className="mt-6 max-w-[54ch] text-lg leading-relaxed text-shinme-muted">
            {t.home.about.description}
          </p>
        </div>

        <ul className="divide-y divide-shinme-line">
          {principles.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-5 py-6 first:pt-0 last:pb-0">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-shinme-leaf text-shinme-primary">
                <Icon className="size-6" />
              </span>
              <div>
                <h3 className="text-xl font-extrabold text-shinme-ink">{title}</h3>
                <p className="mt-1.5 max-w-[60ch] leading-relaxed text-shinme-muted">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
