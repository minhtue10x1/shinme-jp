"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  FilePlus2,
  FolderCog,
  GraduationCap,
  Headphones,
  Layers,
  Shuffle,
  Sparkles,
  Star,
} from "lucide-react";
import { FuriganaText } from "@/components/furigana-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClassSelector } from "@/components/portal/class-selector";
import { getActiveClassId, subscribeActiveClass } from "@/lib/classroom-store";
import {
  getAttemptsServerSnapshot,
  getTestsServerSnapshot,
  readAttempts,
  readTests,
  subscribeAttempts,
  subscribeTests,
  type JLPTTest,
} from "@/lib/test-center-store";
import { useRole } from "@/lib/role-context";

export default function TestsHubPage() {
  const { role, user } = useRole();
  const activeClassId = useSyncExternalStore(
    subscribeActiveClass,
    () => getActiveClassId(role),
    () => "cls-n3-246"
  );
  const tests = useSyncExternalStore(subscribeTests, readTests, getTestsServerSnapshot);
  const attempts = useSyncExternalStore(subscribeAttempts, readAttempts, getAttemptsServerSnapshot);

  const relevantClassId = role === "student" ? "cls-n3-246" : activeClassId;
  const filteredTests = tests.filter(
    (t) => t.classId === relevantClassId || t.classId === "ALL"
  );

  const countByType = (test: JLPTTest, type: string) =>
    test.questions.filter((q) => q.type === type).length;

  return (
    <div className="space-y-6 animate-[rise-in_260ms_var(--ease-out-expo)_both]">
      {/* Header */}
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-shinme-line pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-shinme-ink sm:text-3xl">
              Trung tâm Khảo thí & Đề thi JLPT
            </h1>
            <Badge tone="leaf">Phase 3 Exam Engine</Badge>
          </div>
          <p className="mt-1 text-sm font-semibold text-shinme-muted">
            {role === "student"
              ? "Phòng thi trực tuyến chuẩn cấu trúc JLPT (Goi · Bunpou · Dấu sao ★ · Dokkai · Choukai)"
              : "Thiết kế đề thi có Furigana trực tiếp, quản lý ngân hàng Mondai và phân tích kết quả lớp học"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {role !== "student" && (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href="/portal/tests/manage">
                  <FolderCog /> Quản lý đề thi ({tests.length})
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/portal/tests/create">
                  <FilePlus2 /> Tạo đề thi JLPT mới
                </Link>
              </Button>
            </>
          )}
          <Button asChild variant="outline" size="sm">
            <Link href="/portal/gradebook">
              <BarChart3 /> {role === "student" ? "Bảng điểm lớp" : "Sổ điểm & Phân tích câu sai"}
            </Link>
          </Button>
        </div>
      </div>

      {/* Role-Scoped Class Selector */}
      <ClassSelector />

      {/* Mondai Format Highlights Banner */}
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 text-xs font-black text-shinme-primary">
            <Layers className="size-4" /> Trắc nghiệm Goi / Bunpou
          </div>
          <p className="mt-1 text-xs text-shinme-muted">
            Câu hỏi chuẩn 4 đáp án A, B, C, D hỗ trợ gõ và hiển thị Furigana trực tiếp.
          </p>
        </div>
        <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 text-xs font-black text-shinme-primary">
            <Star className="size-4 fill-shinme-accent text-shinme-primary" /> Bài tập dấu sao ★
          </div>
          <p className="mt-1 text-xs text-shinme-muted">
            Sắp xếp 4 mảnh ghép vào 4 ô trống `___ ___ ★ ___` và chọn từ đứng ở vị trí ★.
          </p>
        </div>
        <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 text-xs font-black text-shinme-primary">
            <BookOpen className="size-4" /> Đọc hiểu Dokkai
          </div>
          <p className="mt-1 text-xs text-shinme-muted">
            Giao diện chia đôi: bài đọc tiếng Nhật dài bên trái, nhóm câu hỏi con bên phải.
          </p>
        </div>
        <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 text-xs font-black text-shinme-primary">
            <Headphones className="size-4" /> Nghe hiểu Choukai
          </div>
          <p className="mt-1 text-xs text-shinme-muted">
            Trình phát MP3 giới hạn số lượt nghe (1 lần / 2 lần / Không giới hạn) sát kỳ thi thật.
          </p>
        </div>
      </div>

      {/* Test Cards List */}
      <div className="space-y-4">
        {filteredTests.map((test) => {
          const myAttempts = attempts.filter(
            (a) => a.testId === test.id && a.studentCode === user.code
          );
          const allTestAttempts = attempts.filter((a) => a.testId === test.id);
          const bestAttempt =
            myAttempts.length > 0
              ? myAttempts.reduce((best, curr) => (curr.score > best.score ? curr : best))
              : null;

          const stdCount = countByType(test, "standard");
          const starCount = countByType(test, "star");
          const dokkaiCount = countByType(test, "dokkai");
          const choukaiCount = countByType(test, "choukai");

          return (
            <div
              key={test.id}
              className="rounded-3xl border border-shinme-border bg-shinme-surface p-6 shadow-[var(--shadow-card)] transition-all hover:border-shinme-accent/60 hover:shadow-[var(--shadow-lift)]"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-shinme-primary px-2.5 py-0.5 font-mono text-xs font-black text-white">
                      {test.code}
                    </span>
                    <Badge tone="leaf">JLPT {test.level}</Badge>
                    <Badge tone="neutral">{test.className}</Badge>
                    {test.shuffleQuestions && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-shinme-leaf-faint px-2.5 py-0.5 text-xs font-bold text-shinme-primary border border-shinme-accent/40">
                        <Shuffle className="size-3" /> Trộn câu ngẫu nhiên
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl font-black text-shinme-ink">{test.title}</h2>
                  <FuriganaText
                    text={test.titleJa}
                    className="block text-sm font-bold text-shinme-primary"
                  />

                  {/* Question Type Pills */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {stdCount > 0 && (
                      <span className="rounded-full bg-shinme-bg px-3 py-1 text-xs font-bold text-shinme-ink-soft border border-shinme-line">
                        Goi / Bunpou: <strong>{stdCount} câu</strong>
                      </span>
                    )}
                    {starCount > 0 && (
                      <span className="rounded-full bg-shinme-bg px-3 py-1 text-xs font-bold text-shinme-ink-soft border border-shinme-line">
                        Dấu sao ★: <strong>{starCount} câu</strong>
                      </span>
                    )}
                    {dokkaiCount > 0 && (
                      <span className="rounded-full bg-shinme-bg px-3 py-1 text-xs font-bold text-shinme-ink-soft border border-shinme-line">
                        Đọc hiểu Dokkai: <strong>{dokkaiCount} câu</strong>
                      </span>
                    )}
                    {choukaiCount > 0 && (
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900 border border-amber-200">
                        Nghe Choukai: <strong>{choukaiCount} câu</strong>
                      </span>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 pt-2 text-xs font-semibold text-shinme-muted">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3.5 text-shinme-primary" /> Thời gian:{" "}
                      <strong className="tabular text-shinme-ink">{test.durationMinutes} phút</strong>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Award className="size-3.5 text-shinme-primary" /> Điểm đạt:{" "}
                      <strong className="tabular text-shinme-ink">
                        {test.passScore}/{test.totalPoints} điểm
                      </strong>
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="size-3.5 text-shinme-danger" /> Hạn chót:{" "}
                      <strong className="tabular text-shinme-danger">
                        {new Date(test.deadline).toLocaleString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </strong>
                    </span>
                    <span>
                      Số lượt làm:{" "}
                      <strong className="text-shinme-ink">
                        {test.maxAttempts === 0 ? "Không giới hạn" : `Tối đa ${test.maxAttempts} lần`}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Right Column Action */}
                <div className="flex flex-col items-end gap-3 min-w-[200px]">
                  {role === "student" ? (
                    <>
                      {bestAttempt ? (
                        <div className="rounded-2xl bg-shinme-leaf-faint px-4 py-2.5 text-right border border-shinme-accent/40">
                          <span className="inline-flex items-center gap-1 text-xs font-black text-shinme-primary">
                            <CheckCircle2 className="size-3.5" /> Đã làm ({myAttempts.length} lượt)
                          </span>
                          <p className="tabular text-lg font-black text-shinme-ink">
                            Điểm cao nhất: {bestAttempt.score}/{bestAttempt.totalPoints}
                          </p>
                        </div>
                      ) : (
                        <Badge tone="warn">Chưa làm bài</Badge>
                      )}

                      <Button asChild size="md">
                        <Link href={`/portal/tests/${test.id}/take`}>
                          {bestAttempt ? "Làm lại đề thi" : "Vào phòng thi ngay"}
                          <ArrowRight />
                        </Link>
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="rounded-2xl bg-shinme-bg px-4 py-2.5 text-right border border-shinme-line">
                        <span className="text-xs font-bold text-shinme-muted">Lượt nộp của lớp</span>
                        <p className="tabular text-lg font-black text-shinme-primary">
                          {allTestAttempts.length} bài nộp
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/portal/tests/${test.id}/take`}>Thi thử (Preview)</Link>
                        </Button>
                        <Button asChild size="sm">
                          <Link href={`/portal/gradebook?testId=${test.id}`}>
                            <BarChart3 /> Phân tích điểm
                          </Link>
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

