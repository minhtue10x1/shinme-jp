import type { LevelId } from "./courses";
import type { Language } from "@/lib/i18n/types";
import { pickLang } from "@/lib/i18n/context";

export type PlacementQuestion = {
  id: string;
  level: string;
  /** Japanese prompt, furigana bracket syntax. */
  prompt: string;
  hint: string;
  hintEn: string;
  hintJa: string;
  options: string[];
  answer: number;
  explain: string;
  explainEn: string;
  explainJa: string;
};

export const PLACEMENT_TEST: PlacementQuestion[] = [
  {
    id: "q1",
    level: "N5",
    prompt: "わたしは がくせいです。",
    hint: "Chọn chữ Kanji đúng cho từ「がくせい」",
    hintEn: "Choose the correct Kanji for「がくせい」",
    hintJa: "「がくせい」に当てはまる漢字を選んでください",
    options: ["学生", "先生", "学校", "生活"],
    answer: 0,
    explain: "学生[がくせい] = học sinh, sinh viên. 先生[せんせい] là giáo viên.",
    explainEn: "学生[がくせい] = student. 先生[せんせい] means teacher.",
    explainJa: "学生[がくせい]＝学生・生徒。先生[せんせい]は教師の意味です。",
  },
  {
    id: "q2",
    level: "N5",
    prompt: "きのう、ともだちと えいがを ＿＿＿。",
    hint: "Chọn dạng động từ phù hợp (hôm qua)",
    hintEn: "Choose the appropriate verb form (yesterday)",
    hintJa: "「きのう」に合う動詞の形を選んでください",
    options: ["みます", "みました", "みません", "みましょう"],
    answer: 1,
    explain: "きのう (hôm qua) → dùng thì quá khứ ～ました.",
    explainEn: "きのう (yesterday) → use past tense ～ました.",
    explainJa: "「きのう」（昨日）があるので過去形「～ました」を使います。",
  },
  {
    id: "q3",
    level: "N4",
    prompt: "雨[あめ]が 降[ふ]って いる ＿＿＿、今日[きょう]は 出[で]かけません。",
    hint: "Chọn từ nối chỉ nguyên nhân",
    hintEn: "Choose the conjunction indicating reason",
    hintJa: "理由を表す接続表現を選んでください",
    options: ["ので", "のに", "ながら", "ために"],
    answer: 0,
    explain: "～ので diễn tả lý do khách quan: “Vì trời đang mưa nên hôm nay không ra ngoài”.",
    explainEn: "～ので expresses an objective reason: “Because it is raining, I won't go out today.”",
    explainJa: "「～ので」は客観的な理由・原因を表します（雨が降っているから出かけない）。",
  },
  {
    id: "q4",
    level: "N3",
    prompt: "この 本[ほん]は 読[よ]めば 読[よ]む ＿＿＿ 面白[おもしろ]く なる。",
    hint: "Hoàn thành mẫu câu “càng… càng…”",
    hintEn: "Complete the “the more…, the more…” pattern",
    hintJa: "「～ば～ほど」の文型を完成させてください",
    options: ["ほど", "だけ", "まで", "しか"],
    answer: 0,
    explain: "～ば～ほど: càng đọc càng thấy thú vị.",
    explainEn: "～ば～ほど: the more you read, the more interesting it becomes.",
    explainJa: "「～ば～ほど」＝すればするほど程度が増すことを表します。",
  },
  {
    id: "q5",
    level: "N2",
    prompt: "チームの 努力[どりょく] ＿＿＿、プロジェクトは 成功[せいこう]した。",
    hint: "Chọn cách nói mang nghĩa tích cực “nhờ có”",
    hintEn: "Choose the expression meaning “thanks to” (positive)",
    hintJa: "良い結果に対する「おかげで」を表す表現を選んでください",
    options: ["のせいで", "のおかげで", "にかかわらず", "にもかかわらず"],
    answer: 1,
    explain: "～のおかげで = nhờ vào (kết quả tốt). ～のせいで dùng cho kết quả xấu.",
    explainEn: "～のおかげで = thanks to (positive outcome). ～のせいで is for negative outcomes.",
    explainJa: "「～のおかげで」は良い結果の原因、「～のせいで」は悪い結果の原因に使います。",
  },
];

export type Recommendation = {
  level: LevelId;
  title: string;
  message: string;
};

export function recommendByScore(score: number, lang: Language = "vi"): Recommendation {
  if (score <= 1)
    return {
      level: "N5",
      title: pickLang(lang, "Sơ cấp N5 — Khởi động", "Elementary N5 — Kickstart", "初級N5・スタート"),
      message: pickLang(
        lang,
        "Bạn nên bắt đầu vững từ bảng chữ cái và ngữ pháp nền tảng. Lộ trình N5 sẽ giúp bạn tự tin sau 3 tháng.",
        "Start strong with the alphabets and foundational grammar. Our N5 track builds confidence in 3 months.",
        "文字と基礎文法からしっかり始めましょう。3ヶ月のN5コースで自信がつきます。",
      ),
    };
  if (score === 2)
    return {
      level: "N4",
      title: pickLang(lang, "Sơ cấp N4 — Hoàn thiện", "Elementary N4 — Consolidation", "初級N4・完成"),
      message: pickLang(
        lang,
        "Bạn đã có nền N5. Khóa N4 giúp hoàn thiện sơ cấp và chuẩn bị thi JLPT N4.",
        "You already have an N5 base. The N4 course completes your elementary level and prepares you for JLPT N4.",
        "N5の基礎が身についています。N4コースで初級を完成させ、JLPT N4合格を目指しましょう。",
      ),
    };
  if (score === 3)
    return {
      level: "N3",
      title: pickLang(lang, "Trung cấp N3 — Cầu nối", "Intermediate N3 — Bridge", "中級N3・ブリッジ"),
      message: pickLang(
        lang,
        "Nền sơ cấp khá chắc! Khóa N3 sẽ đưa bạn lên trung cấp với đọc hiểu và nghe tự nhiên hơn.",
        "Solid elementary base! N3 bridges you to intermediate Japanese with natural reading and listening.",
        "初級の土台がしっかりしています！N3コースで読解と自然な聴解力を伸ばしましょう。",
      ),
    };
  if (score === 4)
    return {
      level: "N2",
      title: pickLang(lang, "Luyện thi N2 — Tăng tốc", "JLPT N2 — Intensive Prep", "N2対策・スピード合格"),
      message: pickLang(
        lang,
        "Rất tốt! Bạn phù hợp lộ trình luyện thi N2 kèm tiếng Nhật công sở.",
        "Great job! You're ready for our N2 exam prep track combined with business Japanese.",
        "素晴らしいです！N2試験対策とビジネス日本語を組み合わせたコースが最適です。",
      ),
    };
  return {
    level: "N1",
    title: pickLang(lang, "Thượng cấp N1 — Chuyên sâu", "Advanced N1 — Mastery", "上級N1・徹底攻略"),
    message: pickLang(
      lang,
      "Xuất sắc! Hãy để Sensei đánh giá thêm kỹ năng nói và viết để xếp lớp N1 phù hợp.",
      "Excellent! Let our Sensei assess your speaking and writing to place you in the right N1 class.",
      "優秀です！講師が会話・記述力も確認し、最適なN1クラスをご案内します。",
    ),
  };
}

