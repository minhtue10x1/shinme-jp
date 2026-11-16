"use client";

import Link from "next/link";
import { FuriganaText } from "@/components/furigana-text";
import { ShinmeWordmark } from "@/components/brand/logo";
import { useTranslation } from "@/lib/i18n/context";

export function Footer() {
  const { t, lang } = useTranslation();

  return (
    <footer className="bg-shinme-primary-deep text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <ShinmeWordmark />
          <FuriganaText
            as="p"
            text="日本語[にほんご]で未来[みらい]をひらく"
            className="mt-4 text-lg font-bold leading-[2] text-shinme-accent"
          />
          <p className="mt-1 text-sm text-white/65">
            {lang === "vi"
              ? "Trung tâm Nhật ngữ Shinme — Mở ra tương lai bằng tiếng Nhật."
              : "Shinme Japanese Language Center — Opening futures through Japanese."}
          </p>
        </div>
        <nav aria-label="Explore / Khám phá">
          <p className="text-sm font-extrabold text-white/60">
            {lang === "vi" ? "Khám phá" : "Explore"}
          </p>
          <ul className="mt-3 space-y-2 font-semibold">
            <li><a className="hover:text-shinme-accent" href="#lo-trinh">{t.nav.roadmap}</a></li>
            <li><a className="hover:text-shinme-accent" href="#sensei">{t.nav.sensei}</a></li>
            <li><a className="hover:text-shinme-accent" href="#thi-thu">{t.nav.mockTest}</a></li>
            <li><a className="hover:text-shinme-accent" href="#tu-van">{t.home.hero.ctaConsultation}</a></li>
          </ul>
        </nav>
        <div>
          <p className="text-sm font-extrabold text-white/60">
            {lang === "vi" ? "Dành cho học viên & Sensei" : "For Learners & Senseis"}
          </p>
          <ul className="mt-3 space-y-2 font-semibold">
            <li><Link className="hover:text-shinme-accent" href="/portal">{t.nav.portal}</Link></li>
            <li><Link className="hover:text-shinme-accent" href="/portal/assignments">{t.portal.sidebar.assignments}</Link></li>
            <li><Link className="hover:text-shinme-accent" href="/portal/materials">{t.portal.sidebar.materials}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-5 py-5 text-xs text-white/50 lg:px-8">
          {t.home.footer.copyright}
        </p>
      </div>
    </footer>
  );
}
