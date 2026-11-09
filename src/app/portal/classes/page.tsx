"use client";

import { Calendar, Clock, MapPin, UserCheck, Users } from "lucide-react";
import { FuriganaText } from "@/components/furigana-text";
import { Badge } from "@/components/ui/badge";
import { COURSES } from "@/data/courses";
import { useRole } from "@/lib/role-context";

export default function ClassesPage() {
  const { role, user } = useRole();

  return (
    <div className="space-y-6 animate-[rise-in_260ms_var(--ease-out-expo)_both]">
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-shinme-line pb-5">
        <div>
          <h1 className="text-2xl font-black text-shinme-ink sm:text-3xl">Lớp học & Lịch đào tạo</h1>
          <p className="mt-1 text-sm font-semibold text-shinme-muted">
            {role === "student"
              ? "Thông tin chi tiết lớp học hiện tại và lịch học trong tuần"
              : "Danh sách tất cả các lớp đang mở tại cơ sở và trực tuyến"}
          </p>
        </div>
        <Badge tone="leaf">Học kỳ Mùa Đông 2026</Badge>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {COURSES.map((c) => (
          <div
            key={c.id}
            className="rounded-2xl border border-shinme-border bg-shinme-surface p-6 shadow-[var(--shadow-card)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="rounded bg-shinme-leaf px-2 py-0.5 text-xs font-black text-shinme-primary">
                  {c.level}
                </span>
                <h3 className="mt-1 text-lg font-black text-shinme-ink">{c.name}</h3>
                <FuriganaText text={c.nameJa} className="block text-xs font-bold text-shinme-primary" />
              </div>
              <Badge tone={c.status === "open" ? "leaf" : c.status === "soon" ? "warn" : "neutral"}>
                {c.status === "open" ? "Đang diễn ra" : c.status === "soon" ? "Sắp khai giảng" : "Đã kín"}
              </Badge>
            </div>

            <div className="mt-4 space-y-2 text-sm text-shinme-ink-soft">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-shinme-primary" />
                <span>{c.schedule}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-shinme-primary" />
                <span className="tabular">{c.time} ({c.sessions} buổi)</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="size-4 text-shinme-primary" />
                <span>Hình thức: {c.format} (Phòng 204 hoặc Zoom)</span>
              </div>
              <div className="flex items-center gap-2">
                <UserCheck className="size-4 text-shinme-primary" />
                <span>Sensei: <FuriganaText text={c.sensei} lang="vi" /></span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

