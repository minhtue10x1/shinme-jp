"use client";

export type JapaneseClass = {
  id: string;
  name: string;
  shortName: string;
  level: "N5" | "N4" | "N3" | "N2" | "N1" | "KAIWA";
  sensei: string;
  senseiId: string;
  schedule: string;
  time: string;
  room: string;
  currentLesson: string;
  currentLessonJa?: string;
  totalSessions: number;
  completedSessions: number;
  studentsCount: number;
  upcomingTest?: {
    title: string;
    dueDate: string;
    duration: string;
    points: number;
  };
};

export type StudentRoster = {
  id: string;
  code: string;
  fullName: string;
  email: string;
  progressPercent: number;
  completedAssignments: number;
  totalAssignments: number;
  averageScore: number;
  attendancePercent: number;
  status: "Đang học" | "Cảnh báo" | "Bảo lưu";
};

export type ClassAnnouncement = {
  id: string;
  classId: string; // or "ALL"
  className: string;
  title: string;
  titleJa?: string;
  content: string;
  authorName: string;
  authorRole: "Sensei" | "Admin";
  category: "BTVN & Luyện thi" | "Lịch học & Phòng học" | "Tài liệu học tập" | "Thông báo chung";
  isPinned: boolean;
  createdAt: string;
};

export type ResourceCategory = "ALL" | "Goi" | "Bunpou" | "Dokkai" | "Choukai" | "PDF";

export type ClassResource = {
  id: string;
  classId: string; // or "ALL"
  className: string;
  title: string;
  titleJa?: string;
  category: "Goi" | "Bunpou" | "Dokkai" | "Choukai" | "PDF";
  fileType: "PDF" | "MP3" | "DOCX";
  fileSize: string;
  lessonTag: string; // e.g. "Bài 26", "Tuần 3", "Soumatome"
  uploadedBy: string;
  uploadedAt: string;
  isProtected: boolean; // "Chỉ cho phép xem/nghe trực tuyến (Chặn tải xuống)"
  description?: string;
  previewText?: string;
  audioDuration?: string;
};

/* ------------------------------------------------------------------
 * 1. MOCK DATA
 * ------------------------------------------------------------------ */
export const MOCK_CLASSES: JapaneseClass[] = [
  {
    id: "cls-n3-246",
    name: "N3-Tối 246 (Sensei Tanaka)",
    shortName: "N3-Tối 246",
    level: "N3",
    sensei: "Tanaka Yuki",
    senseiId: "ss-tanaka",
    schedule: "Thứ 2 · 4 · 6",
    time: "19:00 – 21:00",
    room: "Phòng 204 & Zoom ID: 889-234-112",
    currentLesson: "Bài 26: Ngữ pháp Soumatome & Đọc hiểu đoạn văn",
    currentLessonJa: "第26課[だいにじゅうろっか] 総まとめ文法[そうまとめぶんぽう]",
    totalSessions: 40,
    completedSessions: 26,
    studentsCount: 12,
    upcomingTest: {
      title: "Đề thi thử JLPT N3 Đợt 1 (Mondai 1-4)",
      dueDate: "Chủ Nhật, 15/11 · 23:59",
      duration: "45 phút",
      points: 100,
    },
  },
  {
    id: "cls-n4-ct",
    name: "N4-Cấp Tốc (Sensei Mai)",
    shortName: "N4-Cấp Tốc",
    level: "N4",
    sensei: "Nguyễn Mai",
    senseiId: "ss-mai",
    schedule: "Thứ 3 · 5 · 7",
    time: "18:30 – 20:30",
    room: "Phòng 102 & Zoom ID: 442-991-301",
    currentLesson: "Bài 38: Thể bị động (受身形) & Minna no Nihongo II",
    currentLessonJa: "第38課[だいさんじゅうはっか] 受身形[うけみけい]",
    totalSessions: 36,
    completedSessions: 24,
    studentsCount: 15,
    upcomingTest: {
      title: "Kiểm tra Kanji 50 chữ N4 & Thể bị động",
      dueDate: "Thứ Bảy, 14/11 · 20:30",
      duration: "30 phút",
      points: 50,
    },
  },
  {
    id: "cls-kaiwa-stc",
    name: "Kaiwa Sơ Trung Cấp",
    shortName: "Kaiwa Sơ Trung Cấp",
    level: "KAIWA",
    sensei: "Tanaka Yuki",
    senseiId: "ss-tanaka",
    schedule: "Thứ 7 & Chủ Nhật",
    time: "14:00 – 16:00",
    room: "Phòng Tatami 101 (Trực tiếp)",
    currentLesson: "Chủ đề 6: Giao tiếp công sở & Kính ngữ khi phỏng vấn",
    currentLessonJa: "ビジネス会話[かいわ]と敬語[けいご]",
    totalSessions: 16,
    completedSessions: 9,
    studentsCount: 8,
    upcomingTest: {
      title: "Ghi âm Kaiwa 1-1: Xử lý tình huống từ chối lịch hẹn",
      dueDate: "Thứ Hai, 16/11 · 18:00",
      duration: "10 phút",
      points: 20,
    },
  },
];

export const MOCK_ROSTERS: Record<string, StudentRoster[]> = {
  "cls-n3-246": [
    {
      id: "std-01",
      code: "HV-202601",
      fullName: "Lê Hoàng Nam",
      email: "nam.le2026@gmail.com",
      progressPercent: 88,
      completedAssignments: 22,
      totalAssignments: 25,
      averageScore: 9.0,
      attendancePercent: 100,
      status: "Đang học",
    },
    {
      id: "std-02",
      code: "HV-202602",
      fullName: "Trần Minh Anh",
      email: "minhanh.t@gmail.com",
      progressPercent: 80,
      completedAssignments: 20,
      totalAssignments: 25,
      averageScore: 8.6,
      attendancePercent: 96,
      status: "Đang học",
    },
    {
      id: "std-03",
      code: "HV-202605",
      fullName: "Phạm Quốc Huy",
      email: "huy.pq@yahoo.com",
      progressPercent: 96,
      completedAssignments: 24,
      totalAssignments: 25,
      averageScore: 9.5,
      attendancePercent: 100,
      status: "Đang học",
    },
    {
      id: "std-04",
      code: "HV-202608",
      fullName: "Đặng Thu Thảo",
      email: "thao.dang@outlook.com",
      progressPercent: 64,
      completedAssignments: 16,
      totalAssignments: 25,
      averageScore: 7.4,
      attendancePercent: 88,
      status: "Cảnh báo",
    },
    {
      id: "std-05",
      code: "HV-202611",
      fullName: "Vũ Đức Trọng",
      email: "trong.vu99@gmail.com",
      progressPercent: 84,
      completedAssignments: 21,
      totalAssignments: 25,
      averageScore: 8.8,
      attendancePercent: 92,
      status: "Đang học",
    },
    {
      id: "std-06",
      code: "HV-202614",
      fullName: "Nguyễn Hương Giang",
      email: "giang.nh@gmail.com",
      progressPercent: 92,
      completedAssignments: 23,
      totalAssignments: 25,
      averageScore: 9.1,
      attendancePercent: 96,
      status: "Đang học",
    },
  ],
  "cls-n4-ct": [
    {
      id: "std-21",
      code: "HV-202621",
      fullName: "Nguyễn Tuấn Kiệt",
      email: "kiet.nt@gmail.com",
      progressPercent: 90,
      completedAssignments: 18,
      totalAssignments: 20,
      averageScore: 8.8,
      attendancePercent: 100,
      status: "Đang học",
    },
    {
      id: "std-22",
      code: "HV-202622",
      fullName: "Bùi Thị Mai",
      email: "mai.bui@gmail.com",
      progressPercent: 75,
      completedAssignments: 15,
      totalAssignments: 20,
      averageScore: 8.0,
      attendancePercent: 90,
      status: "Đang học",
    },
  ],
  "cls-kaiwa-stc": [
    {
      id: "std-41",
      code: "HV-202641",
      fullName: "Hoàng Gia Bảo",
      email: "bao.hg@gmail.com",
      progressPercent: 100,
      completedAssignments: 8,
      totalAssignments: 8,
      averageScore: 9.6,
      attendancePercent: 100,
      status: "Đang học",
    },
    {
      id: "std-42",
      code: "HV-202642",
      fullName: "Phan Ánh Nguyệt",
      email: "nguyet.pa@gmail.com",
      progressPercent: 88,
      completedAssignments: 7,
      totalAssignments: 8,
      averageScore: 9.0,
      attendancePercent: 100,
      status: "Đang học",
    },
  ],
};

export const INITIAL_ANNOUNCEMENTS: ClassAnnouncement[] = [
  {
    id: "ann-01",
    classId: "cls-n3-246",
    className: "N3-Tối 246 (Sensei Tanaka)",
    title: "[QUAN TRỌNG] Hoàn thành Đề thi thử JLPT N3 Đợt 1 trước 23:59 Chủ Nhật",
    titleJa: "N3 模擬試験[もぎしけん]の提出[ていしゅつ]について",
    content:
      "Chào cả lớp! Để chuẩn bị tốt nhất cho kỳ thi sắp tới, Sensei đã mở đề thi thử N3 Đợt 1 trên Cổng học viên. Các em dành trọn vẹn 45 phút không tra từ điển để làm bài nghiêm túc nhé. Thứ Hai tuần tới chúng ta sẽ dành 1 tiếng để chữa chi tiết các câu bẫy trong phần Dokkai.\n\nLinh vật Shinme nhắn nhủ: 諦めずに頑張ろう！(Đừng bỏ cuộc, cùng cố gắng nhé!)",
    authorName: "Tanaka Yuki",
    authorRole: "Sensei",
    category: "BTVN & Luyện thi",
    isPinned: true,
    createdAt: "2026-11-09T09:30:00Z",
  },
  {
    id: "ann-02",
    classId: "cls-n3-246",
    className: "N3-Tối 246 (Sensei Tanaka)",
    title: "Tài liệu nghe Audio Choukai Bài 26 đã được cập nhật vào Kho",
    titleJa: "第26課[だいにじゅうろっか] 聴解[ちょうかい]ファイル追加[ついか]",
    content:
      "Sensei vừa tải lên 3 đoạn hội thoại thực tế tại phòng vé và nhà ga kèm transcript có Furigana. Các em vào mục 'Tài liệu lớp học' để nghe trước khi đến lớp nhé. Lưu ý: file này chỉ cho phép nghe trực tuyến trên Cổng Shinme.",
    authorName: "Tanaka Yuki",
    authorRole: "Sensei",
    category: "Tài liệu học tập",
    isPinned: false,
    createdAt: "2026-11-08T15:20:00Z",
  },
  {
    id: "ann-03",
    classId: "cls-n4-ct",
    className: "N4-Cấp Tốc (Sensei Mai)",
    title: "Lịch học bù buổi thứ Ba sang tối thứ Bảy tuần này",
    content:
      "Do Sensei có lịch công tác đột xuất vào thứ Ba, lớp N4-Cấp Tốc sẽ học bù vào tối Thứ Bảy (19:00 - 21:00) tại Phòng 102. Các bạn vắng có thể xem lại video ghi hình buổi học trên portal.",
    authorName: "Nguyễn Mai",
    authorRole: "Sensei",
    category: "Lịch học & Phòng học",
    isPinned: true,
    createdAt: "2026-11-07T11:00:00Z",
  },
  {
    id: "ann-04",
    classId: "cls-kaiwa-stc",
    className: "Kaiwa Sơ Trung Cấp",
    title: "Chủ đề Kaiwa cuối tuần: Đàm phán giá & Từ chối lịch hẹn lịch sự",
    titleJa: "ビジネス敬語[けいご]：断[ことわ]り方[かた]",
    content:
      "Cuối tuần này chúng ta sẽ thực hành nhập vai 1-1 với Sensei Tanaka. Các bạn hãy chuẩn bị trước danh sách 5 từ ngữ đệm (クッション言葉) như '大変恐れ入りますが', 'あいにくですが' nhé!",
    authorName: "Tanaka Yuki",
    authorRole: "Sensei",
    category: "BTVN & Luyện thi",
    isPinned: true,
    createdAt: "2026-11-06T14:45:00Z",
  },
];

export const INITIAL_RESOURCES: ClassResource[] = [
  {
    id: "res-01",
    classId: "cls-n3-246",
    className: "N3-Tối 246 (Sensei Tanaka)",
    title: "Soumatome N3 — Tổng hợp 120 mẫu ngữ pháp then chốt kèm ví dụ",
    titleJa: "総まとめN3 文法[ぶんぽう]まとめ",
    category: "Bunpou",
    fileType: "PDF",
    fileSize: "12.8 MB",
    lessonTag: "Soumatome N3",
    uploadedBy: "Tanaka Yuki Sensei",
    uploadedAt: "2026-11-08",
    isProtected: true, // Chặn tải xuống
    description: "Tài liệu biên soạn nội bộ độc quyền Shinme. Chú thích song ngữ Nhật - Việt chi tiết.",
    previewText:
      "Mục lục:\n1. ～うちに (Trong khi / Nhân lúc)\n2. ～わりに (Mặc dù... thế nhưng)\n3. ～くせに (Thế mà / Vậy mà - sắc thái chê trách)\n4. ～にかぎって (Chỉ riêng / Đúng lúc)\n5. ～をと通して (Thông qua / Suốt trong)",
  },
  {
    id: "res-02",
    classId: "cls-n3-246",
    className: "N3-Tối 246 (Sensei Tanaka)",
    title: "Audio Choukai Bài 26: Hội thoại phỏng vấn & đàm thoại công sở",
    titleJa: "第26課 聴解[ちょうかい]音声[おんせい]",
    category: "Choukai",
    fileType: "MP3",
    fileSize: "18.4 MB",
    lessonTag: "Bài 26",
    uploadedBy: "Tanaka Yuki Sensei",
    uploadedAt: "2026-11-08",
    isProtected: true, // Chặn tải xuống
    description: "Giọng đọc chuẩn Tokyo người bản xứ, nhịp điệu tự nhiên phục vụ luyện Mondai 3 Choukai.",
    audioDuration: "05:42",
  },
  {
    id: "res-03",
    classId: "cls-n3-246",
    className: "N3-Tối 246 (Sensei Tanaka)",
    title: "Bảng 150 chữ Kanji N3 có tần suất xuất hiện cao nhất trong đề thi",
    titleJa: "重要[じゅうよう]漢字[かんじ]150",
    category: "Goi",
    fileType: "PDF",
    fileSize: "4.2 MB",
    lessonTag: "Tuần 3",
    uploadedBy: "Tanaka Yuki Sensei",
    uploadedAt: "2026-11-05",
    isProtected: false, // Cho phép tải
    description: "Được phép tải về và in ấn làm flashcard cá nhân.",
    previewText:
      "Danh sách Kanji then chốt:\n- 政 (Chính - せい/まつりごと) · 政治[せいじ]\n- 経 (Kinh - けい/へる) · 経済[けいざい]\n- 済 (Tế - さい/すむ) · 返済[へんさい]\n- 際 (Tế - さい/きわ) · 国際[こくさい]",
  },
  {
    id: "res-04",
    classId: "cls-n3-246",
    className: "N3-Tối 246 (Sensei Tanaka)",
    title: "Chiến lược làm bài Đọc hiểu Dokkai N3: Đoạn văn vừa & dài",
    titleJa: "読解[どっかい]の解き方[ときかた]コツ",
    category: "Dokkai",
    fileType: "DOCX",
    fileSize: "2.1 MB",
    lessonTag: "Bài 25-28",
    uploadedBy: "Tanaka Yuki Sensei",
    uploadedAt: "2026-11-03",
    isProtected: false,
    description: "Bí quyết bắt từ khóa chỉ nguyên nhân (～ため, ～から) và chuyển ý (しかし, ところが).",
    previewText:
      "3 Bước giải nhanh bài Dokkai N3:\nBước 1: Đọc câu hỏi và gạch chân từ khóa hỏi 'Ai?', 'Tại sao?', 'Điều tác giả muốn nói nhất'.\nBước 2: Quét đoạn văn chứa từ khóa và đọc kỹ 1 câu trước + 1 câu sau.\nBước 3: Loại trừ 2 đáp án mang tính tuyệt đối hóa (すべて, 絶対に).",
  },
  {
    id: "res-05",
    classId: "cls-n3-246",
    className: "N3-Tối 246 (Sensei Tanaka)",
    title: "Giáo trình Minna no Nihongo Trung Cấp 1 (Chukyu I) — Bản dịch VI",
    titleJa: "みんなの日本語[にほんご] 中級[ちゅうきゅう]I",
    category: "PDF",
    fileType: "PDF",
    fileSize: "32.0 MB",
    lessonTag: "Giáo trình chính",
    uploadedBy: "Shinme Academic Office",
    uploadedAt: "2026-10-20",
    isProtected: true, // Bản quyền Shinme
    description: "Giáo trình học chính khóa trên lớp. Chặn tải xuống theo quy định bản quyền trung tâm.",
    previewText: "Giáo trình Minna no Nihongo Chukyu I — Bản quyền phân phối nội bộ Trung tâm Nhật ngữ Shinme.",
  },
  {
    id: "res-06",
    classId: "cls-n4-ct",
    className: "N4-Cấp Tốc (Sensei Mai)",
    title: "Slide bài 38: Cấu trúc thể bị động (受身形) & bài tập luyện phản xạ",
    titleJa: "受身形[うけみけい]スライド",
    category: "Bunpou",
    fileType: "PDF",
    fileSize: "8.5 MB",
    lessonTag: "Bài 38",
    uploadedBy: "Nguyễn Mai Sensei",
    uploadedAt: "2026-11-06",
    isProtected: false,
    description: "Slide bài giảng trực tiếp trên lớp của cô Mai.",
  },
  {
    id: "res-07",
    classId: "cls-kaiwa-stc",
    className: "Kaiwa Sơ Trung Cấp",
    title: "Audio đóng vai: 10 tình huống xin lỗi & từ chối trong kinh doanh",
    titleJa: "ロールプレイ音声[おんせい]",
    category: "Choukai",
    fileType: "MP3",
    fileSize: "15.6 MB",
    lessonTag: "Chủ đề 6",
    uploadedBy: "Tanaka Yuki Sensei",
    uploadedAt: "2026-11-04",
    isProtected: true,
    description: "Hội thoại mẫu giữa trưởng phòng và nhân viên.",
    audioDuration: "04:15",
  },
];

/* ------------------------------------------------------------------
 * 2. LOCALSTORAGE KEYS & SYNC HELPERS
 * ------------------------------------------------------------------ */
const ANNOUNCEMENTS_KEY = "shinme:announcements";
const RESOURCES_KEY = "shinme:resources";
const ACTIVE_CLASS_KEY = "shinme:active-class";

const ANN_EVENT = "shinme:announcements-changed";
const RES_EVENT = "shinme:resources-changed";
const CLASS_EVENT = "shinme:class-changed";

export function readAnnouncements(): ClassAnnouncement[] {
  if (typeof window === "undefined") return INITIAL_ANNOUNCEMENTS;
  try {
    const raw = window.localStorage.getItem(ANNOUNCEMENTS_KEY);
    return raw ? JSON.parse(raw) : INITIAL_ANNOUNCEMENTS;
  } catch {
    return INITIAL_ANNOUNCEMENTS;
  }
}

export function saveAnnouncement(ann: Omit<ClassAnnouncement, "id" | "createdAt">): ClassAnnouncement {
  const full: ClassAnnouncement = {
    ...ann,
    id: `ann-${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
  };
  const list = [full, ...readAnnouncements()];
  window.localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(ANN_EVENT));
  return full;
}

export function deleteAnnouncement(id: string) {
  const list = readAnnouncements().filter((a) => a.id !== id);
  window.localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(ANN_EVENT));
}

export function togglePinAnnouncement(id: string) {
  const list = readAnnouncements().map((a) => (a.id === id ? { ...a, isPinned: !a.isPinned } : a));
  window.localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(ANN_EVENT));
}

export function readResources(): ClassResource[] {
  if (typeof window === "undefined") return INITIAL_RESOURCES;
  try {
    const raw = window.localStorage.getItem(RESOURCES_KEY);
    return raw ? JSON.parse(raw) : INITIAL_RESOURCES;
  } catch {
    return INITIAL_RESOURCES;
  }
}

export function saveResource(res: Omit<ClassResource, "id" | "uploadedAt">): ClassResource {
  const full: ClassResource = {
    ...res,
    id: `res-${Date.now().toString(36)}`,
    uploadedAt: new Date().toISOString().slice(0, 10),
  };
  const list = [full, ...readResources()];
  window.localStorage.setItem(RESOURCES_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(RES_EVENT));
  return full;
}

export function deleteResource(id: string) {
  const list = readResources().filter((r) => r.id !== id);
  window.localStorage.setItem(RESOURCES_KEY, JSON.stringify(list));
  window.dispatchEvent(new Event(RES_EVENT));
}

export function getActiveClassId(role: string): string {
  if (typeof window === "undefined") return "cls-n3-246";
  // Student is strictly locked to their assigned class: N3-Tối 246
  if (role === "student") return "cls-n3-246";
  try {
    return window.localStorage.getItem(ACTIVE_CLASS_KEY) || "cls-n3-246";
  } catch {
    return "cls-n3-246";
  }
}

export function setActiveClassId(classId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACTIVE_CLASS_KEY, classId);
  window.dispatchEvent(new Event(CLASS_EVENT));
}

/* Sync hooks helpers */
export function subscribeAnnouncements(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(ANN_EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(ANN_EVENT, cb);
  };
}

export function subscribeResources(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(RES_EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(RES_EVENT, cb);
  };
}

export function subscribeActiveClass(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(CLASS_EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(CLASS_EVENT, cb);
  };
}
