"use client";

import { useState, useSyncExternalStore } from "react";
import { Award, CheckCircle2, Mail, Phone, Search, TrendingUp, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  getActiveClassId,
  MOCK_CLASSES,
  MOCK_ROSTERS,
  subscribeActiveClass,
  type StudentRoster,
} from "@/lib/classroom-store";
import { useRole } from "@/lib/role-context";
import { cn } from "@/lib/utils";

export function StudentRosterList() {
  const { role } = useRole();
  const activeClassId = useSyncExternalStore(
    subscribeActiveClass,
    () => getActiveClassId(role),
    () => "cls-n3-246"
  );

  const [search, setSearch] = useState("");

  const currentClass = MOCK_CLASSES.find((c) => c.id === activeClassId) || MOCK_CLASSES[0];
  const roster: StudentRoster[] = MOCK_ROSTERS[currentClass.id] || MOCK_ROSTERS["cls-n3-246"];

  const filtered = roster.filter(
    (std) =>
      std.fullName.toLowerCase().includes(search.toLowerCase()) ||
      std.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4 rounded-3xl border border-shinme-border bg-shinme-surface p-6 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-shinme-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-xl bg-shinme-leaf text-shinme-primary">
              <Users className="size-4" />
            </span>
            <h2 className="text-lg font-black text-shinme-ink">
              Danh sách học viên: {currentClass.shortName}
            </h2>
            <Badge tone="leaf">{roster.length} Học viên</Badge>
          </div>
          <p className="mt-1 text-xs text-shinme-muted">
            Theo dõi tiến độ làm BTVN, điểm thi thử và tỷ lệ chuyên cần từng học viên
          </p>
        </div>

        <div className="relative min-w-[200px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-shinme-muted" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc mã HV..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-full border border-shinme-border bg-shinme-bg pl-9 pr-3 text-xs font-semibold text-shinme-ink placeholder:text-shinme-muted focus:border-shinme-primary focus:outline-none"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[36rem] text-left text-sm">
          <thead className="border-b border-shinme-line text-xs font-extrabold uppercase text-shinme-muted">
            <tr>
              <th className="py-2.5 px-3">Mã HV</th>
              <th className="py-2.5 px-3">Học viên</th>
              <th className="py-2.5 px-3">Tiến độ bài tập</th>
              <th className="py-2.5 px-3 text-center">Điểm TB</th>
              <th className="py-2.5 px-3 text-center">Chuyên cần</th>
              <th className="py-2.5 px-3 text-right">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-shinme-line">
            {filtered.map((std) => (
              <tr key={std.id} className="hover:bg-shinme-leaf-faint/50 transition-colors">
                <td className="py-3 px-3 font-mono text-xs font-black text-shinme-primary">
                  {std.code}
                </td>
                <td className="py-3 px-3">
                  <p className="font-black text-shinme-ink">{std.fullName}</p>
                  <p className="text-xs text-shinme-muted">{std.email}</p>
                </td>
                <td className="py-3 px-3">
                  <div className="w-36">
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span className="text-shinme-muted">
                        {std.completedAssignments}/{std.totalAssignments} bài
                      </span>
                      <span className="text-shinme-primary tabular">{std.progressPercent}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-shinme-bg overflow-hidden">
                      <div
                        className="h-full rounded-full bg-shinme-accent"
                        style={{ width: `${std.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3 text-center">
                  <span className="inline-flex items-center gap-1 font-mono text-sm font-black text-shinme-ink tabular">
                    <Award className="size-3.5 text-shinme-warn" /> {std.averageScore}
                  </span>
                </td>
                <td className="py-3 px-3 text-center">
                  <span
                    className={cn(
                      "font-mono text-xs font-bold tabular",
                      std.attendancePercent >= 95 ? "text-shinme-primary" : "text-shinme-danger"
                    )}
                  >
                    {std.attendancePercent}%
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  <Badge
                    tone={
                      std.status === "Đang học"
                        ? "leaf"
                        : std.status === "Cảnh báo"
                        ? "danger"
                        : "neutral"
                    }
                  >
                    {std.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

