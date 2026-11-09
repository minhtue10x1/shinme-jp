import type { LevelId } from "./courses";

export type ExamQuestion = {
  id: string;
  section: "Từ vựng (文字・語彙)" | "Ngữ pháp (文法)" | "Đọc hiểu (読解)";
  mondaiNumber: number;
  questionNumber: number;
  prompt: string;
  context?: string;
  options: string[];
  correctIndex: number;
  explainVi: string;
  explainJa?: string;
  points: number;
};

export type Exam = {
  id: string;
  code: string;
  title: string;
  titleJa: string;
  level: LevelId;
  durationMinutes: number;
  totalPoints: number;
  passPoints: number;
  questions: ExamQuestion[];
};

export const MOCK_EXAM_N4: Exam = {
  id: "jlpt-n4-mock-01",
  code: "EXAM-N4-01",
  title: "Đề thi thử JLPT N4 — Đợt 1",
  titleJa: "N4 第1回[だいいっかい] 模擬試験[もぎしけん]",
  level: "N4",
  durationMinutes: 25,
  totalPoints: 100,
  passPoints: 60,
  questions: [
    {
      id: "q1",
      section: "Từ vựng (文字・語彙)",
      mondaiNumber: 1,
      questionNumber: 1,
      prompt: "あのみせの パンは とても おいしいです。",
      context: "Chọn cách viết Kanji đúng cho từ「みせ」",
      options: ["店", "屋", "室", "堂"],
      correctIndex: 0,
      explainVi: "店[みせ] = cửa hàng, tiệm. 屋[や] thường là hậu tố (本屋: tiệm sách).",
      points: 10,
    },
    {
      id: "q2",
      section: "Từ vựng (文字・語彙)",
      mondaiNumber: 1,
      questionNumber: 2,
      prompt: "田中[たなか]さんは 毎週[まいしゅう]、プールで 泳[およ]ぎます。",
      context: "Chọn cách đọc Hiragana đúng cho chữ Kanji「泳ぎます」",
      options: ["はしります", "あるきます", "およぎます", "とびます"],
      correctIndex: 2,
      explainVi: "泳[およ]ぐ = bơi lội. はしる = chạy, あるく = đi bộ.",
      points: 10,
    },
    {
      id: "q3",
      section: "Ngữ pháp (文法)",
      mondaiNumber: 2,
      questionNumber: 3,
      prompt: "母[はは]に ＿＿＿、うれしかったです。",
      context: "Chọn thể bị động phù hợp",
      options: ["ほめて", "ほめられて", "ほめさせて", "ほめられていて"],
      correctIndex: 1,
      explainVi: "Được mẹ khen → dùng thể bị động受身形: 褒[ほ]められる (nhóm 2 bỏ る + られる).",
      points: 15,
    },
    {
      id: "q4",
      section: "Ngữ pháp (文法)",
      mondaiNumber: 2,
      questionNumber: 4,
      prompt: "熱[ねつ]が あるので、今日[きょう]は 会社[かいしゃ]を 休[やす]んでも ＿＿＿ か。",
      context: "Chọn mẫu câu xin phép lịch sự",
      options: ["いいです", "いけません", "だめです", "なりません"],
      correctIndex: 0,
      explainVi: "Mẫu câu xin phép: ～てもいいですか (Tôi có thể... được không?).",
      points: 15,
    },
    {
      id: "q5",
      section: "Ngữ pháp (文法)",
      mondaiNumber: 3,
      questionNumber: 5,
      prompt: "明日[あした] 雨[あめ]が ＿＿＿、試合[しあい]は 中止[ちゅうし]です。",
      context: "Chọn dạng điều kiện ～たら",
      options: ["降[ふ]るなら", "降[ふ]れば", "降[ふ]ったら", "降[ふ]るのに"],
      correctIndex: 2,
      explainVi: "Nếu ngày mai trời mưa (giả định cụ thể) dùng ～たら: 降[ふ]ったら.",
      points: 20,
    },
    {
      id: "q6",
      section: "Đọc hiểu (読解)",
      mondaiNumber: 4,
      questionNumber: 6,
      prompt: "質問[しつもん]：この メモの 内容[ないよう]と 合[あ]っている ものは どれですか。",
      context:
        "【メモ】田中[たなか]さんへ。昨日[きのう] お願[ねが]いした 資料[しりょう]は、明日[あした]の 午前中[ごぜんちゅう]までに 鈴木[すずき]先生[せんせい]に 渡[わた]して ください。私[わたし]は 今日[きょう] 14時[じ]から 出張[しゅっちょう]です。— 佐藤[さとう]",
      options: [
        "田中さんは 資料を 佐藤さんに 渡さなければならない。",
        "田中さんは 明日の 午前中に 鈴木先生に 資料を 渡す。",
        "佐藤さんは 明日の 午前中から 出張する。",
        "鈴木先生が 資料を 作成する。",
      ],
      correctIndex: 1,
      explainVi: "Nội dung memo: Hãy giao tài liệu cho Suzuki-sensei trước buổi trưa ngày mai.",
      points: 30,
    },
  ],
};

