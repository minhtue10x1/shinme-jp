"use client";

export type MondaiType = "standard" | "star" | "dokkai" | "choukai";

export type AudioPlayLimit = 0 | 1 | 2; // 0 = unlimited

export type TestQuestion = {
  id: string;
  type: MondaiType;
  mondaiLabel: string;
  points: number;
  /** Question prompt using bracket furigana syntax, e.g. 日本語[にほんご] */
  prompt: string;
  /** Vietnamese instruction or context hint */
  instruction?: string;
  /** 4 options (A, B, C, D) with furigana support */
  options: [string, string, string, string];
  /** 0-based index of the correct option */
  correctIndex: number;
  /** Detailed grammar/vocabulary explanation shown after submission */
  explanation: string;
  /** Grammar / skill tag for Sensei Item Analysis */
  grammarPoint: string;

  /* --- Fields for `star` (Bài tập dấu sao ★) --- */
  /** Sentence text before the 4 slots */
  starPrefix?: string;
  /** Sentence text after the 4 slots */
  starSuffix?: string;
  /** Which slot (0..3) has the ★ mark (default: 2, i.e. 3rd slot ___ ___ ★ ___) */
  starSlotIndex?: number;
  /** Correct order of option indices [0..3] for the 4 slots to show in review */
  starCorrectOrder?: [number, number, number, number];

  /* --- Fields for `dokkai` (Đọc hiểu Passage Group) --- */
  /** Shared reading passage ID (questions with same group share the passage pane) */
  passageGroupId?: string;
  passageTitle?: string;
  passageText?: string;

  /* --- Fields for `choukai` (Nghe hiểu Audio Question) --- */
  audioTitle?: string;
  audioDurationSec?: number;
  /** 0 = Không giới hạn, 1 = 1 lần, 2 = 2 lần */
  audioPlayLimit?: AudioPlayLimit;
  /** Dialogue script revealed only in post-submission review */
  audioScript?: { speaker: string; textJa: string; textVi: string }[];
};

export type JLPTTest = {
  id: string;
  code: string;
  title: string;
  titleJa: string;
  classId: string;
  className: string;
  level: "N5" | "N4" | "N3" | "N2" | "N1" | "KAIWA";
  durationMinutes: number;
  deadline: string;
  maxAttempts: number; // 0 = unlimited
  passScore: number;
  totalPoints: number;
  shuffleQuestions: boolean;
  createdBy: string;
  createdAt: string;
  questions: TestQuestion[];
};

export type StudentTestAttempt = {
  id: string;
  testId: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  score: number;
  totalPoints: number;
  passed: boolean;
  durationSeconds: number;
  submittedAt: string;
  answers: Record<string, number>;
};

/* ------------------------------------------------------------------
 * PRE-POPULATED AUTHENTIC N3 MOCK TESTS FOR `N3-Tối 246`
 * ------------------------------------------------------------------ */
export const INITIAL_TESTS: JLPTTest[] = [
  {
    id: "n3-mock-test-01",
    code: "N3-MID-01",
    title: "Kiểm tra Định kỳ N3 Đợt 1 — Tổng hợp 4 Mondai (Goi · Bunpou · ★ · Dokkai · Choukai)",
    titleJa: "N3 第1回[だいいっかい] 実力[じつりょく]テスト",
    classId: "cls-n3-246",
    className: "N3-Tối 246 (Sensei Tanaka)",
    level: "N3",
    durationMinutes: 25,
    deadline: "2026-11-15T23:59",
    maxAttempts: 2,
    passScore: 60,
    totalPoints: 100,
    shuffleQuestions: false,
    createdBy: "Tanaka Yuki Sensei",
    createdAt: "2026-11-08",
    questions: [
      {
        id: "q-std-1",
        type: "standard",
        mondaiLabel: "問題1・文字語彙 (Kanji & Từ vựng)",
        points: 10,
        instruction: "Chọn cách đọc Hiragana đúng cho từ gạch chân.",
        prompt: "会議[かいぎ]の 結果[けっか]を 社長[しゃちょう]に 【報告】した。",
        options: ["ほうこく", "ほこく", "ぼうこく", "ほうごく"],
        correctIndex: 0,
        grammarPoint: "Từ vựng Hán tự trường âm (報告 - ほうこく)",
        explanation:
          "報告[ほうこく] (Báo cáo) có trường âm ほう ở chữ 報[ほう] và âm ngắt/không trường âm ở 告[こく]. Học viên rất hay nhầm với ほこく (thiếu trường âm).",
      },
      {
        id: "q-std-2",
        type: "standard",
        mondaiLabel: "問題2・文法 (Ngữ pháp chuẩn)",
        points: 15,
        instruction: "Chọn cấu trúc ngữ pháp phù hợp nhất điền vào chỗ trống.",
        prompt: "あの レストランは 値段[ねだん]が 高[たか]い ＿＿＿、料理[りょうり]の 味[あじ]は あまり おいしくない。",
        options: ["わりに", "おかげで", "せいで", "たびに"],
        correctIndex: 0,
        grammarPoint: "Ngữ pháp N3 ～わりに (Tương phản với kỳ vọng)",
        explanation:
          "～わりに diễn tả sự việc trái với mức độ kỳ vọng: 'So với mức giá đắt đỏ thì hương vị món ăn lại không ngon lắm'. ～おかげで (nhờ có) và ～せいで (tại vì) chỉ nguyên nhân - kết quả.",
      },
      {
        id: "q-star-1",
        type: "star",
        mondaiLabel: "問題3・星の並び替え (Bài tập dấu sao ★)",
        points: 15,
        instruction: "Sắp xếp 4 mảnh ghép vào 4 chỗ trống và chọn mảnh ghép nằm ở vị trí dấu sao ★.",
        prompt: "Sắp xếp câu sao cho tự nhiên và đúng ngữ pháp N3:",
        starPrefix: "この 薬[くすり]を",
        starSuffix: "なりました。",
        starSlotIndex: 2,
        options: ["飲[の]む", "ように", "なってから", "体[からだ]が 丈夫[じょうぶ]に"],
        correctIndex: 2,
        starCorrectOrder: [0, 1, 2, 3],
        grammarPoint: "Cấu trúc ～ようになってから (Kể từ khi bắt đầu...)",
        explanation:
          "Thứ tự đúng: この薬[くすり]を 【飲[の]む】 【ように】 【★ なってから】 【体[からだ]が 丈夫[じょうぶ]に】 なりました。(Kể từ khi bắt đầu uống thuốc này, cơ thể đã trở nên khỏe mạnh hơn). Do đó vị trí ★ là 「なってから」.",
      },
      {
        id: "q-star-2",
        type: "star",
        mondaiLabel: "問題3・星の並び替え (Bài tập dấu sao ★)",
        points: 15,
        instruction: "Sắp xếp 4 mảnh ghép vào 4 chỗ trống và chọn mảnh ghép nằm ở vị trí dấu sao ★.",
        prompt: "Sắp xếp câu hoàn chỉnh với cấu trúc ～ば～ほど:",
        starPrefix: "日本語[にほんご]は",
        starSuffix: "深[ふか]い 言葉[ことば]だと 思[おも]う。",
        starSlotIndex: 2,
        options: ["勉強[べんきょう]すれば", "勉強[べんきょう]する", "ほど", "奥[おく]が"],
        correctIndex: 2,
        starCorrectOrder: [0, 1, 2, 3],
        grammarPoint: "Cấu trúc ～ば～ほど (Càng... càng...)",
        explanation:
          "Thứ tự đúng: 日本語[にほんご]は 【勉強[べんきょう]すれば】 【勉強[べんきょう]する】 【★ ほど】 【奥[おく]が】 深[ふか]い 言葉[ことば]だと 思[おも]う。(Tiếng Nhật càng học càng thấy là một ngôn ngữ sâu sắc). Vị trí ★ là 「ほど」.",
      },
      {
        id: "q-dokkai-1",
        type: "dokkai",
        mondaiLabel: "問題4・読解 (Đọc hiểu đoạn văn)",
        points: 15,
        passageGroupId: "passage-asagohan",
        passageTitle: "朝[あさ]ご飯[はん]と 仕事[しごと]の 効率[こうりつ] (Bữa sáng và hiệu suất công việc)",
        passageText:
          "最近[さいきん]、朝[あさ] 忙[いそが]しくて 朝[あさ]ご飯[はん]を 食[た]べずに 会社[かいしゃ]や 学校[がっこう]へ 行[い]く 若者[わかもの]が 増[ふ]えている。\n\nしかし、脳[のう]が しっかり 働[はたら]くためには、朝[あさ]の 栄養[えいよう]が 欠[か]かせない。朝[あさ]ご飯[はん]を 抜[ぬ]くと、午前中[ごぜんちゅう]に 集中力[しゅうちゅうりょく]が 下[さ]がり、かえって 仕事[しごと]の 効率[こうりつ]が 悪[わる]くなってしまうのだ。\n\n時間[じかん]が ない 時[とき]でも、バナナ 1本[ぽん]や 牛乳[ぎゅうにゅう] 1杯[ぱい]だけでも とる 習慣[しゅうかん]を つけよう。",
        instruction: "Đọc đoạn văn bên trái và trả lời câu hỏi số 1:",
        prompt: "筆者[ひっしゃ]に よると、朝[あさ]ご飯[はん]を 食[た]べないと どう なりますか。",
        options: [
          "午前中[ごぜんちゅう]の 集中力[しゅうちゅうりょく]が 下[さ]がり、仕事[しごと]の 効率[こうりつ]が 悪[わる]くなる。",
          "会社[かいしゃ]や 学校[がっこう]に 遅刻[ちこく]しそうに なる。",
          "夜[よる] 眠[ねむ]れなく なってしまう。",
          "仕事[しごと]の 時間[じかん]が 短[みじか]く なる。",
        ],
        correctIndex: 0,
        grammarPoint: "Đọc hiểu Dokkai: Xác định hệ quả (～と、かえって...)",
        explanation:
          "Trong đoạn 2 tác giả viết: 「朝[あさ]ご飯[はん]を 抜[ぬ]くと、午前中[ごぜんちゅう]に 集中力[しゅうちゅうりょく]が 下[さ]がり、かえって 仕事[しごと]の 効率[こうりつ]が 悪[わる]くなってしまう」 (Nếu bỏ bữa sáng, độ tập trung buổi sáng giảm và hiệu suất làm việc kém đi).",
      },
      {
        id: "q-dokkai-2",
        type: "dokkai",
        mondaiLabel: "問題4・読解 (Đọc hiểu đoạn văn)",
        points: 15,
        passageGroupId: "passage-asagohan",
        passageTitle: "朝[あさ]ご飯[はん]と 仕事[しごと]の 効率[こうりつ] (Bữa sáng và hiệu suất công việc)",
        passageText:
          "最近[さいきん]、朝[あさ] 忙[いそが]しくて 朝[あさ]ご飯[はん]を 食[た]べずに 会社[かいしゃ]や 学校[がっこう]へ 行[い]く 若者[わかもの]が 増[ふ]えている。\n\nしかし、脳[のう]が しっかり 働[はたら]くためには、朝[あさ]の 栄養[えいよう]が 欠[か]かせない。朝[あさ]ご飯[はん]を 抜[ぬ]くと、午前中[ごぜんちゅう]に 集中力[しゅうちゅうりょく]が 下[さ]がり、かえって 仕事[しごと]の 効率[こうりつ]が 悪[わる]くなってしまうのだ。\n\n時間[じかん]が ない 時[とき]でも、バナナ 1本[ぽん]や 牛乳[ぎゅうにゅう] 1杯[ぱい]だけでも とる 習慣[しゅうかん]を つけよう。",
        instruction: "Đọc đoạn văn bên trái và trả lời câu hỏi số 2:",
        prompt: "この 文章[ぶんしょう]で 筆者[ひっしゃ]が 一番[いちばん] 言[い]いたい ことは 何[なん]ですか。",
        options: [
          "忙[いそが]しくても 少[すこ]しでも 朝[あさ]ご飯[はん]を とる 習慣[しゅうかん]を つけるべきだ。",
          "バナナと 牛乳[ぎゅうにゅう]は 一番[いちばん] 安[やす]い 食事[しょくじ]だ。",
          "若者[わかもの]は もっと 早[はや]く 起[お]きるべきだ。",
          "夜[よる]ご飯[はん]を たくさん 食[た]べた ほうが いい。",
        ],
        correctIndex: 0,
        grammarPoint: "Đọc hiểu Dokkai: Ý chính của tác giả (～よう / ～べき)",
        explanation:
          "Câu kết của đoạn văn nhấn mạnh thông điệp của tác giả: 「時間[じかん]が ない 時[とき]でも、バナナ 1本[ぽん]や 牛乳[ぎゅうにゅう] 1杯[ぱい]だけでも とる 習慣[しゅうかん]を つけよう」 (Dù bận không có thời gian cũng hãy tập thói quen ăn nhẹ buổi sáng).",
      },
      {
        id: "q-choukai-1",
        type: "choukai",
        mondaiLabel: "問題5・聴解 (Nghe hiểu Choukai)",
        points: 15,
        instruction: "Nghe đoạn hội thoại giữa trưởng phòng và nhân viên, sau đó chọn hành động nhân viên sẽ làm ĐẦU TIÊN.",
        prompt: "女[おんな]の 人[ひと]は このあと まず 何[なに]を しますか。",
        audioTitle: "Choukai N3 — Mondai 1: Tại văn phòng công ty Shinme",
        audioDurationSec: 28,
        audioPlayLimit: 2,
        audioScript: [
          {
            speaker: "課長[かちょう] (Trưởng phòng)",
            textJa: "佐藤[さとう]さん、午後[ごご]の 会議[かいぎ]の 資料[しりょう]は もう コピーしてくれた？",
            textVi: "Sato này, tài liệu cuộc họp chiều nay em đã photo chưa?",
          },
          {
            speaker: "佐藤[さとう] (Nữ nhân viên)",
            textJa: "はい、30部[ぶ] コピーして 会議室[かいぎしつ]に 並[なら]べて おきました。",
            textVi: "Dạ rồi ạ, em đã photo 30 bản và xếp sẵn trong phòng họp rồi ạ.",
          },
          {
            speaker: "課長[かちょう] (Trưởng phòng)",
            textJa: "ありがとう。じゃあ、急[きゅう]で 悪[わる]いんだけど、取引先[とりひきさき]の 山田[やまだ]さんに 開始時間[かいしじかん]が 30分[ぷん] 遅[おく]れると 電話[でんわ]して くれる？ お茶[ちゃ]の 準備[じゅんび]は その後[あと]で いいから。",
            textVi: "Cảm ơn em. Vậy hơi gấp một chút nhưng em gọi điện báo cho anh Yamada bên đối tác rằng giờ bắt đầu lùi lại 30 phút giúp anh nhé? Việc chuẩn bị trà để sau đó cũng được.",
          },
          {
            speaker: "佐藤[さとう] (Nữ nhân viên)",
            textJa: "わかりました。すぐに 連絡[れんらく]します。",
            textVi: "Vâng, em hiểu rồi ạ. Em sẽ liên lạc ngay.",
          },
        ],
        options: [
          "山田[やまだ]さんに 電話[でんわ]を かける。",
          "会議[かいぎ]の 資料[しりょう]を 30部[ぶ] コピーする。",
          "会議室[かいぎしつ]に 資料[しりょう]を 並[なら]べる。",
          "会議室[かいぎしつ]の お茶[ちゃ]を 準備[じゅんび]する。",
        ],
        correctIndex: 0,
        grammarPoint: "Nghe hiểu Choukai: Xác định thứ tự ưu tiên (～はその後でいいから)",
        explanation:
          "Tài liệu đã được photo và xếp xong rồi (おきました). Trưởng phòng dặn gọi điện cho anh Yamada trước, còn chuẩn bị trà để sau (お茶の準備はその後でいいから). Đáp án đúng là gọi điện cho Yamada-san.",
      },
    ],
  },
  {
    id: "n3-unit26-quiz",
    code: "N3-U26-QUIZ",
    title: "Mini Test Bài 26 — Ngữ pháp Soumatome & Phản xạ Nghe nhanh",
    titleJa: "第26課[だいにじゅうろっか] 小[しょう]テスト",
    classId: "cls-n3-246",
    className: "N3-Tối 246 (Sensei Tanaka)",
    level: "N3",
    durationMinutes: 15,
    deadline: "2026-11-18T21:00",
    maxAttempts: 0,
    passScore: 70,
    totalPoints: 100,
    shuffleQuestions: true,
    createdBy: "Tanaka Yuki Sensei",
    createdAt: "2026-11-09",
    questions: [
      {
        id: "u26-q1",
        type: "standard",
        mondaiLabel: "問題1・文法 (Ngữ pháp ～うちに)",
        points: 25,
        instruction: "Chọn đáp án đúng nhất hoàn thành câu.",
        prompt: "スープが ＿＿＿ うちに、どうぞ 召[め]し上[あ]がって ください。",
        options: ["温[あたた]かい", "温[あたた]かく", "温[あたた]かかった", "温[あたた]かくて"],
        correctIndex: 0,
        grammarPoint: "Ngữ pháp ～うちに (Nhân lúc trạng thái chưa đổi)",
        explanation:
          "Tính từ đuôi い giữ nguyên い + うちに: 温[あたた]かいうちに (Nhân lúc súp còn đang nóng, xin mời dùng).",
      },
      {
        id: "u26-q2",
        type: "star",
        mondaiLabel: "問題2・星の並び替え (Bài tập dấu sao ★)",
        points: 25,
        instruction: "Sắp xếp 4 mảnh ghép và chọn từ ở vị trí ★.",
        prompt: "Hoàn thành câu phàn nàn với cấu trúc ～くせに:",
        starPrefix: "彼[かれ]は",
        starSuffix: "文句[もんく]ばかり 言[い]う。",
        starSlotIndex: 2,
        options: ["自分[じぶん]で", "何[なに]も しない", "くせに", "人[ひと]には"],
        correctIndex: 2,
        starCorrectOrder: [0, 1, 2, 3],
        grammarPoint: "Cấu trúc ～くせに (Thế mà lại... - trách móc)",
        explanation:
          "Thứ tự đúng: 彼[かれ]は 【自分[じぶん]で】 【何[なに]も しない】 【★ くせに】 【人[ひと]には】 文句[もんく]ばかり 言[い]う。(Anh ta bản thân chẳng làm gì thế mà lại suốt ngày phàn nàn người khác).",
      },
      {
        id: "u26-q3",
        type: "dokkai",
        mondaiLabel: "問題3・読解 (Đọc thông báo nội bộ)",
        points: 25,
        passageGroupId: "passage-library",
        passageTitle: "図書館[としょかん]の 利用[りよう]案内[あんない] (Hướng dẫn sử dụng thư viện)",
        passageText:
          "【お知らせ】\n来週[らいしゅう]の 月曜日[げつようび]（11月[がつ]16日[にち]）は、館内[かんない]の 整理[せいり]のため 休館[きゅうかん]いたします。\n\n本[ほん]の 返却[へんきゃく]は、入口[いりぐち] 横[よこ]の「返却[へんきゃく]ポスト」を ご利用[りよう]ください。ただし、CD・DVDが 付[つ]いている 本[ほん]は 壊[こわ]れやすいため、開館日[かいかんび]に 直接[ちょくせつ] カウンターへ お持[も]ちください。",
        instruction: "Đọc thông báo thư viện và chọn câu ĐÚNG:",
        prompt: "月曜日[げつようび]に 本[ほん]を 返[かえ]したい 場合[ばあい]、どうしなければ なりませんか。",
        options: [
          "CDが 付[つ]いていない 本[ほん]なら、入口[いりぐち] 横[よこ]の ポストに 入[い]れて 返[かえ]せる。",
          "すべての 本[ほん]を 返却[へんきゃく]ポストに 入[い]れる ことが できる。",
          "月曜日[げつようび]でも カウンターで 直接[ちょくせつ] 返[かえ]す ことが できる。",
          "月曜日[げつようび]は どんな 本[ほん]も 返[かえ]す ことが できない。",
        ],
        correctIndex: 0,
        grammarPoint: "Đọc hiểu điều kiện ngoại lệ (ただし～)",
        explanation:
          "Thông báo ghi rõ: Ngày thứ Hai nghỉ, có thể trả sách qua hộp 返却ポスト cạnh lối vào, NGOẠI TRỪ (ただし) sách kèm CD/DVD phải mang trực tiếp tới quầy vào ngày mở cửa.",
      },
      {
        id: "u26-q4",
        type: "choukai",
        mondaiLabel: "問題4・聴解 (Nghe 1 lần duy nhất)",
        points: 25,
        instruction: "File nghe chỉ được phép phát 1 LẦN DUY NHẤT (giống thi thật JLPT).",
        prompt: "男[おとこ]の 人[ひと]と 女[おんな]の 人[ひと]は 何時[なんじ]に どこで 会[あ]いますか。",
        audioTitle: "Choukai N3 — Hẹn gặp ở nhà ga",
        audioDurationSec: 20,
        audioPlayLimit: 1,
        audioScript: [
          {
            speaker: "男[おとこ] (Nam)",
            textJa: "明日[あした]の 映画[えいが]、10時[じ] スタートだよね。9時半[じはん]に 駅[えき]の 北口[きたぐち]で いい？",
            textVi: "Bộ phim ngày mai bắt đầu lúc 10 giờ nhỉ. 9 rưỡi gặp ở cửa Bắc nhà ga được không?",
          },
          {
            speaker: "女[おんな] (Nữ)",
            textJa: "北口[きたぐち]は 今[いま] 工事中[こうじちゅう]で 混[こ]んでるよ。南口[みなみぐち]の 本屋[ほんや]の 前[まえ]に しよう。チケットも 買[か]いたいから、15分[ふん] 早[はや]く 集[あつ]まらない？",
            textVi: "Cửa Bắc đang thi công đông lắm. Mình hẹn trước hiệu sách ở cửa Nam đi. Tớ muốn mua vé trước nữa nên tập trung sớm hơn 15 phút nhé?",
          },
          {
            speaker: "男[おとこ] (Nam)",
            textJa: "いいね、そうしよう！",
            textVi: "Được đấy, chốt vậy nhé!",
          },
        ],
        options: [
          "9時[じ]15分[ふん]に 南口[みなみぐち]の 本屋[ほんや]の 前[まえ]",
          "9時[じ]30分[ぷん]に 南口[みなみぐち]の 本屋[ほんや]の 前[まえ]",
          "9時[じ]15分[ふん]に 駅[えき]の 北口[きたぐち]",
          "9時[じ]45分[ふん]に 映画館[えいがかん]の 前[まえ]",
        ],
        correctIndex: 0,
        grammarPoint: "Nghe hiểu thay đổi thời gian & địa điểm (15分早く = 9:15)",
        explanation:
          "Ban đầu hẹn 9:30 ở cửa Bắc, sau đó đổi sang trước hiệu sách cửa Nam (南口の本屋の前) và sớm hơn 15 phút (9:30 - 15 phút = 9:15).",
      },
    ],
  },
];

/* ------------------------------------------------------------------
 * PRE-POPULATED CLASS ATTEMPTS FOR GRADEBOOK & ITEM ANALYSIS
 * ------------------------------------------------------------------ */
export const INITIAL_ATTEMPTS: StudentTestAttempt[] = [
  {
    id: "att-01",
    testId: "n3-mock-test-01",
    studentId: "std-01",
    studentCode: "HV-202601",
    studentName: "Lê Hoàng Nam",
    score: 85,
    totalPoints: 100,
    passed: true,
    durationSeconds: 1120,
    submittedAt: "2026-11-09T20:15:00Z",
    answers: {
      "q-std-1": 0,
      "q-std-2": 0,
      "q-star-1": 1, // Sai câu sao 1
      "q-star-2": 2,
      "q-dokkai-1": 0,
      "q-dokkai-2": 0,
      "q-choukai-1": 0,
    },
  },
  {
    id: "att-02",
    testId: "n3-mock-test-01",
    studentId: "std-02",
    studentCode: "HV-202602",
    studentName: "Trần Minh Anh",
    score: 70,
    totalPoints: 100,
    passed: true,
    durationSeconds: 1340,
    submittedAt: "2026-11-09T21:02:00Z",
    answers: {
      "q-std-1": 0,
      "q-std-2": 2, // Sai ～わりに (chọn せいで)
      "q-star-1": 1, // Sai câu sao 1
      "q-star-2": 2,
      "q-dokkai-1": 0,
      "q-dokkai-2": 0,
      "q-choukai-1": 0,
    },
  },
  {
    id: "att-03",
    testId: "n3-mock-test-01",
    studentId: "std-03",
    studentCode: "HV-202605",
    studentName: "Phạm Quốc Huy",
    score: 100,
    totalPoints: 100,
    passed: true,
    durationSeconds: 980,
    submittedAt: "2026-11-09T19:45:00Z",
    answers: {
      "q-std-1": 0,
      "q-std-2": 0,
      "q-star-1": 2,
      "q-star-2": 2,
      "q-dokkai-1": 0,
      "q-dokkai-2": 0,
      "q-choukai-1": 0,
    },
  },
  {
    id: "att-04",
    testId: "n3-mock-test-01",
    studentId: "std-04",
    studentCode: "HV-202608",
    studentName: "Đặng Thu Thảo",
    score: 40,
    totalPoints: 100,
    passed: false,
    durationSeconds: 1490,
    submittedAt: "2026-11-09T22:10:00Z",
    answers: {
      "q-std-1": 1, // Sai trường âm 報告
      "q-std-2": 2, // Sai ～わりに
      "q-star-1": 1, // Sai câu sao 1
      "q-star-2": 2,
      "q-dokkai-1": 0,
      "q-dokkai-2": 2, // Sai ý chính Dokkai
      "q-choukai-1": 3, // Sai Choukai (chọn chuẩn bị trà)
    },
  },
  {
    id: "att-05",
    testId: "n3-mock-test-01",
    studentId: "std-05",
    studentCode: "HV-202611",
    studentName: "Vũ Đức Trọng",
    score: 70,
    totalPoints: 100,
    passed: true,
    durationSeconds: 1210,
    submittedAt: "2026-11-09T21:30:00Z",
    answers: {
      "q-std-1": 0,
      "q-std-2": 0,
      "q-star-1": 0, // Sai câu sao 1
      "q-star-2": 2,
      "q-dokkai-1": 0,
      "q-dokkai-2": 0,
      "q-choukai-1": 3, // Sai Choukai
    },
  },
];

/* ------------------------------------------------------------------
 * LOCALSTORAGE PERSISTENCE & CACHED SNAPSHOTS
 * ------------------------------------------------------------------ */
const TESTS_KEY = "shinme:jlpt-tests";
const ATTEMPTS_KEY = "shinme:jlpt-attempts";
const TESTS_EVENT = "shinme:jlpt-tests-changed";
const ATTEMPTS_EVENT = "shinme:jlpt-attempts-changed";

let testsCacheRaw: string | null = null;
let testsCacheVal: JLPTTest[] = INITIAL_TESTS;

export function readTests(): JLPTTest[] {
  if (typeof window === "undefined") return INITIAL_TESTS;
  try {
    const raw = window.localStorage.getItem(TESTS_KEY);
    if (!raw) return INITIAL_TESTS;
    if (raw !== testsCacheRaw) {
      testsCacheRaw = raw;
      testsCacheVal = JSON.parse(raw) as JLPTTest[];
    }
    return testsCacheVal;
  } catch {
    return INITIAL_TESTS;
  }
}

export function getTestsServerSnapshot(): JLPTTest[] {
  return INITIAL_TESTS;
}

export function saveTest(test: JLPTTest): JLPTTest {
  const existing = readTests().filter((t) => t.id !== test.id);
  const next = [test, ...existing];
  window.localStorage.setItem(TESTS_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(TESTS_EVENT));
  return test;
}

export function deleteTest(testId: string) {
  const next = readTests().filter((t) => t.id !== testId);
  window.localStorage.setItem(TESTS_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(TESTS_EVENT));
}

export function subscribeTests(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(TESTS_EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(TESTS_EVENT, cb);
  };
}

let attemptsCacheRaw: string | null = null;
let attemptsCacheVal: StudentTestAttempt[] = INITIAL_ATTEMPTS;

export function readAttempts(): StudentTestAttempt[] {
  if (typeof window === "undefined") return INITIAL_ATTEMPTS;
  try {
    const raw = window.localStorage.getItem(ATTEMPTS_KEY);
    if (!raw) return INITIAL_ATTEMPTS;
    if (raw !== attemptsCacheRaw) {
      attemptsCacheRaw = raw;
      attemptsCacheVal = JSON.parse(raw) as StudentTestAttempt[];
    }
    return attemptsCacheVal;
  } catch {
    return INITIAL_ATTEMPTS;
  }
}

export function getAttemptsServerSnapshot(): StudentTestAttempt[] {
  return INITIAL_ATTEMPTS;
}

export function saveAttempt(attempt: Omit<StudentTestAttempt, "id" | "submittedAt">): StudentTestAttempt {
  const full: StudentTestAttempt = {
    ...attempt,
    id: `att-${Date.now().toString(36)}`,
    submittedAt: new Date().toISOString(),
  };
  const next = [full, ...readAttempts()];
  window.localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(ATTEMPTS_EVENT));
  return full;
}

export function subscribeAttempts(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(ATTEMPTS_EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(ATTEMPTS_EVENT, cb);
  };
}
