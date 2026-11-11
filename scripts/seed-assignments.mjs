import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import fs from "fs";

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

const STUDENT_UID = "Qplmanq1aofX7kaNEW0ZYIpe3oV2"; // Le Hoang Nam

const ASSIGNMENTS = [
  {
    id: "asg-01",
    code: "BTVN-26",
    title: "Soumatome N3 Bài 26: Đặt 5 câu với cấu trúc ～わりに & ～くせに",
    titleJa: "総まとめ文法[そうまとめぶんぽう] 作文[さくぶん]",
    level: "N3",
    classId: "cls-n3-246",
    className: "N3-Tối 246",
    dueDate: "2026-11-20",
    type: "Ngữ pháp",
    questionsCount: 5,
    maxScore: 10,
    description: "Học viên viết 5 câu áp dụng cấu trúc ngữ pháp đã học trên lớp, chú ý sắc thái đối lập tiêu cực của ～くせに.",
    createdBy: "Tanaka Yuki",
    createdAt: new Date("2026-11-10T08:00:00Z").toISOString(),
    submissions: {
      [STUDENT_UID]: {
        score: 9,
        maxScore: 10,
        studentName: "Lê Hoàng Nam",
        studentCode: "HV-202601",
        feedback: "Dùng từ chính xác, cấu trúc ～くせに đã thể hiện rõ cảm xúc phàn nàn. Giỏi lắm Nam!",
        studentAnswer: "1. 彼は勉強しなかったわりに、いい点数を取った。\n2. お金がないくせに、高い車を買った...",
        submittedAt: "2026-11-11T09:30:00Z",
        gradedAt: "2026-11-11T14:00:00Z",
        status: "graded",
      },
    },
  },
  {
    id: "asg-02",
    code: "TEST-03",
    title: "Mini Test Mondai 1–2: Từ vựng & Kanji trọng tâm tuần 11",
    titleJa: "文字[もじ]・語彙[ごい] ミニテスト",
    level: "N3",
    classId: "cls-n3-246",
    className: "N3-Tối 246",
    dueDate: "2026-11-22",
    type: "Kanji",
    questionsCount: 20,
    maxScore: 20,
    description: "Kiểm tra 20 chữ Kanji trọng tâm thuộc chủ đề Xã hội và Kinh tế.",
    createdBy: "Tanaka Yuki",
    createdAt: new Date("2026-11-10T10:00:00Z").toISOString(),
    submissions: {
      [STUDENT_UID]: {
        score: 18,
        maxScore: 20,
        studentName: "Lê Hoàng Nam",
        studentCode: "HV-202601",
        feedback: "Phần âm On và âm Kun phân biệt rất tốt. Cần chú ý thêm chữ 待つ và 持つ.",
        studentAnswer: "1. 政治[せいじ]  2. 経済[けいざい]  3. 国際[こくさい]...",
        submittedAt: "2026-11-11T10:15:00Z",
        gradedAt: "2026-11-11T15:20:00Z",
        status: "graded",
      },
    },
  },
  {
    id: "asg-03",
    code: "KAIWA-04",
    title: "Kịch bản Kaiwa: Xin phép nghỉ ốm & bàn giao công việc qua điện thoại",
    titleJa: "電話[でんわ]での連絡[れんらく]・報告[ほうこく]",
    level: "N3",
    classId: "cls-n3-246",
    className: "N3-Tối 246",
    dueDate: "2026-11-25",
    type: "Kaiwa",
    questionsCount: 1,
    maxScore: 10,
    description: "Ghi âm hoặc nộp kịch bản hội thoại xử lý tình huống xin phép trưởng phòng nghỉ bệnh và bàn giao file tài liệu.",
    createdBy: "Tanaka Yuki",
    createdAt: new Date("2026-11-11T09:00:00Z").toISOString(),
    submissions: {},
  },
  {
    id: "asg-04",
    code: "DOKKAI-02",
    title: "Đọc hiểu Dokkai: Đoạn văn về văn hóa tắm Onsen & Ryokan",
    titleJa: "温泉[おんせん]と旅館[りょかん]の文化[ぶんか]",
    level: "N3",
    classId: "cls-n3-246",
    className: "N3-Tối 246",
    dueDate: "2026-11-28",
    type: "Đọc hiểu",
    questionsCount: 5,
    maxScore: 10,
    description: "Đọc bài đọc trong tài liệu phát tay trang 42 và trả lời 5 câu hỏi trọng tâm.",
    createdBy: "Tanaka Yuki",
    createdAt: new Date("2026-11-11T11:00:00Z").toISOString(),
    submissions: {},
  },
  {
    id: "asg-05",
    code: "BTVN-N4-38",
    title: "Minna no Nihongo Bài 38: Chia 15 động từ sang thể bị động (受身形)",
    titleJa: "第38課[だいさんじゅうはっか] 受身形[うけみけい]",
    level: "N4",
    classId: "cls-n4-ct",
    className: "N4-Cấp Tốc",
    dueDate: "2026-11-24",
    type: "Ngữ pháp",
    questionsCount: 15,
    maxScore: 15,
    description: "Luyện chia động từ nhóm I, II, III sang thể bị động và đặt 3 câu ví dụ.",
    createdBy: "Tanaka Yuki",
    createdAt: new Date("2026-11-09T08:00:00Z").toISOString(),
    submissions: {},
  },
];

async function seed() {
  console.log("Seeding assignments into Firestore...");
  for (const asg of ASSIGNMENTS) {
    await setDoc(doc(db, "assignments", asg.id), asg);
    console.log(`✓ Seeded assignment: ${asg.code} (${asg.id})`);
  }
  console.log("Done seeding assignments!");
}

seed().catch(console.error);
