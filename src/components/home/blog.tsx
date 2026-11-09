import { ArrowUpRight } from "lucide-react";
import { FuriganaText } from "@/components/furigana-text";
import { BLOG_POSTS } from "@/data/blog";

export function Blog() {
  return (
    <section id="blog" aria-labelledby="blog-title" className="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="blog-title" className="text-3xl font-extrabold text-shinme-ink sm:text-4xl">
          Blog học tiếng Nhật
        </h2>
        <a
          href="#blog"
          className="inline-flex items-center gap-1 font-bold text-shinme-primary underline-offset-4 hover:underline"
        >
          Tất cả bài viết <ArrowUpRight className="size-4" />
        </a>
      </div>

      <ul className="mt-10 divide-y divide-shinme-line border-y border-shinme-line">
        {BLOG_POSTS.map((p) => (
          <li key={p.slug}>
            <a
              href="#blog"
              className="group grid gap-2 py-7 transition-colors sm:grid-cols-[9rem_1fr_auto] sm:items-baseline sm:gap-8"
            >
              <span className="text-sm font-bold text-shinme-muted">
                <span className="text-shinme-primary">{p.category}</span> · {p.date}
              </span>
              <span>
                <span className="block text-xl font-extrabold text-shinme-ink transition-colors group-hover:text-shinme-primary sm:text-2xl">
                  {p.title}
                </span>
                {p.titleJa && (
                  <FuriganaText text={p.titleJa} className="mt-1 block text-sm font-bold text-shinme-primary-soft" />
                )}
                <span className="mt-2 block max-w-[64ch] leading-relaxed text-shinme-muted">{p.excerpt}</span>
              </span>
              <span className="inline-flex items-center gap-1 text-sm font-bold text-shinme-ink-soft">
                {p.readMinutes} phút đọc
                <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}

