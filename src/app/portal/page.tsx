"use client";

import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  FileCheck2,
  GraduationCap,
  Heart,
  Megaphone,
  School,
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
import { getActiveClassId, MOCK_CLASSES, subscribeActiveClass } from "@/lib/classroom-store";
import { MOCK_ASSIGNMENTS } from "@/data/portal-data";
import { getLeadsServerSnapshot, getLeadsSnapshot, subscribeLeads } from "@/lib/leads";
import { useRole } from "@/lib/role-context";

export default function PortalDashboard() {
  const { role } = useRole();

  if (role === "admin") return <AdminDashboard />;
  if (role === "sensei") return <SenseiDashboard />;
  return <StudentDashboard />;
}

/* =====================================================================
 * 1. STUDENT VIEW
 * ===================================================================== */
function StudentDashboard() {
  const { user } = useRole();
  const todo = MOCK_ASSIGNMENTS.filter((a) => a.studentStatus === "todo");
  const graded = MOCK_ASSIGNMENTS.filter((a) => a.studentStatus === "graded");
  const assignedClass = MOCK_CLASSES.find((c) => c.id === "cls-n3-246")!;

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
                <Sparkles className="size-3.5" /> Lộ trình N3 · Giai đoạn Lá non (若葉)
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
              — Hôm nay lớp chúng ta học tiếp ngữ pháp Bài 26. Hãy kiểm tra các thông báo mới từ Sensei Tanaka bên dưới nhé!
            </p>

            {/* Upcoming test deadline card */}
            {assignedClass.upcomingTest && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/10 p-4 border border-white/15">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-shinme-accent text-shinme-primary-deep">
                    <Clock className="size-5" />
                  </span>
                  <div>
                    <span className="text-[0.7rem] font-bold uppercase tracking-wider text-shinme-accent">
                      Hạn chót sắp tới:
                    </span>
                    <p className="text-sm font-black text-white">{assignedClass.upcomingTest.title}</p>
                    <p className="text-xs text-white/70">
                      Hạn nộp: <strong className="text-shinme-accent font-bold">{assignedClass.upcomingTest.dueDate}</strong> · Thời gian: {assignedClass.upcomingTest.duration}
                    </p>
                  </div>
                </div>

                <Button asChild size="sm" variant="onDark">
                  <Link href="/portal/exam/jlpt-n4-mock-01">
                    Vào làm bài ngay <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mascot Chibi Avatar with Speech Bubble */}
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
          <p className="mt-1 text-xs font-semibold text-shinme-muted">buổi · 65% lộ trình N3</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-shinme-bg-deep">
            <div className="h-full w-[65%] rounded-full bg-shinme-accent" />
          </div>
        </div>

        <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-shinme-muted">Chuyên cần</span>
            <CheckCircle2 className="size-4 text-shinme-primary" />
          </div>
          <p className="tabular mt-3 text-3xl font-black text-shinme-primary">100%</p>
          <p className="mt-1 text-xs font-semibold text-shinme-muted">26/26 buổi có mặt đầy đủ</p>
          <p className="mt-3 text-xs font-bold text-shinme-accent">Rất chăm chỉ! いつも頑張ってるね！</p>
        </div>

        <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-shinme-muted">Điểm trung bình</span>
            <Award className="size-4 text-shinme-warn" />
          </div>
          <p className="tabular mt-3 text-3xl font-black text-shinme-ink">9.0/10</p>
          <p className="mt-1 text-xs font-semibold text-shinme-muted">Xếp hạng: Top 2 lớp {assignedClass.shortName}</p>
          <p className="mt-3 text-xs font-semibold text-shinme-muted">Đã hoàn thành 22/25 bài</p>
        </div>
      </div>

      {/* Two columns: Announcements Feed & Quick Links */}
      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="space-y-6">
          <AnnouncementFeed />
        </div>

        <div className="space-y-6">
          {/* Quick Access to Class Resources */}
          <div className="rounded-3xl border border-shinme-border bg-shinme-surface p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between border-b border-shinme-line pb-4">
              <h2 className="text-base font-black text-shinme-ink flex items-center gap-2">
                <BookOpen className="size-4 text-shinme-primary" /> Tài liệu mới lớp bạn
              </h2>
              <Link href="/portal/resources" className="text-xs font-bold text-shinme-primary hover:underline">
                Xem tất cả →
              </Link>
            </div>
            <ul className="mt-4 space-y-3">
              <li className="rounded-xl bg-shinme-bg p-3.5 border border-shinme-line">
                <span className="rounded bg-shinme-leaf px-2 py-0.5 text-[0.65rem] font-black text-shinme-primary uppercase">
                  PDF · Soumatome
                </span>
                <p className="mt-1 text-xs font-black text-shinme-ink">
                  120 Mẫu ngữ pháp then chốt N3 (Chặn tải xuống)
                </p>
                <Link
                  href="/portal/resources"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-shinme-primary hover:underline"
                >
                  Mở đọc trực tuyến →
                </Link>
              </li>
              <li className="rounded-xl bg-shinme-bg p-3.5 border border-shinme-line">
                <span className="rounded bg-amber-100 px-2 py-0.5 text-[0.65rem] font-black text-amber-800 uppercase">
                  Audio · Bài 26
                </span>
                <p className="mt-1 text-xs font-black text-shinme-ink">
                  Hội thoại ga tàu & phỏng vấn công sở (MP3)
                </p>
                <Link
                  href="/portal/resources"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-shinme-primary hover:underline"
                >
                  Mở máy nghe Choukai →
                </Link>
              </li>
            </ul>
          </div>

          {/* Pending assignments */}
          <div className="rounded-3xl border border-shinme-border bg-shinme-surface p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between border-b border-shinme-line pb-4">
              <h2 className="text-base font-black text-shinme-ink flex items-center gap-2">
                <FileCheck2 className="size-4 text-shinme-primary" /> Bài tập về nhà ({todo.length})
              </h2>
              <Link href="/portal/assignments" className="text-xs font-bold text-shinme-primary hover:underline">
                Tất cả →
              </Link>
            </div>
            <ul className="mt-3 divide-y divide-shinme-line">
              {todo.slice(0, 2).map((a) => (
                <li key={a.id} className="py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-black text-shinme-ink">{a.title}</p>
                      <p className="mt-0.5 text-[0.7rem] text-shinme-danger font-semibold">
                        Hạn: {a.dueDate}
                      </p>
                    </div>
                    <Button asChild size="sm" className="h-7 text-xs px-2.5">
                      <Link href="/portal/assignments">Làm</Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
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
  const currentClass = MOCK_CLASSES.find((c) => c.id === activeClassId) || MOCK_CLASSES[0];

  return (
    <div className="space-y-6 animate-[rise-in_260ms_var(--ease-out-expo)_both]">
      {/* Header */}
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-shinme-line pb-4">
        <div>
          <h1 className="text-2xl font-black text-shinme-ink sm:text-3xl">
            Kính chào <FuriganaText text={user.nameJa ?? user.name} className="font-jp" /> Sensei!
          </h1>
          <p className="mt-1 text-sm font-semibold text-shinme-muted">
            Quản lý lớp giảng dạy, bảng tin học viên và kho tài liệu số hóa
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm">
            <Link href="/portal/resources">
              <BookOpen /> Tải lên tài liệu
            </Link>
          </Button>
        </div>
      </div>

      {/* Class Selector Switcher */}
      <ClassSelector />

      {/* Class KPI Row */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-bold uppercase tracking-wider text-shinme-muted">Sĩ số lớp hiện tại</p>
          <p className="tabular mt-2 text-3xl font-black text-shinme-primary">{currentClass.studentsCount}</p>
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
          <p className="text-xs font-bold uppercase tracking-wider text-shinme-muted">Bài tập cần chấm</p>
          <p className="tabular mt-2 text-3xl font-black text-shinme-danger">8</p>
          <p className="mt-1 text-xs text-shinme-muted">Bài nộp tuần này</p>
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
  const { role } = useRole();
  const leads = useSyncExternalStore(subscribeLeads, getLeadsSnapshot, getLeadsServerSnapshot);

  return (
    <div className="space-y-6 animate-[rise-in_260ms_var(--ease-out-expo)_both]">
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-shinme-line pb-4">
        <div>
          <h1 className="text-2xl font-black text-shinme-ink sm:text-3xl">Tổng quan Trung tâm Shinme</h1>
          <p className="mt-1 text-sm font-semibold text-shinme-muted">Bảng điều hành Giáo vụ, Tuyển sinh & Lớp học</p>
        </div>
        <Button asChild size="sm">
          <Link href="/portal/leads">
            <Users2 /> Xem danh sách Leads ({leads.length})
          </Link>
        </Button>
      </div>

      {/* Class Selector for Admin */}
      <ClassSelector />

      {/* Center KPIs */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-bold uppercase tracking-wider text-shinme-muted">Tổng học viên đang học</p>
          <p className="tabular mt-2 text-3xl font-black text-shinme-primary">35</p>
          <p className="mt-1 text-xs text-shinme-muted">3 lớp đang vận hành</p>
        </div>
        <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-bold uppercase tracking-wider text-shinme-muted">Sensei hoạt động</p>
          <p className="tabular mt-2 text-3xl font-black text-shinme-primary">4</p>
          <p className="mt-1 text-xs text-shinme-muted">2 bản xứ · 2 Việt Nam</p>
        </div>
        <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-bold uppercase tracking-wider text-shinme-muted">Khách tư vấn mới</p>
          <p className="tabular mt-2 text-3xl font-black text-shinme-accent">{leads.length}</p>
          <p className="mt-1 text-xs text-shinme-muted">Đăng ký từ trang chủ / Test</p>
        </div>
        <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-bold uppercase tracking-wider text-shinme-muted">Tỉ lệ hoàn thành BTVN</p>
          <p className="tabular mt-2 text-3xl font-black text-shinme-ink">91.4%</p>
          <p className="mt-1 text-xs text-shinme-muted">Toàn trung tâm tuần này</p>
        </div>
      </div>

      {/* Student Roster for selected class */}
      <StudentRosterList />

      {/* Announcements */}
      <AnnouncementFeed />
    </div>
  );
}
