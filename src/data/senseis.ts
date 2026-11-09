/** Illustrative profiles for the Phase 1 demo — replace with the real Shinme team. */
export type Sensei = {
  id: string;
  name: string;
  nameJa: string;
  initials: string;
  role: string;
  origin: "Nhật Bản" | "Việt Nam";
  levels: string;
  focus: string;
  quote: string;
};

export const SENSEIS: Sensei[] = [
  {
    id: "SS-TANAKA",
    name: "Tanaka Yuki",
    nameJa: "田中[たなか] 由紀[ゆき]",
    initials: "田",
    role: "Trưởng bộ môn Kaiwa",
    origin: "Nhật Bản",
    levels: "N4 · Kaiwa",
    focus: "Phát âm, ngữ điệu và phản xạ hội thoại công sở.",
    quote: "間違[まちが]えても大丈夫[だいじょうぶ]。",
  },
  {
    id: "SS-SATO",
    name: "Satō Kenji",
    nameJa: "佐藤[さとう] 健二[けんじ]",
    initials: "佐",
    role: "Chuyên gia luyện thi",
    origin: "Nhật Bản",
    levels: "N2 · N1",
    focus: "Đọc hiểu học thuật, chiến lược làm đề JLPT.",
    quote: "毎日[まいにち]少[すこ]しずつ。",
  },
  {
    id: "SS-HA",
    name: "Nguyễn Thu Hà",
    nameJa: "グエン・トゥー・ハー",
    initials: "Hà",
    role: "Giáo viên sơ – trung cấp",
    origin: "Việt Nam",
    levels: "N5 · N3",
    focus: "Giải thích ngữ pháp bằng tiếng Việt, mẹo nhớ Kanji.",
    quote: "一緒[いっしょ]に頑張[がんば]ろう！",
  },
  {
    id: "SS-DUC",
    name: "Lê Minh Đức",
    nameJa: "レー・ミン・ドゥック",
    initials: "Đức",
    role: "Giáo viên lớp Online",
    origin: "Việt Nam",
    levels: "N5 · N4",
    focus: "Lớp online tương tác, theo sát bài tập hằng tuần.",
    quote: "継続[けいぞく]は力[ちから]なり。",
  },
];

