import type { LevelId } from "./courses";

export type PlacementQuestion = {
  id: string;
  level: string;
  /** Japanese prompt, furigana bracket syntax. */
  prompt: string;
  /** Vietnamese instruction. */
  hint: string;
  options: string[];
  answer: number;
  explain: string;
};

export const PLACEMENT_TEST: PlacementQuestion[] = [
  {
    id: "q1",
    level: "N5",
    prompt: "わたしは がくせいです。",
    hint: "Chọn chữ Kanji đúng cho từ「がくせい」",
    options: ["学生", "先生", "学校", "生活"],
    answer: 0,
    explain: "学生[がくせい] = học sinh, sinh viên. 先生[せんせい] là giáo viên.",
  },
  {
    id: "q2",
    level: "N5",
    prompt: "きのう、ともだちと えいがを ＿＿＿。",
    hint: "Chọn dạng động từ phù hợp (hôm qua)",
    options: ["みます", "みました", "みません", "みましょう"],
    answer: 1,
    explain: "きのう (hôm qua) → dùng thì quá khứ ～ました.",
  },
  {
    id: "q3",
    level: "N4",
    prompt: "雨[あめ]が 降[ふ]って いる ＿＿＿、今日[きょう]は 出[で]かけません。",
    hint: "Chọn từ nối chỉ nguyên nhân",
    options: ["ので", "のに", "ながら", "ために"],
    answer: 0,
    explain: "～ので diễn tả lý do khách quan: “Vì trời đang mưa nên hôm nay không ra ngoài”.",
  },
  {
    id: "q4",
    level: "N3",
    prompt: "この 本[ほん]は 読[よ]めば 読[よ]む ＿＿＿ 面白[おもしろ]く なる。",
    hint: "Hoàn thành mẫu câu “càng… càng…”",
    options: ["ほど", "だけ", "まで", "しか"],
    answer: 0,
    explain: "～ば～ほど: càng đọc càng thấy thú vị.",
  },
  {
    id: "q5",
    level: "N2",
    prompt: "チームの 努力[どりょく] ＿＿＿、プロジェクトは 成功[せいこう]した。",
    hint: "Chọn cách nói mang nghĩa tích cực “nhờ có”",
    options: ["のせいで", "のおかげで", "にかかわらず", "にもかかわらず"],
    answer: 1,
    explain: "～のおかげで = nhờ vào (kết quả tốt). ～のせいで dùng cho kết quả xấu.",
  },
];

export type Recommendation = {
  level: LevelId;
  title: string;
  message: string;
};

export function recommendByScore(score: number): Recommendation {
  if (score <= 1)
    return {
      level: "N5",
      title: "Sơ cấp N5 — Khởi động",
      message: "Bạn nên bắt đầu vững từ bảng chữ cái và ngữ pháp nền tảng. Lộ trình N5 sẽ giúp bạn tự tin sau 3 tháng.",
    };
  if (score === 2)
    return {
      level: "N4",
      title: "Sơ cấp N4 — Hoàn thiện",
      message: "Bạn đã có nền N5. Khóa N4 giúp hoàn thiện sơ cấp và chuẩn bị thi JLPT N4.",
    };
  if (score === 3)
    return {
      level: "N3",
      title: "Trung cấp N3 — Cầu nối",
      message: "Nền sơ cấp khá chắc! Khóa N3 sẽ đưa bạn lên trung cấp với đọc hiểu và nghe tự nhiên hơn.",
    };
  if (score === 4)
    return {
      level: "N2",
      title: "Luyện thi N2 — Tăng tốc",
      message: "Rất tốt! Bạn phù hợp lộ trình luyện thi N2 kèm tiếng Nhật công sở.",
    };
  return {
    level: "N1",
    title: "Thượng cấp N1 — Chuyên sâu",
    message: "Xuất sắc! Hãy để Sensei đánh giá thêm kỹ năng nói và viết để xếp lớp N1 phù hợp.",
  };
}

