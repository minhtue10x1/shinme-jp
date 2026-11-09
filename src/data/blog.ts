export type BlogPost = {
  slug: string;
  title: string;
  titleJa?: string;
  category: string;
  date: string;
  readMinutes: number;
  excerpt: string;
};

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "lich-thi-jlpt-2027",
    title: "Lịch thi JLPT 2027 & cách chọn kỳ thi phù hợp",
    titleJa: "日本語能力試験[にほんごのうりょくしけん]",
    category: "JLPT",
    date: "05/11/2026",
    readMinutes: 6,
    excerpt: "Hai kỳ thi tháng 7 và tháng 12: nên đăng ký kỳ nào, cần ôn bao lâu cho từng cấp độ.",
  },
  {
    slug: "meo-nho-kanji",
    title: "5 mẹo nhớ Kanji bằng bộ thủ cho người mới",
    titleJa: "漢字[かんじ]",
    category: "Kanji",
    date: "28/10/2026",
    readMinutes: 4,
    excerpt: "Tách chữ thành bộ thủ, kể chuyện bằng hình ảnh và ôn lặp lại ngắt quãng.",
  },
  {
    slug: "kaiwa-cong-so",
    title: "Kaiwa công sở: 12 câu nói dùng mỗi ngày",
    titleJa: "お疲[つか]れ様[さま]です",
    category: "Kaiwa",
    date: "20/10/2026",
    readMinutes: 5,
    excerpt: "Từ お疲れ様です đến よろしくお願いします — dùng đúng lúc, đúng người.",
  },
];

