/**
 * Mock data for Phase 1 (demo only). Replace with real Shinme curriculum,
 * schedules and tuition before launch.
 */

import type { Language } from "@/lib/i18n/types";
import { pickLang } from "@/lib/i18n/context";

export type LevelId = "N5" | "N4" | "N3" | "N2" | "N1" | "KAIWA";

export type Level = {
  id: LevelId;
  label: string;
  /** Growth-stage name shown on the roadmap track. */
  stageVi: string;
  stageEn: string;
  stageJa: string;
  summary: string;
  summaryEn: string;
  summaryJa: string;
  duration: string;
  durationEn: string;
  durationJa: string;
};

export const LEVELS: Level[] = [
  {
    id: "N5",
    label: "N5",
    stageVi: "Gieo hạt",
    stageEn: "Seed",
    stageJa: "種[たね]",
    summary: "Bảng chữ Hiragana, Katakana, ~100 Kanji và câu giao tiếp cơ bản.",
    summaryEn: "Hiragana, Katakana, ~100 Kanji, and essential daily conversation.",
    summaryJa: "ひらがな・カタカナ、約100字の漢字と基本会話。",
    duration: "3 tháng",
    durationEn: "3 months",
    durationJa: "3ヶ月",
  },
  {
    id: "N4",
    label: "N4",
    stageVi: "Nảy mầm",
    stageEn: "Sprout",
    stageJa: "芽[め]",
    summary: "Hoàn thành sơ cấp: thể thông thường, kính ngữ cơ bản, ~300 Kanji.",
    summaryEn: "Complete elementary: plain form, basic keigo, and ~300 Kanji.",
    summaryJa: "初級修了：普通形・基本敬語・約300字の漢字。",
    duration: "3 tháng",
    durationEn: "3 months",
    durationJa: "3ヶ月",
  },
  {
    id: "N3",
    label: "N3",
    stageVi: "Lá non",
    stageEn: "Young Leaf",
    stageJa: "若葉[わかば]",
    summary: "Cầu nối trung cấp: đọc hiểu đoạn văn, nghe hội thoại tự nhiên.",
    summaryEn: "Intermediate bridge: paragraph reading and natural listening.",
    summaryJa: "中級の架け橋：長文読解と自然な会話の聴解。",
    duration: "5 tháng",
    durationEn: "5 months",
    durationJa: "5ヶ月",
  },
  {
    id: "N2",
    label: "N2",
    stageVi: "Thành cây",
    stageEn: "Tree",
    stageJa: "木[き]",
    summary: "Tiếng Nhật công sở, báo chí, đủ điều kiện nhiều visa và học bổng.",
    summaryEn: "Business Japanese, news reading, qualifying for visas and scholarships.",
    summaryJa: "ビジネス日本語・記事読解、就労ビザや奨学金に対応。",
    duration: "6 tháng",
    durationEn: "6 months",
    durationJa: "6ヶ月",
  },
  {
    id: "N1",
    label: "N1",
    stageVi: "Rừng xanh",
    stageEn: "Forest",
    stageJa: "森[もり]",
    summary: "Thượng cấp: văn viết học thuật, tranh luận và biên – phiên dịch.",
    summaryEn: "Advanced: academic writing, debate, and translation/interpretation.",
    summaryJa: "上級：学術論文・討論・翻訳および通訳の基礎。",
    duration: "7 tháng",
    durationEn: "7 months",
    durationJa: "7ヶ月",
  },
  {
    id: "KAIWA",
    label: "Kaiwa",
    stageVi: "Cành giao tiếp",
    stageEn: "Kaiwa",
    stageJa: "会話[かいわ]",
    summary: "Nhánh phản xạ nói song song mọi trình độ, học với Sensei người Nhật.",
    summaryEn: "Parallel speaking reflex track for all levels with native Japanese Senseis.",
    summaryJa: "全レベル対応・日本人講師との実践会話トレーニング。",
    duration: "2 tháng / khóa",
    durationEn: "2 months / course",
    durationJa: "2ヶ月 / コース",
  },
];

export type CourseStatus = "open" | "soon" | "full";

export type Course = {
  id: string;
  level: LevelId;
  name: string;
  nameEn: string;
  nameJa: string;
  schedule: string;
  scheduleEn: string;
  scheduleJa: string;
  time: string;
  format: "Offline" | "Online" | "Hybrid";
  startDate: string;
  sessions: number;
  tuition: number;
  status: CourseStatus;
  seatsLeft?: number;
  sensei: string;
  outcomes: string[];
  outcomesEn: string[];
  outcomesJa: string[];
};

export const COURSES: Course[] = [
  {
    id: "n5-k27",
    level: "N5",
    name: "Sơ cấp N5 — Khởi động",
    nameEn: "Elementary N5 — Kickstart",
    nameJa: "初級[しょきゅう]N5・スタート",
    schedule: "Thứ 2 · 4 · 6",
    scheduleEn: "Mon · Wed · Fri",
    scheduleJa: "月・水・金",
    time: "18:30 – 20:30",
    format: "Offline",
    startDate: "18/11/2026",
    sessions: 36,
    tuition: 4_200_000,
    status: "open",
    seatsLeft: 6,
    sensei: "Nguyễn Thu Hà Sensei",
    outcomes: [
      "Đọc – viết thành thạo Hiragana, Katakana",
      "Tự giới thiệu, hỏi đường, mua sắm",
      "Sẵn sàng thi JLPT N5 tháng 7",
    ],
    outcomesEn: [
      "Master reading and writing Hiragana & Katakana",
      "Self-introduction, asking directions, and shopping",
      "Ready for the July JLPT N5 exam",
    ],
    outcomesJa: [
      "ひらがな・カタカナの読み書きを完全習得",
      "自己紹介・道案内・買い物などの基本会話",
      "7月JLPT N5合格に向けた基礎固め",
    ],
  },
  {
    id: "n5-online",
    level: "N5",
    name: "Sơ cấp N5 — Online tối",
    nameEn: "Elementary N5 — Evening Online",
    nameJa: "初級[しょきゅう]N5・夜間オンライン",
    schedule: "Thứ 3 · 5 · 7",
    scheduleEn: "Tue · Thu · Sat",
    scheduleJa: "火・木・土",
    time: "20:00 – 21:30",
    format: "Online",
    startDate: "02/12/2026",
    sessions: 40,
    tuition: 3_600_000,
    status: "soon",
    sensei: "Lê Minh Đức Sensei",
    outcomes: [
      "Lớp tối đa 12 học viên qua Zoom",
      "Bài tập chấm hằng tuần trên Cổng học viên",
      "Ghi hình buổi học để ôn lại",
    ],
    outcomesEn: [
      "Small Zoom class capped at 12 learners",
      "Weekly graded assignments on the Student Portal",
      "Recorded sessions available for review",
    ],
    outcomesJa: [
      "Zoom少人数制（最大12名）の双方向授業",
      "ポータル上で毎週の課題を添削・フィードバック",
      "復習用の録画アーカイブを完備",
    ],
  },
  {
    id: "n4-k12",
    level: "N4",
    name: "Sơ cấp N4 — Hoàn thiện",
    nameEn: "Elementary N4 — Consolidation",
    nameJa: "初級[しょきゅう]N4・完成",
    schedule: "Thứ 2 · 4 · 6",
    scheduleEn: "Mon · Wed · Fri",
    scheduleJa: "月・水・金",
    time: "19:00 – 21:00",
    format: "Hybrid",
    startDate: "25/11/2026",
    sessions: 36,
    tuition: 4_600_000,
    status: "open",
    seatsLeft: 3,
    sensei: "田中[たなか] Yuki Sensei",
    outcomes: [
      "Nắm chắc 50 bài Minna no Nihongo",
      "Viết email, nhật ký ngắn bằng tiếng Nhật",
      "Đạt JLPT N4 với điểm an toàn",
    ],
    outcomesEn: [
      "Solidify all 50 lessons of Minna no Nihongo",
      "Write short emails and diaries in Japanese",
      "Pass JLPT N4 with a safe margin",
    ],
    outcomesJa: [
      "『みんなの日本語』全50課を確実に定着",
      "日本語での簡単なメール・日記作成",
      "余裕をもってJLPT N4合格を目指す",
    ],
  },
  {
    id: "n3-k08",
    level: "N3",
    name: "Trung cấp N3 — Cầu nối",
    nameEn: "Intermediate N3 — Bridge",
    nameJa: "中級[ちゅうきゅう]N3・ブリッジ",
    schedule: "Thứ 3 · 5",
    scheduleEn: "Tue · Thu",
    scheduleJa: "火・木",
    time: "18:30 – 21:00",
    format: "Offline",
    startDate: "09/12/2026",
    sessions: 40,
    tuition: 6_800_000,
    status: "soon",
    sensei: "Nguyễn Thu Hà Sensei",
    outcomes: [
      "Đọc hiểu văn bản 400–600 chữ",
      "Luyện Mondai theo cấu trúc đề JLPT mới",
      "Phỏng vấn thực tập sinh, kỹ sư",
    ],
    outcomesEn: [
      "Read and comprehend 400–600 character passages",
      "Practice Mondai matching the latest JLPT format",
      "Prepare for trainee & engineer interviews",
    ],
    outcomesJa: [
      "400〜600字程度の中文読解力を養成",
      "最新のJLPT出題形式に沿った問題演習",
      "技能実習生・エンジニア面接対策にも対応",
    ],
  },
  {
    id: "n2-k05",
    level: "N2",
    name: "Luyện thi N2 — Tăng tốc",
    nameEn: "JLPT N2 — Intensive Prep",
    nameJa: "N2対策[たいさく]・スピード合格",
    schedule: "Thứ 7 · Chủ nhật",
    scheduleEn: "Sat · Sun",
    scheduleJa: "土・日",
    time: "08:30 – 11:30",
    format: "Hybrid",
    startDate: "30/11/2026",
    sessions: 48,
    tuition: 8_900_000,
    status: "open",
    seatsLeft: 8,
    sensei: "佐藤[さとう] Kenji Sensei",
    outcomes: [
      "Chiến lược làm bài & quản lý thời gian",
      "Đề thi thử hằng tháng, chấm và phân tích",
      "Tiếng Nhật thương mại cơ bản",
    ],
    outcomesEn: [
      "Exam strategy and time management techniques",
      "Monthly mock tests with detailed score analysis",
      "Foundational business Japanese",
    ],
    outcomesJa: [
      "試験戦略と時間配分テクニックの習得",
      "毎月の模擬試験と詳細な弱点分析",
      "実務で使えるビジネス日本語の基礎",
    ],
  },
  {
    id: "n1-k02",
    level: "N1",
    name: "Thượng cấp N1 — Chuyên sâu",
    nameEn: "Advanced N1 — Mastery",
    nameJa: "上級[じょうきゅう]N1・徹底攻略",
    schedule: "Thứ 3 · 6",
    scheduleEn: "Tue · Fri",
    scheduleJa: "火・金",
    time: "19:00 – 21:30",
    format: "Offline",
    startDate: "06/01/2027",
    sessions: 56,
    tuition: 11_500_000,
    status: "soon",
    sensei: "佐藤[さとう] Kenji Sensei",
    outcomes: [
      "Đọc xã luận, văn bản học thuật",
      "Từ vựng & ngữ pháp N1 hệ thống",
      "Nền tảng cho biên – phiên dịch",
    ],
    outcomesEn: [
      "Read editorials and academic essays fluently",
      "Systematic mastery of N1 vocabulary and grammar",
      "Foundation for professional translation & interpretation",
    ],
    outcomesJa: [
      "社説や学術的文章の精読・要旨把握",
      "N1レベルの語彙・文法の体系的整理",
      "翻訳・通訳を目指すための高度な表現力",
    ],
  },
  {
    id: "kaiwa-k15",
    level: "KAIWA",
    name: "Kaiwa phản xạ cùng Sensei Nhật",
    nameEn: "Reflex Kaiwa with Native Sensei",
    nameJa: "会話[かいわ]クラス（日本人講師）",
    schedule: "Thứ 7",
    scheduleEn: "Saturday",
    scheduleJa: "土曜日",
    time: "14:00 – 16:00",
    format: "Offline",
    startDate: "21/11/2026",
    sessions: 8,
    tuition: 2_400_000,
    status: "open",
    seatsLeft: 4,
    sensei: "田中[たなか] Yuki Sensei",
    outcomes: [
      "Nhập vai tình huống công sở, nhà hàng, ga tàu",
      "Sửa phát âm & ngữ điệu trực tiếp",
      "Lớp tối đa 8 người, yêu cầu từ N4",
    ],
    outcomesEn: [
      "Role-play office, restaurant, and station scenarios",
      "Live pronunciation and pitch-accent correction",
      "Max 8 learners per class (N4+ required)",
    ],
    outcomesJa: [
      "職場・飲食店・駅などの実践ロールプレイ",
      "発音・イントネーションをその場で指導",
      "最大8名の少人数制（N4相当以上）",
    ],
  },
  {
    id: "kaiwa-interview",
    level: "KAIWA",
    name: "Kaiwa phỏng vấn đi Nhật",
    nameEn: "Japan Job Interview Kaiwa",
    nameJa: "面接[めんせつ]対策[たいさく]クラス",
    schedule: "Thứ 4 · Chủ nhật",
    scheduleEn: "Wed · Sun",
    scheduleJa: "水・日",
    time: "19:30 – 21:00",
    format: "Online",
    startDate: "15/11/2026",
    sessions: 10,
    tuition: 2_900_000,
    status: "full",
    sensei: "田中[たなか] Yuki Sensei",
    outcomes: [
      "Bộ 60 câu hỏi phỏng vấn thường gặp",
      "Phỏng vấn thử 1–1 có ghi hình",
      "Tác phong & kính ngữ khi phỏng vấn",
    ],
    outcomesEn: [
      "Master 60 frequently asked interview questions",
      "Recorded 1-on-1 mock interviews with feedback",
      "Japanese business etiquette and keigo for interviews",
    ],
    outcomesJa: [
      "よく聞かれる面接質問60選を徹底練習",
      "録画付きの1対1模擬面接フィードバック",
      "面接時のマナーと正しい敬語表現",
    ],
  },
];

export const STATUS_META: Record<CourseStatus, { label: string; tone: "leaf" | "warn" | "neutral" }> = {
  open: { label: "Đang tuyển sinh", tone: "leaf" },
  soon: { label: "Sắp khai giảng", tone: "warn" },
  full: { label: "Đã đủ lớp", tone: "neutral" },
};

export function localizeLevel(level: Level, lang: Language) {
  return {
    stage: pickLang(lang, level.stageVi, level.stageEn, level.stageJa),
    summary: pickLang(lang, level.summary, level.summaryEn, level.summaryJa),
    duration: pickLang(lang, level.duration, level.durationEn, level.durationJa),
  };
}

export function localizeCourse(course: Course, lang: Language) {
  return {
    name: pickLang(lang, course.name, course.nameEn, course.nameJa),
    schedule: pickLang(lang, course.schedule, course.scheduleEn, course.scheduleJa),
    outcomes: lang === "en" ? course.outcomesEn : lang === "ja" ? course.outcomesJa : course.outcomes,
  };
}

