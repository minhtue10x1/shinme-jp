"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Clock, FileCheck2, Filter, Plus, Search } from "lucide-react";
import { FuriganaText } from "@/components/furigana-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MOCK_ASSIGNMENTS, type Assignment } from "@/data/portal-data";
import { useRole } from "@/lib/role-context";

export default function AssignmentsPage() {
  const { role } = useRole();
  const [filterType, setFilterType] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  const filtered = MOCK_ASSIGNMENTS.filter((a) => {
    if (filterType !== "ALL" && a.type !== filterType) return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !a.code.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-[rise-in_260ms_var(--ease-out-expo)_both]">
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-shinme-line pb-5">
        <div>
          <h1 className="text-2xl font-black text-shinme-ink sm:text-3xl">Bài tập & Mondai</h1>
          <p className="mt-1 text-sm font-semibold text-shinme-muted">
            {role === "student"
              ? "Danh sách bài tập về nhà, Mini Test và Mondai luyện thi N4"
              : "Quản lý đề kiểm tra, chấm bài và giao bài tập theo lớp"}
          </p>
        </div>
        {role !== "student" && (
          <Button size="sm">
            <Plus /> Tạo đề bài mới
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {["ALL", "Kanji", "Ngữ pháp", "Đọc hiểu", "Kaiwa"].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                filterType === t
                  ? "bg-shinme-primary text-white"
                  : "bg-shinme-surface text-shinme-ink-soft border border-shinme-border hover:bg-shinme-leaf"
              }`}
            >
              {t === "ALL" ? "Tất cả dạng bài" : t}
            </button>
          ))}
        </div>
        <div className="relative min-w-[220px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-shinme-muted" />
          <input
            type="text"
            placeholder="Tìm theo mã hoặc tên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-full border border-shinme-border bg-shinme-surface pl-9 pr-4 text-xs font-medium text-shinme-ink placeholder:text-shinme-muted focus:border-shinme-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Assignment List */}
      <div className="grid gap-4">
        {filtered.map((item) => {
          const isGraded = item.studentStatus === "graded";
          return (
            <div
              key={item.id}
              className="rounded-2xl border border-shinme-border bg-shinme-surface p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-lift)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-shinme-primary bg-shinme-leaf px-2 py-0.5 rounded">
                      {item.code}
                    </span>
                    <Badge tone="neutral">{item.level}</Badge>
                    <Badge tone="leaf">{item.type}</Badge>
                  </div>
                  <h3 className="text-lg font-black text-shinme-ink">{item.title}</h3>
                  {item.titleJa && (
                    <FuriganaText text={item.titleJa} className="block text-sm font-bold text-shinme-primary" />
                  )}
                  <p className="flex items-center gap-2 text-xs text-shinme-muted pt-1">
                    <Clock className="size-3.5" /> Hạn nộp: <strong className="tabular text-shinme-danger">{item.dueDate}</strong>
                    <span>· Lớp: {item.className}</span>
                    <span>· Số câu: {item.questionsCount}</span>
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {role === "student" ? (
                    isGraded ? (
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1 rounded-full bg-shinme-leaf px-3 py-1 text-xs font-extrabold text-shinme-primary">
                          <CheckCircle2 className="size-3.5" /> Đã chấm điểm
                        </span>
                        <p className="mt-1 text-lg font-black text-shinme-ink">
                          {item.score} / {item.maxScore} điểm
                        </p>
                      </div>
                    ) : (
                      <Button asChild size="sm">
                        <Link href="/portal/exam/jlpt-n4-mock-01">Làm bài ngay</Link>
                      </Button>
                    )
                  ) : (
                    <div className="text-right">
                      <p className="text-xs font-bold text-shinme-muted">Đã nộp</p>
                      <p className="text-base font-black text-shinme-primary">
                        {item.submittedCount} / {item.totalStudents} học viên
                      </p>
                      <Button variant="outline" size="sm" className="mt-2">
                        Chấm bài & Nhận xét
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {role === "student" && item.feedback && (
                <div className="mt-4 rounded-xl bg-shinme-leaf-faint p-3.5 text-xs leading-relaxed text-shinme-ink-soft border border-shinme-accent-soft/40">
                  <strong className="text-shinme-primary">Lời nhận xét từ Sensei: </strong>
                  {item.feedback}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

