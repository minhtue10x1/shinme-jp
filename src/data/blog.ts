import type { Language } from "@/lib/i18n/types";
import { pickLang } from "@/lib/i18n/context";

export type BlogPost = {
  slug: string;
  title: string;
  titleEn: string;
  titleJa?: string;
  category: string;
  date: string;
  readMinutes: number;
  excerpt: string;
  excerptEn: string;
  excerptJa: string;
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "lich-thi-jlpt-2027",
    title: "Lịch thi JLPT 2027 & cách chọn kỳ thi phù hợp",
    titleEn: "2027 JLPT Schedule & How to Choose the Right Exam Session",
    titleJa: "日本語能力試験[にほんごのうりょくしけん] 2027年日程と受験対策",
    category: "JLPT",
    date: "05/11/2026",
    readMinutes: 6,
    excerpt: "Hai kỳ thi tháng 7 và tháng 12: nên đăng ký kỳ nào, cần ôn bao lâu cho từng cấp độ.",
    excerptEn: "July vs. December sessions: which one to register for and how long to prepare for each level.",
    excerptJa: "7月・12月の年2回試験：どちらを受けるべきか、レベル別の必要学習期間を解説。",
  },
  {
    slug: "meo-nho-kanji",
    title: "5 mẹo nhớ Kanji bằng bộ thủ cho người mới",
    titleEn: "5 Radical-Based Kanji Memory Tips for Beginners",
    titleJa: "漢字[かんじ]・初心者のための部首暗記5つのコツ",
    category: "Kanji",
    date: "28/10/2026",
    readMinutes: 4,
    excerpt: "Tách chữ thành bộ thủ, kể chuyện bằng hình ảnh và ôn lặp lại ngắt quãng.",
    excerptEn: "Break characters into radicals, build visual stories, and review with spaced repetition.",
    excerptJa: "漢字を部首に分解し、イメージストーリーと間隔反復で効率よく定着させましょう。",
  },
  {
    slug: "kaiwa-cong-so",
    title: "Kaiwa công sở: 12 câu nói dùng mỗi ngày",
    titleEn: "Office Kaiwa: 12 Everyday Japanese Phrases",
    titleJa: "お疲[つか]れ様[さま]です・職場で毎日使う12フレーズ",
    category: "Kaiwa",
    date: "20/10/2026",
    readMinutes: 5,
    excerpt: "Từ お疲れ様です đến よろしくお願いします — dùng đúng lúc, đúng người.",
    excerptEn: "From お疲れ様です to よろしくお願いします — use them at the right time with the right person.",
    excerptJa: "「お疲れ様です」から「よろしくお願いします」まで、相手と場面に合わせた使い分け。",
  },
];

export function localizeBlogPost(post: BlogPost, lang: Language) {
  return {
    title: pickLang(lang, post.title, post.titleEn, post.titleJa || post.titleEn),
    excerpt: pickLang(lang, post.excerpt, post.excerptEn, post.excerptJa),
  };
}

