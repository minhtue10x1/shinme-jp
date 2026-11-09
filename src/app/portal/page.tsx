"use client";

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
  Sparkles,
  TrendingUp,
  UserCheck,
  Users2,
} from "lucide-react";
import { FuriganaText } from "@/components/furigana-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MOCK_ASSIGNMENTS, MOCK_MATERIALS } from "@/data/portal-data";
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

  return (
    <div className="space-y-8 animate-[rise-in_260ms_var(--ease-out-expo)_both]">
      {/* Header */}
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-shinme-line pb-5">
        <div>
          <h1 className="text-2xl font-black text-shinme-ink sm:text-3xl">
            Konnichiwa, {user.name} <span className="font-jp text-shinme-primary">さん！</span>
          </h1>
          <p className="mt-1 text-sm font-semibold text-shinme-muted">
            Mã HV: <strong className="tabular text-shinme-ink">{user.code}</strong> · {user.className}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="leaf">Mục tiêu: JLPT N4 Tháng 7</Badge>
        </div>
      </div>

      {/* Progress banner */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-shinme-muted">Tiến độ bài học</span>
            <TrendingUp className="size-4 text-shinme-primary" />
          </div>
          <p className="tabular mt-3 text-3xl font-black text-shinme-primary">24/36</p>
          <p className="mt-1 text-xs font-semibold text-shinme-muted">buổi · 67% lộ trình N4</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-shinme-bg-deep">
            <div className="h-full w-2/3 rounded-full bg-shinme-accent" />
          </div>
        </div>

        <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-shinme-muted">Chuyên cần</span>
            <CheckCircle2 className="size-4 text-shinme-primary" />
          </div>
          <p className="tabular mt-3 text-3xl font-black text-shinme-primary">100%</p>
          <p className="mt-1 text-xs font-semibold text-shinme-muted">24/24 buổi có mặt đầy đủ</p>
          <p className="mt-3 text-xs font-bold text-shinme-accent">Giữ vững phong độ! ♡</p>
        </div>

        <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-5 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-shinme-muted">Điểm trung bình</span>
            <Award className="size-4 text-shinme-warn" />
          </div>
          <p className="tabular mt-3 text-3xl font-black text-shinme-ink">9.0/10</p>
          <p className="mt-1 text-xs font-semibold text-shinme-muted">Xếp hạng: Top 2 lớp N4-K12</p>
          <p className="mt-3 text-xs font-semibold text-shinme-muted">Đã nộp 6/6 bài kiểm tra</p>
        </div>
      </div>

      {/* Up next alert */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-shinme-primary p-5 text-white">
        <div className="flex items-center gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/10 text-shinme-accent">
            <Calendar className="size-6" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-shinme-accent">Buổi học kế tiếp</p>
            <p className="text-lg font-black">Bài 25: Thể điều kiện ～たら・～ても</p>
            <p className="text-xs text-white/70">Thứ Tư, 12/11 · 19:00 – 21:00 · Phòng 204 & Zoom · Tanaka Sensei</p>
          </div>
        </div>
        <Button asChild variant="onDark" size="sm">
          <Link href="/portal/materials">Vào xem slide bài 25</Link>
        </Button>
      </div>

      {/* Two columns: Pending assignments & Recent feedback */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-shinme-ink">Bài tập cần nộp ({todo.length})</h2>
            <Link href="/portal/assignments" className="text-xs font-bold text-shinme-primary hover:underline">
              Xem tất cả →
            </Link>
          </div>

          <ul className="mt-4 divide-y divide-shinme-line">
            {todo.map((a) => (
              <li key={a.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="rounded bg-shinme-leaf px-2 py-0.5 text-xs font-bold text-shinme-primary">
                      {a.type}
                    </span>
                    <p className="mt-1 font-bold text-shinme-ink">{a.title}</p>
                    {a.titleJa && <FuriganaText text={a.titleJa} className="block text-xs text-shinme-primary" />}
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-shinme-muted">
                      <Clock className="size-3.5" /> Hạn nộp: <strong className="tabular text-shinme-danger">{a.dueDate}</strong>
                    </p>
                  </div>
                  <Button asChild size="sm">
                    <Link href="/portal/assignments">Làm bài</Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-6 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-shinme-ink">Nhận xét từ Sensei ({graded.length})</h2>
            <span className="text-xs font-semibold text-shinme-muted">Bài vừa chấm</span>
          </div>

          <ul className="mt-4 space-y-4">
            {graded.map((a) => (
              <li key={a.id} className="rounded-xl bg-shinme-leaf-faint p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-extrabold text-shinme-ink">{a.title}</p>
                  <span className="tabular text-base font-black text-shinme-primary">
                    {a.score}/{a.maxScore} điểm
                  </span>
                </div>
                {a.feedback && (
                  <p className="mt-2 text-xs leading-relaxed text-shinme-ink-soft">
                    <strong className="text-shinme-primary">Tanaka Sensei:</strong> “{a.feedback}”
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

/* =====================================================================
 * 2. SENSEI VIEW
 * ===================================================================== */
function SenseiDashboard() {
  const { user } = useRole();

  return (
    <div className="space-y-8 animate-[rise-in_260ms_var(--ease-out-expo)_both]">
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-shinme-line pb-5">
        <div>
          <h1 className="text-2xl font-black text-shinme-ink sm:text-3xl">
            Kính chào <FuriganaText text={user.nameJa ?? user.name} className="font-jp" /> Sensei!
          </h1>
          <p className="mt-1 text-sm font-semibold text-shinme-muted">
            Mã GV: <strong className="tabular text-shinme-ink">{user.code}</strong> · {user.className}
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/portal/assignments">
            <Sparkles /> Tạo bài tập mới
          </Link>
        </Button>
      </div>

      {/* KPI Sensei */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-bold uppercase tracking-wider text-shinme-muted">Lớp phụ trách</p>
          <p className="tabular mt-2 text-3xl font-black text-shinme-primary">2</p>
          <p className="mt-1 text-xs text-shinme-muted">N4-K12 & Kaiwa-K15</p>
        </div>
        <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-bold uppercase tracking-wider text-shinme-muted">Tổng học viên</p>
          <p className="tabular mt-2 text-3xl font-black text-shinme-primary">20</p>
          <p className="mt-1 text-xs text-shinme-muted">12 sơ cấp · 8 Kaiwa</p>
        </div>
        <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-bold uppercase tracking-wider text-shinme-muted">Bài cần chấm</p>
          <p className="tabular mt-2 text-3xl font-black text-shinme-danger">8</p>
          <p className="mt-1 text-xs text-shinme-muted">BTVN-24 vừa nộp tối qua</p>
        </div>
        <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-bold uppercase tracking-wider text-shinme-muted">Giờ dạy tuần này</p>
          <p className="tabular mt-2 text-3xl font-black text-shinme-ink">8h</p>
          <p className="mt-1 text-xs text-shinme-muted">4 buổi (3 offline, 1 online)</p>
        </div>
      </div>

      {/* Teaching schedule */}
      <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-6 shadow-[var(--shadow-card)]">
        <h2 className="text-lg font-black text-shinme-ink">Lịch giảng dạy tuần này</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead className="border-b border-shinme-line text-xs font-extrabold uppercase text-shinme-muted">
              <tr>
                <th className="py-2.5">Thời gian</th>
                <th className="py-2.5">Lớp</th>
                <th className="py-2.5">Nội dung bài</th>
                <th className="py-2.5">Phòng</th>
                <th className="py-2.5 text-right">Sĩ số</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-shinme-line">
              <tr>
                <td className="tabular py-3 font-bold text-shinme-primary">T4 · 12/11 · 19:00</td>
                <td className="font-extrabold">N4-K12</td>
                <td>Bài 25: Thể điều kiện ～たら</td>
                <td>Phòng 204</td>
                <td className="tabular text-right font-bold">12/12</td>
              </tr>
              <tr>
                <td className="tabular py-3 font-bold text-shinme-primary">T6 · 14/11 · 19:00</td>
                <td className="font-extrabold">N4-K12</td>
                <td>Luyện Mondai 3–4 & Chữa BTVN-24</td>
                <td>Phòng 204</td>
                <td className="tabular text-right font-bold">12/12</td>
              </tr>
              <tr>
                <td className="tabular py-3 font-bold text-shinme-primary">T7 · 15/11 · 14:00</td>
                <td className="font-extrabold">Kaiwa-K15</td>
                <td>Roleplay: Nhập vai lễ tân khách sạn & ga tàu</td>
                <td>Phòng Tatami 101</td>
                <td className="tabular text-right font-bold">8/8</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* =====================================================================
 * 3. ADMIN VIEW
 * ===================================================================== */
function AdminDashboard() {
  const leads = useSyncExternalStore(subscribeLeads, getLeadsSnapshot, getLeadsServerSnapshot);

  return (
    <div className="space-y-8 animate-[rise-in_260ms_var(--ease-out-expo)_both]">
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-shinme-line pb-5">
        <div>
          <h1 className="text-2xl font-black text-shinme-ink sm:text-3xl">Tổng quan Trung tâm Shinme</h1>
          <p className="mt-1 text-sm font-semibold text-shinme-muted">Bảng điều hành Giáo vụ & Tuyển sinh</p>
        </div>
        <Button asChild size="sm">
          <Link href="/portal/leads">
            <Users2 /> Xem danh sách Leads ({leads.length})
          </Link>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-5 shadow-[var(--shadow-card)]">
          <p className="text-xs font-bold uppercase tracking-wider text-shinme-muted">Học viên đang học</p>
          <p className="tabular mt-2 text-3xl font-black text-shinme-primary">68</p>
          <p className="mt-1 text-xs text-shinme-muted">6 lớp đang vận hành</p>
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

      {/* Leads list preview */}
      <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-shinme-ink">Khách đăng ký tư vấn gần nhất</h2>
          <Link href="/portal/leads" className="text-xs font-bold text-shinme-primary hover:underline">
            Quản lý tất cả leads →
          </Link>
        </div>

        {leads.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-shinme-border p-8 text-center">
            <p className="font-bold text-shinme-ink">Chưa có khách đăng ký mới trong phiên này.</p>
            <p className="mt-1 text-sm text-shinme-muted">
              Hãy quay lại trang chủ và gửi thử 1 đơn tư vấn hoặc làm bài thi thử mini để thấy lead xuất hiện ở đây.
            </p>
            <Button asChild size="sm" variant="outline" className="mt-4">
              <Link href="/#tu-van">Đến Form tư vấn trang chủ</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[38rem] text-left text-sm">
              <thead className="border-b border-shinme-line text-xs font-extrabold uppercase text-shinme-muted">
                <tr>
                  <th className="py-2.5">Họ tên</th>
                  <th className="py-2.5">SĐT / Zalo</th>
                  <th className="py-2.5">Trình độ</th>
                  <th className="py-2.5">Mục tiêu</th>
                  <th className="py-2.5">Nguồn</th>
                  <th className="py-2.5 text-right">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-shinme-line">
                {leads.slice(0, 5).map((l) => (
                  <tr key={l.id}>
                    <td className="py-3 font-extrabold text-shinme-ink">{l.fullName}</td>
                    <td className="tabular text-shinme-primary font-bold">{l.phone}</td>
                    <td>
                      <Badge tone="neutral">{l.level}</Badge>
                    </td>
                    <td className="max-w-[14rem] truncate text-shinme-ink-soft">{l.goal}</td>
                    <td>
                      <Badge tone={l.source === "Thi thử Mini" ? "leaf" : "neutral"}>
                        {l.source}
                        {l.testScore !== undefined && ` (${l.testScore}/5đ)`}
                      </Badge>
                    </td>
                    <td className="tabular text-right text-xs text-shinme-muted">
                      {new Date(l.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

