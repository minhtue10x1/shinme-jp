import { parseFurigana } from "@/lib/furigana";
import { cn } from "@/lib/utils";

type FuriganaTextProps = {
  /** Source string using bracket syntax, e.g. `日本語[にほんご]で未来[みらい]をひらく`. */
  text: string;
  /** Hide readings while keeping the base text (e.g. a "hide furigana" practice toggle). */
  showFurigana?: boolean;
  className?: string;
  /** Classes applied to every `<rt>` element. */
  rtClassName?: string;
  as?: "span" | "p" | "div" | "h1" | "h2" | "h3" | "strong";
  /**
   * Language of the whole string. Defaults to `ja`; pass `vi` for Vietnamese
   * sentences that embed Japanese words — each `<ruby>` keeps `lang="ja"`.
   */
  lang?: string;
};

/**
 * Renders Japanese text with furigana as semantic `<ruby>` markup.
 * Pure and hook-free, so it works in Server and Client Components alike.
 */
export function FuriganaText({
  text,
  showFurigana = true,
  className,
  rtClassName,
  as: Tag = "span",
  lang = "ja",
}: FuriganaTextProps) {
  const segments = parseFurigana(text);

  return (
    <Tag lang={lang} className={cn(lang === "ja" && "font-jp", className)}>
      {segments.map((seg, i) =>
        seg.type === "text" ? (
          <span key={i}>{seg.text}</span>
        ) : showFurigana ? (
          <ruby key={i} lang="ja">
            {seg.base}
            <rp>(</rp>
            <rt className={rtClassName}>{seg.reading}</rt>
            <rp>)</rp>
          </ruby>
        ) : (
          <span key={i} lang="ja">
            {seg.base}
          </span>
        ),
      )}
    </Tag>
  );
}
