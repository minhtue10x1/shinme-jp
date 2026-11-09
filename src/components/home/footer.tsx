import Link from "next/link";
import { FuriganaText } from "@/components/furigana-text";
import { ShinmeWordmark } from "@/components/brand/logo";

export function Footer() {
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
          <p className="mt-1 text-sm text-white/65">Trung tâm Nhật ngữ Shinme — Mở ra tương lai bằng tiếng Nhật.</p>
        </div>
        <nav aria-label="Khám phá">
          <p className="text-sm font-extrabold text-white/60">Khám phá</p>
          <ul className="mt-3 space-y-2 font-semibold">
            <li><a className="hover:text-shinme-accent" href="#lo-trinh">Lộ trình khóa học</a></li>
            <li><a className="hover:text-shinme-accent" href="#sensei">Đội ngũ Sensei</a></li>
            <li><a className="hover:text-shinme-accent" href="#thi-thu">Thi thử Mini</a></li>
            <li><a className="hover:text-shinme-accent" href="#tu-van">Đăng ký tư vấn</a></li>
          </ul>
        </nav>
        <div>
          <p className="text-sm font-extrabold text-white/60">Dành cho học viên & Sensei</p>
          <ul className="mt-3 space-y-2 font-semibold">
            <li><Link className="hover:text-shinme-accent" href="/portal">Cổng LMS Shinme</Link></li>
            <li><Link className="hover:text-shinme-accent" href="/portal/assignments">Bài tập & Mondai</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-5 py-5 text-xs text-white/50 lg:px-8">
          © 2026 Shinme Japanese Language Center. Bản demo Phase 1 — dữ liệu minh họa.
        </p>
      </div>
    </footer>
  );
}

