import { FuriganaText } from "@/components/furigana-text";
import { Badge } from "@/components/ui/badge";
import { SENSEIS } from "@/data/senseis";

export function SenseiTeam() {
  return (
    <section id="sensei" aria-labelledby="sensei-title" className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
      <div className="max-w-2xl">
        <h2 id="sensei-title" className="text-3xl font-extrabold text-shinme-ink sm:text-4xl">
          Đội ngũ Sensei
        </h2>
        <p className="mt-3 text-lg leading-relaxed text-shinme-muted">
          Sensei người Việt giúp bạn hiểu tận gốc ngữ pháp. Sensei người Nhật giúp bạn nói tự nhiên như người bản xứ.
          Mỗi lớp đều có cả hai.
        </p>
      </div>

      <ul className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {SENSEIS.map((s, i) => (
          <li key={s.id} className="group">
            <div
              className={
                "relative grid aspect-[4/3] place-items-center overflow-hidden rounded-2xl " +
                (i % 2 === 0 ? "bg-shinme-primary text-white" : "bg-shinme-leaf text-shinme-primary")
              }
            >
              <span
                lang={s.origin === "Nhật Bản" ? "ja" : "vi"}
                className="text-6xl font-black transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-110"
              >
                {s.initials}
              </span>
              <span className="absolute bottom-3 left-3">
                <Badge tone={i % 2 === 0 ? "leaf" : "primary"}>{s.levels}</Badge>
              </span>
            </div>
            <div className="mt-4">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <h3 className="text-xl font-extrabold text-shinme-ink">{s.name} Sensei</h3>
                <span className="text-sm font-semibold text-shinme-muted">· {s.origin}</span>
              </div>
              <FuriganaText text={s.nameJa} className="mt-0.5 block text-sm font-bold text-shinme-primary" />
              <p className="mt-2 text-sm font-bold text-shinme-ink-soft">{s.role}</p>
              <p className="mt-1 text-sm leading-relaxed text-shinme-muted">{s.focus}</p>
              <FuriganaText
                as="p"
                text={`「${s.quote}」`}
                className="mt-3 border-t border-shinme-line pt-3 text-[0.95rem] font-medium leading-[2] text-shinme-ink-soft"
              />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-10 text-sm text-shinme-muted">Hồ sơ Sensei là dữ liệu minh họa cho bản demo.</p>
    </section>
  );
}

