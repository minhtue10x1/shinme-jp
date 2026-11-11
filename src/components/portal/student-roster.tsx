"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Users, Search, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  getActiveClassId,
  subscribeActiveClass,
} from "@/lib/classroom-store";
import { useRole } from "@/lib/role-context";
import { getAllUsers, getAllSubmissions, getClasses } from "@/lib/db/services";
import type { UserProfileDoc, TestSubmissionDoc, ClassDoc } from "@/lib/db/schema";

export function StudentRosterList() {
  const { role } = useRole();
  const activeClassId = useSyncExternalStore(
    subscribeActiveClass,
    () => getActiveClassId(role),
    () => "cls-n3-246"
  );

  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [users, setUsers] = useState<UserProfileDoc[]>([]);
  const [submissions, setSubmissions] = useState<TestSubmissionDoc[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([getClasses(), getAllUsers(), getAllSubmissions()])
      .then(([cList, uList, sList]) => {
        setClasses(cList);
        setUsers(uList);
        setSubmissions(sList);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const currentClass =
    classes.find((c) => c.id === activeClassId) || classes[0] || {
      id: "cls-n3-246",
      shortName: "Lớp học",
    };

  // Filter students belonging to active class
  const classStudents = users.filter(
    (u) =>
      u.role === "student" &&
      (u.classId === activeClassId || (!u.classId && activeClassId === "cls-n3-246"))
  );

  // Search filter
  const filtered = classStudents.filter((std) => {
    const q = search.toLowerCase();
    return (
      std.fullName.toLowerCase().includes(q) ||
      std.code.toLowerCase().includes(q) ||
      std.email.toLowerCase().includes(q)
    );
  });

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
            <Badge tone="leaf">{classStudents.length} Học viên</Badge>
          </div>
          <p className="mt-1 text-xs text-shinme-muted">
            Theo dõi tiến độ làm bài thi thử, điểm số và mục tiêu JLPT của từng học viên
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

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-shinme-bg animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-8 text-center text-xs text-shinme-muted">
          {classStudents.length === 0
            ? "Chưa có học viên nào được gán vào lớp học này."
            : "Không tìm thấy học viên phù hợp."}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="border-b border-shinme-line text-xs font-extrabold uppercase text-shinme-muted">
              <tr>
                <th className="py-2.5 px-3">Mã HV</th>
                <th className="py-2.5 px-3">Học viên</th>
                <th className="py-2.5 px-3 text-center">Mục tiêu JLPT</th>
                <th className="py-2.5 px-3 text-center">Đã làm (Bài thi)</th>
                <th className="py-2.5 px-3 text-center">Điểm TB</th>
                <th className="py-2.5 px-3 text-right">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-shinme-line text-xs">
              {filtered.map((std) => {
                const stdSubs = submissions.filter(
                  (s) =>
                    s.studentId === std.uid ||
                    s.studentCode === std.code ||
                    s.studentName.toLowerCase() === std.fullName.toLowerCase()
                );
                const avgScore =
                  stdSubs.length > 0
                    ? Math.round(
                        stdSubs.reduce((sum, s) => sum + s.score, 0) / stdSubs.length
                      )
                    : null;

                return (
                  <tr key={std.uid} className="hover:bg-shinme-leaf-faint/50 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-shinme-primary">
                      {std.code}
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-shinme-ink">{std.fullName}</p>
                      <p className="text-shinme-muted">{std.email}</p>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="rounded bg-shinme-bg px-2 py-0.5 font-mono font-extrabold text-shinme-primary">
                        {std.targetJLPT || "N3"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center font-mono font-bold text-shinme-ink">
                      {stdSubs.length} bài
                    </td>
                    <td className="py-3 px-3 text-center">
                      {avgScore !== null ? (
                        <span className="font-mono font-bold text-shinme-primary">
                          {avgScore}đ
                        </span>
                      ) : (
                        <span className="text-slate-400">Chưa thi</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Badge tone={stdSubs.length > 0 ? "leaf" : "neutral"}>
                        {stdSubs.length > 0 ? "Đang theo học" : "Mới nhập học"}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
