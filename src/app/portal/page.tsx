"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  Heart,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  Users2,
} from "lucide-react";
import { FuriganaText } from "@/components/furigana-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AnnouncementFeed } from "@/components/portal/announcement-feed";
import { ClassSelector } from "@/components/portal/class-selector";
import { StudentRosterList } from "@/components/portal/student-roster";
import {
  getActiveClassId,
  subscribeActiveClass,
} from "@/lib/classroom-store";
import { getLeadsServerSnapshot, getLeadsSnapshot, subscribeLeads } from "@/lib/leads";
import { useRole } from "@/lib/role-context";
import {
  getClasses,
  getAllUsers,
  getAllSubmissions,
  getAllTests,
} from "@/lib/db/services";
import type { ClassDoc, UserProfileDoc, TestSubmissionDoc, JLPTTestDoc } from "@/lib/db/schema";

export default function PortalDashboard() {
  const { role, user } = useRole();

  if (role === "admin") return <AdminDashboard />;
  if (role === "sensei") return <SenseiDashboard />;
  if (role === "guest" || !user.classId) return <GuestDashboard />;
  return <StudentDashboard />;
}

/* =====================================================================
 * 0. GUEST VIEW (Khách / Thành viên chưa xếp lớp)
 * ===================================================================== */
function GuestDashboard() {
  const { user } = useRole();

  return (
    <div className="space-y-6 animate-[rise-in_260ms_var(--ease-out-expo)_both]">
      {/* Welcome banner */}
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-shinme-line pb-5">
        <div>
          <h1 className="text-2xl font-black text-shinme-ink sm:text-3xl">
            Xin chào, {user.name}! 👋
          </h1>
          <p className="mt-1 text-sm font-semibold text-shinme-muted">
            Chào mừng bạn đến với Cổng học tập trực tuyến Nhật ngữ Shinme
          </p>
        </div>
        <Badge tone="warn">Trạng thái: Khách (Chưa xếp lớp)</Badge>
      </div>

      {/* Main Unassigned Notice Card */}
      <div className="relative overflow-hidden rounded-3xl border border-shinme-border bg-gradient-to-br from-shinme-surface via-shinme-surface to-shinme-leaf-faint p-6 sm:p-8 shadow-[var(--shadow-card)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-shinme-leaf text-shinme-primary shadow-sm">
            <BookOpen className="size-7" />
          </div>
          <div className="space-y-2 flex-1">
            <h2 className="text-xl font-black text-shinme-ink sm:text-2xl">
              Bạn chưa vào lớp học nào
            </h2>
            <p className="text-sm font-medium text-shinme-ink-soft leading-relaxed max-w-2xl">
              Tài khoản của bạn hiện đang ở trạng thái <strong>Khách vãng lai (chưa được phân lớp)</strong>.
              Ban giáo vụ và Quản trị viên (Admin) Shinme sẽ sớm liên hệ để tư vấn trình độ JLPT phù hợp và thêm bạn vào lớp học chính thức.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button asChild size="sm">
                <Link href="/portal/profile">
                  <UserCheck className="size-4" /> Cập nhật hồ sơ cá nhân
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/#tu-van">
                  <Sparkles className="size-4" /> Đăng ký tư vấn xếp lớp
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-5 shadow-[var(--shadow-card)] space-y-2">
          <div className="flex items-center gap-2 text-shinme-primary font-bold text-sm">
            <GraduationCap className="size-4" /> Lộ trình đào tạo Shinme
          </div>
          <p className="text-xs text-shinme-muted leading-relaxed">
            Shinme cung cấp đầy đủ các chương trình từ N5, N4 Cấp tốc, N3 Tối, Kaiwa Thực chiến đến Luyện đề JLPT chuyên sâu. Bạn có thể xem thêm thông tin chi tiết trên trang chủ.
          </p>
          <Link href="/" className="inline-block text-xs font-bold text-shinme-primary hover:underline pt-1">
            Xem các khóa học & lộ trình →
          </Link>
        </div>

        <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-5 shadow-[var(--shadow-card)] space-y-2">
          <div className="flex items-center gap-2 text-shinme-primary font-bold text-sm">
            <Clock className="size-4" /> Hỗ trợ học viên & Giáo vụ
          </div>
          <p className="text-xs text-shinme-muted leading-relaxed">
            Nếu bạn đã đăng ký khóa học nhưng chưa được kích hoạt lớp, vui lòng nhắn tin trực tiếp cho Sensei phụ trách hoặc liên hệ hotline giáo vụ: <strong className="text-shinme-ink">0988 123 456</strong>.
          </p>
        </div>
      </div>

      {/* Center Announcements */}
      <AnnouncementFeed />
    </div>
  );
}

/* =====================================================================
 * 1. STUDENT VIEW
 * ===================================================================== */
function StudentDashboard() {
  const { user, firebaseUser } = useRole();

  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [submissions, setSubmissions] = useState<TestSubmissionDoc[]>([]);
  const [tests, setTests] = useState<JLPTTestDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([getClasses(), getAllSubmissions(), getAllTests()])
      .then(([cList, sList, tList]) => {
        setClasses(cList);
        setSubmissions(sList);
        setTests(tList);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const assignedClass =
    classes.find((c) => c.id === user.classId) ||
    classes.find((c) => c.name.includes("N3")) ||
    classes[0] || {
      id: "cls-n3-246",
      shortName: "N3-Tối 246",
      name: "N3-Tối 246 (Sensei Tanaka)",
      completedSessions: 26,
      totalSessions: 40,
      currentLesson: "Bài 26: Ngữ pháp Soumatome",
    };

  // Student's test submissions
  const mySubmissions = submissions.filter(
    (s) =>
      s.studentId === user.id ||
      s.studentCode === user.code ||
      (firebaseUser && s.studentId === firebaseUser.uid)
  );

  const avgScore =
    mySubmissions.length > 0
      ? (
          mySubmissions.reduce((sum, s) => sum + s.score, 0) /
          mySubmissions.length
        ).toFixed(1)
      : null;

  const passedCount = mySubmissions.filter((s) => s.passed).length;
  const progressPercent = Math.min(
    100,
    Math.round((assignedClass.completedSessions / (assignedClass.totalSessions || 40)) * 100)
  );

  const upcomingTest = tests.find(
    (t) => t.classId === assignedClass.id || t.classId === "ALL"
  );

  return (
    <div className="space-y-6 animate-[rise-in_260ms_var(--ease-out-expo)_both]">
      {/* Role-Scoped Class Selector / Banner */}
      <ClassSelector />

      {/* Mascot Welcoming Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-shinme-primary to-shinme-primary-soft p-6 text-white shadow-[var(--shadow-lift)] sm:p-8">
        <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
          <div className="space-y-3 z-10">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-black text-shinme-accent">
                <Sparkles className="size-3.5" /> Lộ trình JLPT · Cổng Học Viên Shinme
              </span>
              <span className="rounded-full bg-shinme-accent px-2.5 py-0.5 text-xs font-black text-shinme-primary-deep">
                {assignedClass.shortName}
              </span>
            </div>

            <h1 className="text-2xl font-black sm:text-3xl">
              Konnichiwa, {user.name} <span className="font-jp text-shinme-accent">さん！</span>
            </h1>

            <p className="max-w-[48ch] text-sm leading-relaxed text-white/80">
              <FuriganaText text="日本語[にほんご]で未来[みらい]をひらく" className="font-bold text-shinme-accent mr-1" />
              — Chào mừng bạn đến với Cổng học tập Shinme. Hãy theo dõi thông báo và làm các bài kiểm tra được giao nhé!
            </p>

            {/* Upcoming test banner */}
            {upcomingTest && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/10 p-4 border border-white/15">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-shinme-accent text-shinme-primary-deep">
                    <Clock className="size-5" />
                  </span>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-shinme-accent">
                      Bài kiểm tra cần làm:
                    </span>
                    <p className="text-sm font-black text-white">{upcomingTest.title}</p>
                    <p className="text-xs text-white/70">
                      Thời gian: {upcomingTest.durationMinutes} phút · Điểm đạt: {upcomingTest.passScore}/{upcomingTest.totalPoints}đ
                    </p>
                  </div>
                </div>

                <Button asChild size="sm" variant="onDark">
                  <Link href={`/portal/tests/${upcomingTest.id}/take`}>
                    Vào phòng thi <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mascot Avatar */}
          <div className="relative mx-auto flex flex-col items-center justify-center md:mx-0">
            <div className="relative size-36 overflow-hidden rounded-full border-4 border-white/30 shadow-lg sm:size-40">
              <Image
                src="/brand/shinme-mascot.jpg"
                alt="Linh vật Shinme cổ vũ"
                fill
                priority
                sizes="160px"
                className="object-cover object-[45%_35%] scale-110"
              />
            </div>
            <div className="absolute -bottom-2 animate-[leaf-pop_600ms_var(--ease-out-expo)_both] rounded-full bg-shinme-surface px-3 py-1 text-xs font-black text-shinme-primary shadow-md">
              <span className="inline-flex items-center gap-1">
                Cố lên! <Heart className="size-3 fill-shinme-accent text-shinme-accent" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-shinme-muted">Tiến độ khóa học</span>
            <TrendingUp className="size-4 text-shinme-primary" />
          </div>
          <p className="tabular mt-3 text-3xl font-black text-shinme-primary">
            {assignedClass.completedSessions}/{assignedClass.totalSessions}
          </p>
          <p className="mt-1 text-xs font-semibold text-shinme-muted">buổi · {progressPercent}% lộ trình</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-shinme-bg-deep">
            <div
              className="h-full rounded-full bg-shinme-accent"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-shinme-muted">Bài thi đã làm</span>
            <CheckCircle2 className="size-4 text-shinme-primary" />
          </div>
          <p className="tabular mt-3 text-3xl font-black text-shinme-primary">
            {mySubmissions.length}
          </p>
          <p className="mt-1 text-xs font-semibold text-shinme-muted">
            {passedCount} bài đạt chuẩn (Goukaku)
          </p>
          <p className="mt-3 text-xs font-bold text-shinme-accent">
            {mySubmissions.length > 0 ? "Tiếp tục phát huy nhé!" : "Hãy làm bài test đầu tiên!"}
          </p>
        </div>

        <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-shinme-muted">Điểm trung bình</span>
            <Award className="size-4 text-shinme-warn" />
          </div>
          <p className="tabular mt-3 text-3xl font-black text-shinme-ink">
            {avgScore !== null ? `${avgScore}đ` : "--"}
          </p>
          <p className="mt-1 text-xs font-semibold text-shinme-muted">
            {avgScore !== null ? "Tính trên các bài thi đã nộp" : "Chưa có điểm"}
          </p>
          <Link
            href="/portal/gradebook"
            className="mt-3 block text-xs font-bold text-shinme-primary hover:underline"
          >
            Xem chi tiết bảng điểm →
          </Link>
        </div>
      </div>

      {/* Announcements Feed */}
      <AnnouncementFeed />
    </div>
  );
}

/* =====================================================================
 * 2. SENSEI VIEW
 * ===================================================================== */
function SenseiDashboard() {
  const { user, role } = useRole();
  const activeClassId = useSyncExternalStore(
    subscribeActiveClass,
    () => getActiveClassId(role),
    () => "cls-n3-246"
  );

  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [users, setUsers] = useState<UserProfileDoc[]>([]);
  const [submissions, setSubmissions] = useState<TestSubmissionDoc[]>([]);

  useEffect(() => {
    Promise.all([getClasses(), getAllUsers(), getAllSubmissions()])
      .then(([cList, uList, sList]) => {
        setClasses(cList);
        setUsers(uList);
        setSubmissions(sList);
      })
      .catch(console.error);
  }, []);

  const currentClass =
    classes.find((c) => c.id === activeClassId) ||
    classes[0] || {
      id: "cls-n3-246",
      shortName: "Lớp học",
      name: "Lớp học Shinme",
      completedSessions: 0,
      totalSessions: 30,
      currentLesson: "Bài học đang diễn ra",
    };

  const classStudents = users.filter(
    (u) =>
      u.role === "student" &&
      (u.classId === activeClassId || (!u.classId && activeClassId === "cls-n3-246"))
  );

  return (
    <div className="space-y-6 animate-[rise-in_260ms_var(--ease-out-expo)_both]">
      {/* Header */}
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-shinme-line pb-4">
        <div>
          <h1 className="text-2xl font-black text-shinme-ink sm:text-3xl">
            Kính chào <FuriganaText text={user.nameJa ?? user.name} className="font-jp" /> Sensei!
          </h1>
          <p className="mt-1 text-sm font-semibold text-shinme-muted">
            Quản lý lớp giảng dạy, bảng điểm học viên và kho tài liệu số hóa
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/portal/gradebook">
              <Award className="size-4" /> Bảng điểm lớp
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/portal/tests/create">
              <Sparkles className="size-4" /> Tạo đề thi JLPT mới
            </Link>
          </Button>
        </div>
      </div>

      {/* Class Selector Switcher */}
      <ClassSelector />

      {/* Class KPI Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-bold uppercase tracking-wider text-shinme-muted">Sĩ số lớp hiện tại</p>
          <p className="tabular mt-2 text-3xl font-black text-shinme-primary">{classStudents.length}</p>
          <p className="mt-1 text-xs text-shinme-muted">{currentClass.shortName}</p>
        </div>

        <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-bold uppercase tracking-wider text-shinme-muted">Tiến độ bài học</p>
          <p className="tabular mt-2 text-3xl font-black text-shinme-primary">
            {currentClass.completedSessions}/{currentClass.totalSessions}
          </p>
          <p className="mt-1 text-xs text-shinme-muted">buổi giảng dạy</p>
        </div>

        <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-bold uppercase tracking-wider text-shinme-muted">Bài đang học</p>
          <p className="mt-2 text-sm font-black text-shinme-ink truncate">{currentClass.currentLesson}</p>
          {currentClass.currentLessonJa && (
            <FuriganaText text={currentClass.currentLessonJa} className="block text-xs font-bold text-shinme-primary truncate mt-0.5" />
          )}
        </div>
      </div>

      {/* Student Roster */}
      <StudentRosterList />

      {/* Announcement Feed with Composer */}
      <AnnouncementFeed />
    </div>
  );
}

/* =====================================================================
 * 3. ADMIN VIEW
 * ===================================================================== */
function AdminDashboard() {
  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [users, setUsers] = useState<UserProfileDoc[]>([]);
  const leads = useSyncExternalStore(subscribeLeads, getLeadsSnapshot, getLeadsServerSnapshot);

  useEffect(() => {
    Promise.all([getClasses(), getAllUsers()]).then(([cList, uList]) => {
      setClasses(cList);
      setUsers(uList);
    }).catch(console.error);
  }, []);

  const totalStudents = users.filter((u) => u.role === "student").length;
  const totalSenseis = users.filter((u) => u.role === "sensei").length;
  const totalGuests = users.filter((u) => u.role === "guest").length;

  return (
    <div className="space-y-6 animate-[rise-in_260ms_var(--ease-out-expo)_both]">
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-shinme-line pb-4">
        <div>
          <h1 className="text-2xl font-black text-shinme-ink sm:text-3xl">Tổng quan Trung tâm Shinme</h1>
          <p className="mt-1 text-sm font-semibold text-shinme-muted">Bảng điều hành Giáo vụ, Tuyển sinh & Lớp học</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/portal/users">
              <Users className="size-4" /> Quản lý Người dùng & Giáo viên ({users.length})
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/portal/leads">
              <Users2 className="size-4" /> Leads tư vấn ({leads.length})
            </Link>
          </Button>
        </div>
      </div>

      {/* Class Selector for Admin */}
      <ClassSelector />

      {/* Center KPIs */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-bold uppercase tracking-wider text-shinme-muted">Học viên chính thức</p>
          <p className="tabular mt-2 text-3xl font-black text-shinme-primary">{totalStudents}</p>
          <p className="mt-1 text-xs text-shinme-muted">{classes.length} lớp đang vận hành</p>
        </div>
        <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-bold uppercase tracking-wider text-shinme-muted">Sensei hoạt động</p>
          <p className="tabular mt-2 text-3xl font-black text-shinme-primary">{totalSenseis}</p>
          <p className="mt-1 text-xs text-shinme-muted">Giáo viên trên hệ thống</p>
        </div>
        <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-bold uppercase tracking-wider text-shinme-muted">Khách chưa xếp lớp</p>
          <p className="tabular mt-2 text-3xl font-black text-amber-600">{totalGuests}</p>
          <p className="mt-1 text-xs text-shinme-muted">Cần Admin phân lớp học</p>
        </div>
        <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-bold uppercase tracking-wider text-shinme-muted">Tổng số lớp học</p>
          <p className="tabular mt-2 text-3xl font-black text-shinme-ink">{classes.length}</p>
          <p className="mt-1 text-xs text-shinme-muted">N5 · N4 · N3 · Kaiwa</p>
        </div>
      </div>

      {/* Student Roster for selected class */}
      <StudentRosterList />

      {/* Announcements */}
      <AnnouncementFeed />
    </div>
  );
}
