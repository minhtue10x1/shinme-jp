import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import fs from "fs";

// Read .env.local manually without extra package
const envContent = fs.readFileSync(".env.local", "utf-8");
const env = {};
envContent.split("\n").forEach((line) => {
  const [k, ...v] = line.trim().split("=");
  if (k && v.length) env[k] = v.join("=");
});

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

// Data to seed
const CLASSES = [
  {
    id: "cls-n3-246",
    code: "N3-Tối 246",
    name: "N3-Tối 246 (Sensei Tanaka)",
    shortName: "N3-Tối 246",
    level: "N3",
    senseiId: "ss-tanaka",
    senseiName: "Tanaka Yuki",
    schedule: "Thứ 2 · 4 · 6",
    time: "19:00 – 21:00",
    room: "Phòng 204 & Zoom ID: 889-234-112",
    totalSessions: 40,
    completedSessions: 26,
    studentsCount: 18,
    currentLesson: "Bài 26: Ngữ pháp Soumatome & Đọc hiểu đoạn văn",
    currentLessonJa: "第26課[だいにじゅうろっか] 総まとめ文法[そうまとめぶんぽう]",
    createdAt: new Date().toISOString(),
  },
  {
    id: "cls-n4-ct",
    code: "N4-Cấp Tốc",
    name: "N4-Cấp Tốc (Sensei Mai)",
    shortName: "N4-Cấp Tốc",
    level: "N4",
    senseiId: "ss-mai",
    senseiName: "Nguyễn Phương Mai",
    schedule: "Thứ 3 · 5 · 7",
    time: "18:30 – 20:30",
    room: "Phòng 102 & Zoom ID: 442-990-128",
    totalSessions: 36,
    completedSessions: 14,
    studentsCount: 15,
    currentLesson: "Bài 34: Thể điều kiện (ば形) & Nghe hiểu Minna",
    currentLessonJa: "第34課[だいさんじゅうよんか] 条件形[じょうけんけい]",
    createdAt: new Date().toISOString(),
  },
  {
    id: "cls-kaiwa-stc",
    code: "Kaiwa Sơ Trung Cấp",
    name: "Kaiwa Sơ Trung Cấp (Sensei Tanaka & Sensei Kenji)",
    shortName: "Kaiwa Sơ Trung Cấp",
    level: "KAIWA",
    senseiId: "ss-tanaka",
    senseiName: "Tanaka Yuki & Kenji Sato",
    schedule: "Thứ 7 · Chủ Nhật",
    time: "09:00 – 11:00",
    room: "Phòng Hội thảo Shinme & Metaverse Lounge",
    totalSessions: 24,
    completedSessions: 8,
    studentsCount: 12,
    currentLesson: "Chủ đề: Đàm phán đối tác & Ứng xử công ty Nhật",
    currentLessonJa: "ビジネス日本語[にほんご]と マナー",
    createdAt: new Date().toISOString(),
  },
];

const TESTS = [
  {
    id: "n3-mock-test-01",
    code: "N3-MID-01",
    title: "Kiểm tra Định kỳ N3 Đợt 1 — Tổng hợp 4 Mondai (Goi · Bunpou · ★ · Dokkai · Choukai)",
    titleJa: "N3 第1回[だいいっかい] 実力[じつりょく]テスト",
    classId: "cls-n3-246",
    className: "N3-Tối 246 (Sensei Tanaka)",
    level: "N3",
    durationMinutes: 25,
    deadline: "2026-11-20T23:59",
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
        explanation: "報告[ほうこく] (Báo cáo) có trường âm ほう và âm ngắt ở こく.",
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
        explanation: "～わりに diễn tả sự việc trái với mức độ kỳ vọng.",
      },
      {
        id: "q-star-1",
        type: "star",
        mondaiLabel: "問題3・星の並び替え (Bài tập dấu sao ★)",
        points: 15,
        instruction: "Sắp xếp 4 mảnh ghép vào 4 chỗ trống và chọn mảnh ghép nằm ở vị trí dấu sao ★.",
        prompt: "Sắp xếp câu sao cho tự nhiên và đúng ngữ pháp N3:",
        starPrefix: "この 薬[くusri]を",
        starSuffix: "なりました。",
        starSlotIndex: 2,
        options: ["飲[の]む", "ように", "なってから", "体[からだ]が 丈夫[じょうぶ]に"],
        correctIndex: 2,
        starCorrectOrder: [0, 1, 2, 3],
        grammarPoint: "Cấu trúc ～ようになってから (Kể từ khi bắt đầu...)",
        explanation: "Thứ tự đúng: 飲む -> ように -> なってから (★) -> 体が丈夫に.",
      },
      {
        id: "q-dokkai-1",
        type: "dokkai",
        mondaiLabel: "問題4・読解 (Đọc hiểu đoạn văn)",
        points: 30,
        passageGroupId: "passage-asagohan",
        passageTitle: "朝[あさ]ご飯[はん]と 仕事[しごと]の 効率[こうりつ]",
        passageText: "最近[さいきん]、朝[あさ] 忙[いそが]しくて 朝[あさ]ご飯[はん]を 食[た]べずに 会社[かいしゃ]へ 行[い]く 若者[わかもの]が 増[ふ]えている。\n\nしかし、脳[のう]が しっかり 働[はたら]くためには、朝[あさ]の 栄養[えいよう]が 欠[か]かせない。",
        instruction: "Đọc đoạn văn và trả lời câu hỏi:",
        prompt: "筆者[ひっしゃ]に よると、朝[あさ]ご飯[はん]を 食[た]べないと どう なりますか。",
        options: [
          "午前中[ごぜんちゅう]の 集中力[しゅうちゅうりょく]が 下[さ]がり、仕事[しごと]の 効率[こうりつ]が 悪[わる]くなる。",
          "会社[かいしゃ]や 学校[がっこう]に 遅刻[ちこく]しそうに なる。",
          "夜[よる] 眠[ねむ]れなく なってしまう。",
          "仕事[しごと]の 時間[じかん]が 短[みじか]く なる。",
        ],
        correctIndex: 0,
        grammarPoint: "Đọc hiểu Dokkai: Xác định hệ quả",
        explanation: "Nếu bỏ bữa sáng, độ tập trung giảm và hiệu suất làm việc kém đi.",
      },
      {
        id: "q-choukai-1",
        type: "choukai",
        mondaiLabel: "問題5・聴解 (Nghe hiểu Choukai)",
        points: 30,
        instruction: "Nghe đoạn hội thoại và chọn hành động nhân viên sẽ làm ĐẦU TIÊN.",
        prompt: "女[おんな]の 人[ひと]は このあと まず 何[なに]を しますか。",
        audioTitle: "Choukai N3 — Mondai 1: Tại văn phòng công ty",
        audioDurationSec: 28,
        audioPlayLimit: 2,
        options: [
          "山田[やまだ]さんに 電話[でんわ]を かける。",
          "会議[かいぎ]の 資料[しりょう]を 30部[ぶ] コピーする。",
          "会議室[かいぎしつ]に 資料[しりょう]を 並[なら]べる。",
          "会議室[かいぎしつ]の お茶[ちゃ]を 準備[じゅんび]する。",
        ],
        correctIndex: 0,
        grammarPoint: "Nghe hiểu Choukai: Xác định thứ tự ưu tiên",
        explanation: "Trưởng phòng dặn gọi điện trước, chuẩn bị trà để sau.",
      },
    ],
  },
];

const ANNOUNCEMENTS = [
  {
    id: "ann-01",
    classId: "cls-n3-246",
    className: "N3-Tối 246 (Sensei Tanaka)",
    title: "Nhắc nhở làm bài Mini Test Bài 26 & Nộp bài tập Soumatome",
    titleJa: "第26課[だいにじゅうろっか] 宿題[しゅくだい]と 小[しょう]テストの お知らせ",
    content: "Các bạn học viên nhớ hoàn thành bài tập ngữ pháp bài 26 trước 21h00 thứ Sáu nhé! Buổi tới chúng ta sẽ luyện phản xạ Kaiwa chủ đề công sở.",
    authorName: "Tanaka Yuki",
    authorRole: "Sensei",
    category: "BTVN & Luyện thi",
    isPinned: true,
    createdAt: "2026-11-09T14:30:00Z",
  },
  {
    id: "ann-02",
    classId: "ALL",
    className: "Toàn trung tâm Shinme",
    title: "Lịch thi thử JLPT Mô phỏng Đợt 1 toàn quốc",
    titleJa: "第1回[だいいっかい] JLPT 模擬[もぎ]試験[しけん]の ご案内[あんない]",
    content: "Trung tâm tổ chức thi thử mô phỏng phòng thi thật cho tất cả các cấp độ từ N5 đến N2 vào Chủ Nhật tuần tới. Đăng ký tại phòng giáo vụ.",
    authorName: "Nguyễn Thu Hà",
    authorRole: "Admin",
    category: "Thông báo chung",
    isPinned: false,
    createdAt: "2026-11-08T09:00:00Z",
  },
];

const USERS = [
  {
    uid: "hv-202601",
    email: "nam.le@shinme.edu.vn",
    role: "student",
    code: "HV-202601",
    fullName: "Lê Hoàng Nam",
    fullNameJa: "レ・ホアン・ナム",
    avatarText: "Nam",
    classId: "cls-n3-246",
    className: "N3-Tối 246 (Sensei Tanaka)",
    targetJLPT: "N3",
    createdAt: new Date().toISOString(),
  },
  {
    uid: "ss-tanaka",
    email: "tanaka.yuki@shinme.edu.vn",
    role: "sensei",
    code: "SS-TANAKA",
    fullName: "Tanaka Yuki",
    fullNameJa: "田中[たなか] 由紀[ゆき]",
    avatarText: "田",
    classId: "cls-n3-246",
    className: "N3-Tối 246, Kaiwa Sơ Trung Cấp",
    targetJLPT: "N1",
    createdAt: new Date().toISOString(),
  },
  {
    uid: "adm-shinme",
    email: "admin@shinme.edu.vn",
    role: "admin",
    code: "ADMIN-01",
    fullName: "Nguyễn Thu Hà",
    avatarText: "Ad",
    className: "Toàn bộ lớp học",
    createdAt: new Date().toISOString(),
  },
];

async function runSeed() {
  console.log("🚀 Đang kết nối Firebase Firestore và khởi tạo dữ liệu mẫu...");

  for (const c of CLASSES) {
    await setDoc(doc(db, "classes", c.id), c, { merge: true });
    console.log(`✓ Seeded class: ${c.name}`);
  }

  for (const t of TESTS) {
    await setDoc(doc(db, "tests", t.id), t, { merge: true });
    console.log(`✓ Seeded test: ${t.title}`);
  }

  for (const a of ANNOUNCEMENTS) {
    await setDoc(doc(db, "announcements", a.id), a, { merge: true });
    console.log(`✓ Seeded announcement: ${a.title}`);
  }

  for (const u of USERS) {
    await setDoc(doc(db, "users", u.uid), u, { merge: true });
    console.log(`✓ Seeded user: ${u.fullName} (${u.role})`);
  }

  console.log("🎉 Hoàn tất nạp dữ liệu mẫu lên Firestore Database thật!");
}

runSeed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Lỗi khi nạp dữ liệu:", err);
    process.exit(1);
  });
