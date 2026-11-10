import type { MondaiType, AudioPlayLimit, TestQuestion } from "@/lib/test-center-store";
import type { RoleId } from "@/lib/role-context";

/* =====================================================================
 * 1. USERS & PROFILES COLLECTION: `users`
 * ===================================================================== */
export type UserProfileDoc = {
  uid: string;
  email: string;
  role: RoleId; // "student" | "sensei" | "admin"
  code: string; // e.g. "HV-202601", "SS-TANAKA"
  fullName: string;
  fullNameJa?: string;
  avatarText: string;
  avatarUrl?: string;
  phone?: string;
  classId?: string; // lớp học đang tham gia
  className?: string;
  targetJLPT?: "N5" | "N4" | "N3" | "N2" | "N1" | "KAIWA";
  createdAt: string;
  updatedAt?: string;
};

/* =====================================================================
 * 2. CLASSES COLLECTION: `classes`
 * ===================================================================== */
export type ClassDoc = {
  id: string;
  code: string;
  name: string;
  shortName: string;
  level: "N5" | "N4" | "N3" | "N2" | "N1" | "KAIWA";
  senseiId: string;
  senseiName: string;
  schedule: string; // "Thứ 2 · 4 · 6"
  time: string; // "19:00 – 21:00"
  room: string;
  totalSessions: number;
  completedSessions: number;
  studentsCount: number;
  currentLesson: string;
  currentLessonJa?: string;
  createdAt: string;
};

/* =====================================================================
 * 3. TESTS COLLECTION: `tests`
 * ===================================================================== */
export type JLPTTestDoc = {
  id: string;
  code: string;
  title: string;
  titleJa: string;
  classId: string;
  className: string;
  level: "N5" | "N4" | "N3" | "N2" | "N1" | "KAIWA";
  durationMinutes: number;
  deadline: string;
  maxAttempts: number;
  passScore: number;
  totalPoints: number;
  shuffleQuestions: boolean;
  createdBy: string;
  createdAt: string;
  questions: TestQuestion[];
};

/* =====================================================================
 * 4. TEST SUBMISSIONS COLLECTION: `test_submissions`
 * ===================================================================== */
export type TestSubmissionDoc = {
  id: string;
  testId: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  score: number;
  totalPoints: number;
  passed: boolean;
  durationSeconds: number;
  answers: Record<string, number>;
  submittedAt: string;
};

/* =====================================================================
 * 5. ANNOUNCEMENTS COLLECTION: `announcements`
 * ===================================================================== */
export type AnnouncementDoc = {
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

/* =====================================================================
 * 6. LEADS COLLECTION: `leads`
 * ===================================================================== */
export type LeadDoc = {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  currentLevel: string;
  targetGoal: string;
  status: "Chưa liên hệ" | "Đang tư vấn" | "Đã đăng ký" | "Hủy";
  notes?: string;
  createdAt: string;
};

