import type { Language } from "@/lib/i18n/types";
import { pickLang } from "@/lib/i18n/context";

/** Illustrative profiles for the Phase 1 demo — replace with the real Shinme team. */
export type Sensei = {
  id: string;
  name: string;
  nameJa: string;
  initials: string;
  role: string;
  roleEn: string;
  roleJa: string;
  origin: "Nhật Bản" | "Việt Nam";
  levels: string;
  focus: string;
  focusEn: string;
  focusJa: string;
  quote: string;
};

export const SENSEIS: Sensei[] = [
  {
    id: "SS-TANAKA",
    name: "Tanaka Yuki",
    nameJa: "田中[たなか] 由紀[ゆき]",
    initials: "田",
    role: "Trưởng bộ môn Kaiwa",
    roleEn: "Head of Kaiwa Department",
    roleJa: "会話部門主任",
    origin: "Nhật Bản",
    levels: "N4 · Kaiwa",
    focus: "Phát âm, ngữ điệu và phản xạ hội thoại công sở.",
    focusEn: "Pronunciation, pitch accent, and workplace conversation reflexes.",
    focusJa: "発音・イントネーション、ビジネス会話の瞬発力指導。",
    quote: "間違[まちが]えても大丈夫[だいじょうぶ]。",
  },
  {
    id: "SS-SATO",
    name: "Satō Kenji",
    nameJa: "佐藤[さとう] 健二[けんじ]",
    initials: "佐",
    role: "Chuyên gia luyện thi",
    roleEn: "JLPT Exam Specialist",
    roleJa: "JLPT試験対策スペシャリスト",
    origin: "Nhật Bản",
    levels: "N2 · N1",
    focus: "Đọc hiểu học thuật, chiến lược làm đề JLPT.",
    focusEn: "Academic reading comprehension and JLPT exam strategies.",
    focusJa: "学術読解・JLPT高得点のための解答戦略指導。",
    quote: "毎日[まいにち]少[すこ]しずつ。",
  },
  {
    id: "SS-HA",
    name: "Nguyễn Thu Hà",
    nameJa: "グエン・トゥー・ハー",
    initials: "Hà",
    role: "Giáo viên sơ – trung cấp",
    roleEn: "Elementary & Intermediate Instructor",
    roleJa: "初級・中級担当講師",
    origin: "Việt Nam",
    levels: "N5 · N3",
    focus: "Giải thích ngữ pháp bằng tiếng Việt, mẹo nhớ Kanji.",
    focusEn: "Clear grammar explanations and practical Kanji memory techniques.",
    focusJa: "分かりやすい文法解説と効率的な漢字暗記メソッド。",
    quote: "一緒[いっしょ]に頑張[がんば]ろう！",
  },
  {
    id: "SS-DUC",
    name: "Lê Minh Đức",
    nameJa: "レー・ミン・ドゥック",
    initials: "Đức",
    role: "Giáo viên lớp Online",
    roleEn: "Online Class Instructor",
    roleJa: "オンラインクラス担当講師",
    origin: "Việt Nam",
    levels: "N5 · N4",
    focus: "Lớp online tương tác, theo sát bài tập hằng tuần.",
    focusEn: "Interactive online classes with weekly assignment follow-ups.",
    focusJa: "双方向オンライン授業と毎週の課題フォローアップ。",
    quote: "継続[けいぞく]は力[ちから]なり。",
  },
];

export function localizeSensei(s: Sensei, lang: Language) {
  return {
    role: pickLang(lang, s.role, s.roleEn, s.roleJa),
    focus: pickLang(lang, s.focus, s.focusEn, s.focusJa),
    origin:
      s.origin === "Nhật Bản"
        ? pickLang(lang, "Nhật Bản", "Japan", "日本")
        : pickLang(lang, "Việt Nam", "Vietnam", "ベトナム"),
  };
}

