"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Clock, FileCheck2, Filter, MessageSquare, Plus, Save, Search, Sparkles, UserCheck } from "lucide-react";
import { FuriganaText } from "@/components/furigana-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { MOCK_ASSIGNMENTS, type Assignment } from "@/data/portal-data";
import { useRole } from "@/lib/role-context";

const QUICK_FEEDBACKS = [
  "Phát âm và ngữ điệu rất tự nhiên!",
  "Chú ý thêm cách dùng trợ từ に và で.",
  "Phần chia thể bị động (受身形) cần ôn tập thêm một chút.",
  "Chữ Kanji viết đúng thứ tự nét và rất đẹp!",
  "Làm bài rất tốt, giữ vững phong độ nhé! ♡",
];

export default function AssignmentsPage() {
  const { role } = useRole();
  const [assignments, setAssignments] = useState<Assignment[]>(MOCK_ASSIGNMENTS);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [gradingItem, setGradingItem] = useState<Assignment | null>(null);
  const [scoreInput, setScoreInput] = useState<number>(10);
  const [feedbackInput, setFeedbackInput] = useState<string>("");

  const filtered = assignments.filter((a) => {
    if (filterType !== "ALL" && a.type !== filterType) return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !a.code.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openGradingModal = (item: Assignment) => {
    setGradingItem(item);
    setScoreInput(item.score ?? (item.maxScore ? Math.floor(item.maxScore * 0.9) : 10));
    setFeedbackInput(item.feedback ?? "Em hoàn thành bài rất tốt! Cần chú ý thêm một số cấu trúc câu phức tạp hơn.");
  };

  const handleSaveGrading = () => {
    if (!gradingItem) return;
    setAssignments((prev) =>
      prev.map((a) =>
        a.id === gradingItem.id
          ? {
              ...a,
              studentStatus: "graded",
              score: scoreInput,
              maxScore: a.maxScore ?? (scoreInput > 10 ? 20 : 10),
              feedback: feedbackInput,
            }
          : a
      )
    );
    toast.success(`Đã lưu điểm cho học viên Lê Hoàng Nam (HV-202601)!`, {
      description: `Điểm: ${scoreInput}đ · Nhận xét đã được gửi vào tài khoản học viên.`,
    });
    setGradingItem(null);
  };

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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openGradingModal(item)}
                        className="mt-2"
                      >
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

      {/* Sensei Grading Dialog */}
      {gradingItem && (
        <Dialog open={true} onOpenChange={(open) => !open && setGradingItem(null)}>
          <DialogContent className="max-w-xl">
            <div className="p-6 sm:p-8 space-y-5">
              <div>
                <DialogTitle className="text-xl font-black text-shinme-ink flex items-center gap-2">
                  <UserCheck className="size-5 text-shinme-primary" /> Chấm bài & Nhận xét
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs text-shinme-muted">
                  Học viên: <strong className="text-shinme-ink font-bold">Lê Hoàng Nam (HV-202601)</strong> · Lớp {gradingItem.className}
                </DialogDescription>
              </div>

              <div className="rounded-xl bg-shinme-bg p-4 border border-shinme-line space-y-1">
                <span className="font-mono text-xs font-black text-shinme-primary">{gradingItem.code}</span>
                <p className="text-sm font-black text-shinme-ink">{gradingItem.title}</p>
                {gradingItem.titleJa && <FuriganaText text={gradingItem.titleJa} className="block text-xs text-shinme-primary" />}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-shinme-ink">
                  Điểm số đạt được:
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    max={gradingItem.maxScore ?? 20}
                    value={scoreInput}
                    onChange={(e) => setScoreInput(Number(e.target.value))}
                    className="h-11 w-24 rounded-xl border-2 border-shinme-border px-3 text-center text-lg font-black text-shinme-primary focus:border-shinme-primary focus:outline-none tabular"
                  />
                  <span className="text-sm font-bold text-shinme-muted">
                    / {gradingItem.maxScore ?? (scoreInput > 10 ? 20 : 10)} điểm
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-shinme-ink">
                  Mẫu nhận xét nhanh của Sensei:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_FEEDBACKS.map((fb) => (
                    <button
                      key={fb}
                      type="button"
                      onClick={() => setFeedbackInput(fb)}
                      className="rounded-full bg-shinme-bg border border-shinme-border px-3 py-1 text-xs text-shinme-ink-soft hover:bg-shinme-leaf hover:text-shinme-primary transition-colors text-left"
                    >
                      + {fb}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-shinme-ink">
                  Nội dung nhận xét chi tiết:
                </label>
                <textarea
                  rows={4}
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="Nhập lời khen hoặc dặn dò cho học viên..."
                  className="w-full rounded-xl border-2 border-shinme-border p-3 text-sm text-shinme-ink focus:border-shinme-primary focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-shinme-line">
                <Button variant="ghost" size="sm" onClick={() => setGradingItem(null)}>
                  Hủy
                </Button>
                <Button size="sm" onClick={handleSaveGrading}>
                  <Save /> Lưu kết quả chấm
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

