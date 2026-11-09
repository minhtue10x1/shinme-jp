/**
 * Mock data for Phase 1 (demo only). Replace with real Shinme curriculum,
 * schedules and tuition before launch.
 */

export type LevelId = "N5" | "N4" | "N3" | "N2" | "N1" | "KAIWA";

export type Level = {
  id: LevelId;
  label: string;
  /** Growth-stage name shown on the roadmap track. */
  stageVi: string;
  stageJa: string;
  summary: string;
  duration: string;
};

export const LEVELS: Level[] = [
  {
    id: "N5",
    label: "N5",
    stageVi: "Gieo hạt",
    stageJa: "種[たね]",
    summary: "Bảng chữ Hiragana, Katakana, ~100 Kanji và câu giao tiếp cơ bản.",
    duration: "3 tháng",
  },
  {
    id: "N4",
    label: "N4",
    stageVi: "Nảy mầm",
    stageJa: "芽[め]",
    summary: "Hoàn thành sơ cấp: thể thông thường, kính ngữ cơ bản, ~300 Kanji.",
    duration: "3 tháng",
  },
  {
    id: "N3",
    label: "N3",
    stageVi: "Lá non",
    stageJa: "若葉[わかば]",
    summary: "Cầu nối trung cấp: đọc hiểu đoạn văn, nghe hội thoại tự nhiên.",
    duration: "5 tháng",
  },
  {
    id: "N2",
    label: "N2",
    stageVi: "Thành cây",
    stageJa: "木[き]",
    summary: "Tiếng Nhật công sở, báo chí, đủ điều kiện nhiều visa và học bổng.",
    duration: "6 tháng",
  },
  {
    id: "N1",
    label: "N1",
    stageVi: "Rừng xanh",
    stageJa: "森[もり]",
    summary: "Thượng cấp: văn viết học thuật, tranh luận và biên – phiên dịch.",
    duration: "7 tháng",
  },
  {
    id: "KAIWA",
    label: "Kaiwa",
    stageVi: "Cành giao tiếp",
    stageJa: "会話[かいわ]",
    summary: "Nhánh phản xạ nói song song mọi trình độ, học với Sensei người Nhật.",
    duration: "2 tháng / khóa",
  },
];

export type CourseStatus = "open" | "soon" | "full";

export type Course = {
  id: string;
  level: LevelId;
  name: string;
  nameJa: string;
  schedule: string;
  time: string;
  format: "Offline" | "Online" | "Hybrid";
  startDate: string;
  sessions: number;
  tuition: number;
  status: CourseStatus;
  seatsLeft?: number;
  sensei: string;
  outcomes: string[];
};

export const COURSES: Course[] = [
  {
    id: "n5-k27",
    level: "N5",
    name: "Sơ cấp N5 — Khởi động",
    nameJa: "初級[しょきゅう]N5",
    schedule: "Thứ 2 · 4 · 6",
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
  },
  {
    id: "n5-online",
    level: "N5",
    name: "Sơ cấp N5 — Online tối",
    nameJa: "初級[しょきゅう]N5・オンライン",
    schedule: "Thứ 3 · 5 · 7",
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
  },
  {
    id: "n4-k12",
    level: "N4",
    name: "Sơ cấp N4 — Hoàn thiện",
    nameJa: "初級[しょきゅう]N4",
    schedule: "Thứ 2 · 4 · 6",
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
  },
  {
    id: "n3-k08",
    level: "N3",
    name: "Trung cấp N3 — Cầu nối",
    nameJa: "中級[ちゅうきゅう]N3",
    schedule: "Thứ 3 · 5",
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
  },
  {
    id: "n2-k05",
    level: "N2",
    name: "Luyện thi N2 — Tăng tốc",
    nameJa: "N2対策[たいさく]",
    schedule: "Thứ 7 · Chủ nhật",
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
  },
  {
    id: "n1-k02",
    level: "N1",
    name: "Thượng cấp N1 — Chuyên sâu",
    nameJa: "上級[じょうきゅう]N1",
    schedule: "Thứ 3 · 6",
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
  },
  {
    id: "kaiwa-k15",
    level: "KAIWA",
    name: "Kaiwa phản xạ cùng Sensei Nhật",
    nameJa: "会話[かいわ]クラス",
    schedule: "Thứ 7",
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
  },
  {
    id: "kaiwa-interview",
    level: "KAIWA",
    name: "Kaiwa phỏng vấn đi Nhật",
    nameJa: "面接[めんせつ]対策[たいさく]",
    schedule: "Thứ 4 · Chủ nhật",
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
  },
];

export const STATUS_META: Record<CourseStatus, { label: string; tone: "leaf" | "warn" | "neutral" }> = {
  open: { label: "Đang tuyển sinh", tone: "leaf" },
  soon: { label: "Sắp khai giảng", tone: "warn" },
  full: { label: "Đã đủ lớp", tone: "neutral" },
};

