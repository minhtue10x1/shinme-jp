"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
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
  Search,
} from "lucide-react";
import { FuriganaText } from "@/components/furigana-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRole } from "@/lib/role-context";
import { getAllTests, getAllSubmissions, getClasses } from "@/lib/db/services";
import type { JLPTTestDoc, TestSubmissionDoc, ClassDoc } from "@/lib/db/schema";
import { toast } from "sonner";

export default function TestsHubPage() {
  const { role, user, firebaseUser } = useRole();

  const [tests, setTests] = useState<JLPTTestDoc[]>([]);
  const [submissions, setSubmissions] = useState<TestSubmissionDoc[]>([]);
  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedClassId, setSelectedClassId] = useState<string>("ALL");
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [testList, subList, classList] = await Promise.all([
        getAllTests(),
        getAllSubmissions(),
        getClasses(),
      ]);
      setTests(testList);
      setSubmissions(subList);
      setClasses(classList);
    } catch (err) {
      console.error("Load tests error:", err);
      toast.error("Không thể tải danh sách đề thi từ cơ sở dữ liệu.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter tests based on user role and filters
  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      // Role scope: if student, show their class tests or ALL
      if (role === "student" && user.classId) {
        if (t.classId !== user.classId && t.classId !== "ALL") return false;
      } else if (selectedClassId !== "ALL") {
        if (t.classId !== selectedClassId && t.classId !== "ALL") return false;
      }

      // Filter level
      if (selectedLevel !== "ALL" && t.level !== selectedLevel) {
        return false;
      }

      // Filter search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchCode = t.code.toLowerCase().includes(q);
        const matchJa = t.titleJa ? t.titleJa.toLowerCase().includes(q) : false;
        if (!matchTitle && !matchCode && !matchJa) return false;
      }

      return true;
    });
  }, [tests, role, user.classId, selectedClassId, selectedLevel, searchQuery]);

  const countByType = (test: JLPTTestDoc, type: string) =>
    (test.questions || []).filter((q) => q.type === type).length;

  return (
    <div className="space-y-6 animate-[rise-in_260ms_var(--ease-out-expo)_both]">
      {/* Header */}
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-shinme-line pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-shinme-ink sm:text-3xl">
              Trung tâm Khảo thí & Đề thi JLPT
            </h1>
            <Badge tone="leaf">Ngân hàng đề JLPT</Badge>
          </div>
          <p className="mt-1 text-sm font-semibold text-shinme-muted">
            {role === "student"
              ? "Phòng thi trực tuyến chuẩn cấu trúc JLPT (Goi · Bunpou · Dấu sao ★ · Dokkai · Choukai)"
              : "Thiết kế đề thi có Furigana trực tiếp, quản lý ngân hàng đề và phân tích kết quả bài nộp của học viên"}
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
              <BarChart3 /> {role === "student" ? "Bảng điểm cá nhân" : "Sổ điểm & Phân tích câu sai"}
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar for Sensei/Admin */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-shinme-border bg-shinme-surface p-4 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center gap-2.5">
          {role !== "student" && (
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-shinme-ink focus:border-shinme-primary focus:outline-none"
            >
              <option value="ALL">Tất cả lớp học</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  Lớp: {cls.shortName}
                </option>
              ))}
            </select>
          )}

          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-shinme-ink focus:border-shinme-primary focus:outline-none"
          >
            <option value="ALL">Tất cả cấp độ</option>
            <option value="N5">JLPT N5</option>
            <option value="N4">JLPT N4</option>
            <option value="N3">JLPT N3</option>
            <option value="N2">JLPT N2</option>
            <option value="N1">JLPT N1</option>
            <option value="KAIWA">Giao tiếp Kaiwa</option>
          </select>
        </div>

        <div className="relative min-w-[14rem] flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-shinme-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm đề thi theo mã, tên..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-xs font-medium text-shinme-ink placeholder:text-shinme-muted focus:border-shinme-primary focus:outline-none"
          />
        </div>
      </div>

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

      {/* Loading state */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 rounded-3xl border border-shinme-border bg-shinme-surface/60 p-6 animate-pulse" />
          ))}
        </div>
      ) : filteredTests.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-shinme-border bg-shinme-surface p-12 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-shinme-leaf text-shinme-primary">
            <GraduationCap className="size-8" />
          </div>
          <h3 className="mt-4 text-lg font-black text-shinme-ink">Chưa có đề thi nào</h3>
          <p className="mt-1 text-sm text-shinme-muted">
            Không tìm thấy đề thi phù hợp với lớp học hoặc bộ lọc hiện tại.
          </p>
          {role !== "student" && (
            <Button asChild className="mt-5">
              <Link href="/portal/tests/create">
                <FilePlus2 className="size-4" /> Tạo đề thi đầu tiên
              </Link>
            </Button>
          )}
        </div>
      ) : (
        /* Test Cards List */
        <div className="space-y-4">
          {filteredTests.map((test) => {
            // Find student's submissions for this test
            const myAttempts = submissions.filter(
              (s) =>
                s.testId === test.id &&
                (s.studentId === user.id ||
                  s.studentCode === user.code ||
                  (firebaseUser && s.studentId === firebaseUser.uid))
            );
            const allTestAttempts = submissions.filter((s) => s.testId === test.id);
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
                    {test.titleJa && (
                      <FuriganaText
                        text={test.titleJa}
                        className="block text-sm font-bold text-shinme-primary"
                      />
                    )}

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
                      {test.deadline && (
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
                      )}
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
      )}
    </div>
  );
}
