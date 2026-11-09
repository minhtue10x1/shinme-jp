export type Assignment = {
  id: string;
  code: string;
  title: string;
  titleJa?: string;
  level: string;
  classId?: string;
  className: string;
  dueDate: string;
  type: "Kanji" | "Ngữ pháp" | "Nghe hiểu" | "Đọc hiểu" | "Kaiwa";
  questionsCount: number;
  // student state
  studentStatus: "todo" | "submitted" | "graded";
  studentAnswer?: string;
  score?: number;
  maxScore?: number;
  feedback?: string;
  // sensei / admin overview
  submittedCount: number;
  totalStudents: number;
};

export const MOCK_ASSIGNMENTS: Assignment[] = [
  {
    id: "asg-01",
    code: "BTVN-26",
    title: "Soumatome N3 Bài 26: Đặt 5 câu với cấu trúc ～わりに & ～くせに",
    titleJa: "総まとめ文法[そうまとめぶんぽう] 作文[さくぶん]",
    level: "N3",
    classId: "cls-n3-246",
    className: "N3-Tối 246",
    dueDate: "15/11/2026",
    type: "Ngữ pháp",
    questionsCount: 5,
    studentStatus: "todo",
    maxScore: 10,
    submittedCount: 8,
    totalStudents: 12,
  },
  {
    id: "asg-02",
    code: "TEST-03",
    title: "Mini Test Mondai 1–2: Từ vựng & Kanji trọng tâm",
    titleJa: "文字[もじ]・語彙[ごい]",
    level: "N3",
    classId: "cls-n3-246",
    className: "N3-Tối 246",
    dueDate: "07/11/2026",
    type: "Kanji",
    questionsCount: 20,
    studentStatus: "graded",
    studentAnswer: "1. 政治[せいじ]  2. 経済[けいざい]  3. 国際[こくさい]...",
    score: 18,
    maxScore: 20,
    feedback: "Phần âm On và âm Kun phân biệt rất tốt. Cần chú ý thêm chữ 待つ và 持つ.",
    submittedCount: 12,
    totalStudents: 12,
  },
  {
    id: "asg-03",
    code: "KAIWA-04",
    title: "Kịch bản Kaiwa: Xin phép nghỉ ốm & bàn giao công việc qua điện thoại",
    titleJa: "電話[でんわ]での連絡[れんらく]・報告[ほうこく]",
    level: "N3",
    classId: "cls-n3-246",
    className: "N3-Tối 246",
    dueDate: "18/11/2026",
    type: "Kaiwa",
    questionsCount: 1,
    studentStatus: "todo",
    maxScore: 10,
    submittedCount: 5,
    totalStudents: 12,
  },
  {
    id: "asg-04",
    code: "BTVN-25",
    title: "Đọc hiểu Dokkai: Đoạn văn về văn hóa tắm Onsen & Ryokan",
    titleJa: "温泉[おんせん]と旅館[りょかん]の文化[ぶんか]",
    level: "N3",
    classId: "cls-n3-246",
    className: "N3-Tối 246",
    dueDate: "03/11/2026",
    type: "Đọc hiểu",
    questionsCount: 5,
    studentStatus: "graded",
    studentAnswer: "Đáp án: 1-B, 2-A, 3-C, 4-B, 5-D. Từ khóa chính: ～ため、したがって。",
    score: 9,
    maxScore: 10,
    feedback: "Bắt đúng từ khóa chỉ lý do (～ため) và mạch chuyển ý.",
    submittedCount: 11,
    totalStudents: 12,
  },
  {
    id: "asg-05",
    code: "BTVN-38",
    title: "Minna no Nihongo Bài 38: Chia 15 động từ sang thể bị động (受身形)",
    titleJa: "第38課[だいさんじゅうはっか] 受身形[うけみけい]",
    level: "N4",
    classId: "cls-n4-ct",
    className: "N4-Cấp Tốc",
    dueDate: "16/11/2026",
    type: "Ngữ pháp",
    questionsCount: 15,
    studentStatus: "todo",
    maxScore: 15,
    submittedCount: 11,
    totalStudents: 15,
  },
];

export type StudyMaterial = {
  id: string;
  title: string;
  titleJa?: string;
  category: "Giáo trình" | "Slide bài giảng" | "File âm thanh" | "Bảng từ vựng";
  lesson: string;
  format: "PDF" | "Audio" | "Slide";
  size: string;
  updatedAt: string;
};

export const MOCK_MATERIALS: StudyMaterial[] = [
  {
    id: "mat-01",
    title: "Minna no Nihongo II — Bản dịch & giải thích ngữ pháp bài 26–30",
    titleJa: "文法[ぶんぽう]解説[かいせつ]",
    category: "Giáo trình",
    lesson: "Bài 26–30",
    format: "PDF",
    size: "8.4 MB",
    updatedAt: "08/11/2026",
  },
  {
    id: "mat-02",
    title: "Slide bài 24: Thể bị động (受身形) & bài tập luyện phản xạ",
    titleJa: "受身形[うけみけい]スライド",
    category: "Slide bài giảng",
    lesson: "Bài 24",
    format: "Slide",
    size: "14.2 MB",
    updatedAt: "06/11/2026",
  },
  {
    id: "mat-03",
    title: "Audio Chokai bài 24: Hội thoại thực tế tại ga tàu & văn phòng",
    titleJa: "聴解[ちょうかい]音声[おんせい]",
    category: "File âm thanh",
    lesson: "Bài 24",
    format: "Audio",
    size: "22.1 MB",
    updatedAt: "06/11/2026",
  },
  {
    id: "mat-04",
    title: "Bảng 100 chữ Kanji N4 hay nhầm lẫn (kèm bộ thủ và câu ví dụ)",
    titleJa: "漢字[かんじ]まとめ",
    category: "Bảng từ vựng",
    lesson: "Ôn tập N4",
    format: "PDF",
    size: "3.1 MB",
    updatedAt: "01/11/2026",
  },
];

