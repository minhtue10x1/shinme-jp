/**
 * Furigana parser for Shinme.
 *
 * Syntax
 *   日本語[にほんご]で未来[みらい]をひらく
 *     → the reading in brackets attaches to the run of kanji immediately before it.
 *   ｜お茶[おちゃ]  or  |お茶[おちゃ]
 *     → an explicit pipe marks where the base starts, for bases that mix kana/kanji.
 *
 * Full-width brackets ［］ are accepted as well. Text with brackets but no
 * preceding kanji (e.g. "[note]") is kept verbatim.
 */

export type FuriganaSegment =
  | { type: "text"; text: string }
  | { type: "ruby"; base: string; reading: string };

const KANJI = /[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF々〆ヶ]/;
const PIPES = ["|", "｜"];
const BRACKETS: Record<string, string> = { "[": "]", "［": "］" };

export function parseFurigana(input: string): FuriganaSegment[] {
  const segments: FuriganaSegment[] = [];
  let buffer = "";
  let i = 0;

  const flush = () => {
    if (buffer) segments.push({ type: "text", text: buffer });
    buffer = "";
  };

  while (i < input.length) {
    const ch = input[i];
    const closeChar = BRACKETS[ch];

    if (!closeChar) {
      buffer += ch;
      i += 1;
      continue;
    }

    const close = input.indexOf(closeChar, i + 1);
    if (close === -1) {
      buffer += input.slice(i);
      break;
    }

    const reading = input.slice(i + 1, close).trim();
    let base = "";
    const pipeAt = Math.max(...PIPES.map((p) => buffer.lastIndexOf(p)));

    if (pipeAt !== -1) {
      base = buffer.slice(pipeAt + 1);
      buffer = buffer.slice(0, pipeAt);
    } else {
      let j = buffer.length;
      while (j > 0 && KANJI.test(buffer[j - 1])) j -= 1;
      base = buffer.slice(j);
      buffer = buffer.slice(0, j);
    }

    if (!base || !reading) {
      // Not a furigana annotation: keep the original characters.
      buffer += base + input.slice(i, close + 1);
    } else {
      flush();
      segments.push({ type: "ruby", base, reading });
    }
    i = close + 1;
  }

  flush();
  return segments;
}

/** Plain text without readings, e.g. for aria-labels or search. */
export function stripFurigana(input: string): string {
  return parseFurigana(input)
    .map((s) => (s.type === "ruby" ? s.base : s.text))
    .join("");
}

