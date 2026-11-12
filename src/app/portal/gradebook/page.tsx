"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  BarChart3,
  ArrowLeft,
  Play,
  Search,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { FuriganaText } from "@/components/furigana-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRole } from "@/lib/role-context";
import {
  getAllTests,
  getClasses,
  getAllUsers,
  getAllSubmissions,
  getSubmissionsByStudent,
} from "@/lib/db/services";
import type {
  JLPTTestDoc,
  ClassDoc,
  UserProfileDoc,
  TestSubmissionDoc,
} from "@/lib/db/schema";

function formatDurationMMSS(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function GradebookPage() {
  const { role, user, firebaseUser } = useRole();

  const [tests, setTests] = useState<JLPTTestDoc[]>([]);
  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [users, setUsers] = useState<UserProfileDoc[]>([]);
  const [submissions, setSubmissions] = useState<TestSubmissionDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [selectedTestId, setSelectedTestId] = useState<string>("");
  const [searchStudent, setSearchStudent] = useState<string>("");

  const loadData = async () => {
    try {
      setIsLoading(true);
      const uid = firebaseUser?.uid || user.id;
      const [testList, classList, userList, subList] = await Promise.all([
        getAllTests(),
        getClasses(),
        role === "student" ? Promise.resolve([]) : getAllUsers(),
        role === "student" ? getSubmissionsByStudent(uid) : getAllSubmissions(),
      ]);
      setTests(testList);
      setClasses(classList);
      setUsers(userList);
      setSubmissions(subList);

      if (testList.length > 0) {
        setSelectedTestId(testList[0].id);
      }
    } catch (err) {
      console.error("Load gradebook error:", err);
      toast.error("Không thể tải dữ liệu bảng điểm.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [role, firebaseUser, user.id]);

  // Current active test
  const activeTest = useMemo(() => {
    return tests.find((t) => t.id === selectedTestId) || tests[0] || null;
  }, [tests, selectedTestId]);

  // Students in class of active test (or all students if class is ALL)
  const classStudents = useMemo(() => {
    if (!activeTest) return [];
    const allStudents = users.filter((u) => u.role === "student");
    if (activeTest.classId === "ALL") return allStudents;
    const enrolled = allStudents.filter((u) => u.classId === activeTest.classId);
    return enrolled.length > 0 ? enrolled : allStudents;
  }, [users, activeTest]);

  // Unified Gradebook rows: Combine students with their test submissions
  const gradebookRows = useMemo(() => {
    if (!activeTest) return [];

    const testSubmissions = submissions.filter((s) => s.testId === activeTest.id);

    // Map each student in class
    const rows = classStudents.map((st) => {
      const studentSubs = testSubmissions.filter(
        (s) =>
          s.studentId === st.uid ||
          s.studentCode === st.code ||
          s.studentName.toLowerCase() === st.fullName.toLowerCase()
      );

      const bestSub =
        studentSubs.length > 0
          ? studentSubs.reduce((best, curr) => (curr.score > best.score ? curr : best))
          : null;

      const status: "Đạt" | "Chưa đạt" | "Chưa làm" = !bestSub
        ? "Chưa làm"
        : bestSub.passed
        ? "Đạt"
        : "Chưa đạt";

      return {
        studentId: st.uid,
        studentCode: st.code,
        studentName: st.fullName,
        email: st.email,
        score: bestSub ? bestSub.score : null,
        totalPoints: activeTest.totalPoints,
        passed: bestSub ? bestSub.passed : false,
        durationSeconds: bestSub ? bestSub.durationSeconds : null,
        submittedAt: bestSub ? bestSub.submittedAt : null,
        attemptsCount: studentSubs.length,
        status,
      };
    });

    // Also include any submissions from users not officially in class
    for (const sub of testSubmissions) {
      const alreadyIncluded = rows.some(
        (r) => r.studentId === sub.studentId || r.studentCode === sub.studentCode
      );
      if (!alreadyIncluded) {
        rows.push({
          studentId: sub.studentId,
          studentCode: sub.studentCode,
          studentName: sub.studentName,
          email: "hocvien@shinme.edu.vn",
          score: sub.score,
          totalPoints: sub.totalPoints,
          passed: sub.passed,
          durationSeconds: sub.durationSeconds,
          submittedAt: sub.submittedAt,
          attemptsCount: 1,
          status: sub.passed ? "Đạt" : "Chưa đạt",
        });
      }
    }

    // Filter by student search query
    if (searchStudent.trim()) {
      const q = searchStudent.toLowerCase();
      return rows.filter(
        (r) =>
          r.studentName.toLowerCase().includes(q) ||
          r.studentCode.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q)
      );
    }

    return rows;
  }, [activeTest, classStudents, submissions, searchStudent]);

  // Metrics
  const completedRows = gradebookRows.filter((r) => r.score !== null);
  const classAvgScore =
    completedRows.length > 0
      ? Math.round(
          completedRows.reduce((sum, r) => sum + (r.score ?? 0), 0) /
            completedRows.length
        )
      : 0;
  const passCount = gradebookRows.filter((r) => r.status === "Đạt").length;
  const failCount = gradebookRows.filter((r) => r.status === "Chưa đạt").length;
  const notTakenCount = gradebookRows.filter((r) => r.status === "Chưa làm").length;

  // Student's own test history (for student role)
  const studentHistory = useMemo(() => {
    if (role !== "student") return [];
    return submissions.filter(
      (s) =>
        s.studentId === user.id ||
        s.studentCode === user.code ||
        (firebaseUser && s.studentId === firebaseUser.uid)
    );
  }, [role, submissions, user.id, user.code, firebaseUser]);

  // Export Gradebook to CSV
  const handleExportCSV = () => {
    if (!activeTest || gradebookRows.length === 0) {
      toast.error("Chưa có dữ liệu bảng điểm để xuất file.");
      return;
    }

    const headers = [
      "Mã Học Viên",
      "Họ và Tên",
      "Lớp",
      "Mã Đề Thi",
      "Điểm Số",
      "Tổng Điểm",
      "Thời Gian Làm Bài (MM:SS)",
      "Số Lần Làm",
      "Trạng Thái",
      "Thời Gian Nộp",
    ];

    const csvRows = gradebookRows.map((row) => [
      row.studentCode,
      `"${row.studentName}"`,
      `"${activeTest.className}"`,
      activeTest.code,
      row.score !== null ? String(row.score) : "Chưa nộp",
      String(row.totalPoints),
      row.durationSeconds !== null
        ? formatDurationMMSS(row.durationSeconds)
        : "--:--",
      String(row.attemptsCount),
      row.status,
      row.submittedAt ? new Date(row.submittedAt).toLocaleString("vi-VN") : "--",
    ]);

    const csvString =
      "\uFEFF" +
      [headers.join(","), ...csvRows.map((r) => r.join(","))].join("\n");

    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Bang_Diem_${activeTest.code}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Đã xuất file CSV bảng điểm (${gradebookRows.length} học viên)!`);
  };

  return (
    <div className="space-y-6 pb-16 animate-[rise-in_260ms_var(--ease-out-expo)_both]">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-shinme-border bg-shinme-surface p-6 shadow-[var(--shadow-card)] lg:flex-row lg:items-center">
        <div className="space-y-1.5">
          <Link
            href="/portal/tests"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-shinme-primary hover:underline"
          >
            <ArrowLeft className="size-3.5" />
            Quay lại Trung tâm Khảo thí JLPT
          </Link>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-black text-shinme-ink">
              {role === "student" ? "Bảng Điểm Cá Nhân & Lịch Sử Thi" : "Bảng Điểm Bài Kiểm Tra (Sensei Gradebook)"}
            </h1>
            <Badge tone="leaf">Kết quả chính thức</Badge>
          </div>
          <p className="text-sm font-semibold text-shinme-muted">
            {role === "student"
              ? "Theo dõi toàn bộ lịch sử điểm số, kết quả đạt chuẩn và thời gian làm bài của bạn"
              : "Theo dõi kết quả làm bài, điểm thi và sĩ số hoàn thành của từng học viên theo lớp"}
          </p>
        </div>

        {role !== "student" && (
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleExportCSV}>
              <Download className="size-3.5" /> Xuất file CSV
            </Button>
            {activeTest && (
              <Button asChild size="sm">
                <Link href={`/portal/tests/${activeTest.id}/take`}>
                  <Play className="size-3.5" /> Xem đề thi
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-28 rounded-2xl border border-shinme-border bg-shinme-surface p-6 animate-pulse" />
          <div className="h-64 rounded-2xl border border-shinme-border bg-shinme-surface p-6 animate-pulse" />
        </div>
      ) : role === "student" ? (
        /* =====================================================================
         * STUDENT VIEW: PERSONAL EXAM HISTORY
         * ===================================================================== */
        <div className="space-y-4">
          <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-lg font-black text-shinme-ink flex items-center gap-2">
              <GraduationCap className="size-5 text-shinme-primary" />
              Lịch sử {studentHistory.length} bài thi đã hoàn thành
            </h2>
            <p className="text-xs text-shinme-muted mt-1">
              Điểm số được lưu trữ tự động sau mỗi lần nộp bài kiểm tra
            </p>

            {studentHistory.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-shinme-border p-8 text-center mt-4">
                <p className="text-sm font-bold text-shinme-muted">
                  Bạn chưa làm bài kiểm tra nào.
                </p>
                <Button asChild size="sm" className="mt-3">
                  <Link href="/portal/tests">Vào phòng thi ngay</Link>
                </Button>
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-shinme-line text-shinme-muted">
                      <th className="py-2.5 px-3 font-bold">Mã đề thi</th>
                      <th className="py-2.5 px-3 font-bold">Điểm đạt được</th>
                      <th className="py-2.5 px-3 font-bold">Thời gian làm bài</th>
                      <th className="py-2.5 px-3 font-bold">Thời gian nộp</th>
                      <th className="py-2.5 px-3 font-bold">Kết quả</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-shinme-line">
                    {studentHistory.map((sub) => (
                      <tr key={sub.id} className="hover:bg-shinme-bg/50">
                        <td className="py-3 px-3 font-mono font-bold text-shinme-primary">
                          {sub.testId}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono text-sm font-black text-shinme-ink">
                            {sub.score}/{sub.totalPoints}
                          </span>{" "}
                          điểm
                        </td>
                        <td className="py-3 px-3 font-mono text-shinme-muted">
                          {formatDurationMMSS(sub.durationSeconds)}
                        </td>
                        <td className="py-3 px-3 text-shinme-muted">
                          {new Date(sub.submittedAt).toLocaleString("vi-VN")}
                        </td>
                        <td className="py-3 px-3">
                          <Badge tone={sub.passed ? "leaf" : "warn"}>
                            {sub.passed ? "Đạt (Goukaku)" : "Chưa đạt"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* =====================================================================
         * SENSEI & ADMIN VIEW: STREAMLINED CLASS GRADEBOOK
         * ===================================================================== */
        <div className="space-y-6">
          {/* Controls: Select Test + Search Student */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-shinme-border bg-shinme-surface p-4 shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-shinme-ink">Chọn đề thi:</span>
                <select
                  value={selectedTestId}
                  onChange={(e) => setSelectedTestId(e.target.value)}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-shinme-ink focus:border-shinme-primary focus:outline-none"
                >
                  {tests.map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.code}] {t.title} ({t.className})
                    </option>
                  ))}
                </select>
              </div>

              {activeTest && (
                <span className="rounded-full bg-shinme-bg px-3 py-1 font-mono text-xs font-bold text-shinme-primary border border-shinme-line">
                  Chuẩn đạt: {activeTest.passScore}/{activeTest.totalPoints} điểm
                </span>
              )}
            </div>

            <div className="relative min-w-[14rem] flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-shinme-muted" />
              <input
                type="text"
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                placeholder="Tìm học viên theo tên, mã..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-xs font-medium text-shinme-ink placeholder:text-shinme-muted focus:border-shinme-primary focus:outline-none"
              />
            </div>
          </div>

          {/* 4 Summary Metrics Cards */}
          {activeTest && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-4 shadow-[var(--shadow-card)]">
                <p className="text-xs font-bold text-shinme-muted">Điểm TB lớp</p>
                <p className="mt-1 font-mono text-2xl font-black text-shinme-primary">
                  {classAvgScore}
                  <span className="text-xs font-normal text-shinme-muted">
                    /{activeTest.totalPoints}đ
                  </span>
                </p>
                <p className="mt-1 text-xs text-shinme-muted">
                  Chuẩn: {activeTest.passScore}đ
                </p>
              </div>

              <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-4 shadow-[var(--shadow-card)]">
                <p className="text-xs font-bold text-emerald-800">Đạt (Goukaku)</p>
                <p className="mt-1 font-mono text-2xl font-black text-emerald-600">
                  {passCount} <span className="font-sans text-xs font-semibold">HV</span>
                </p>
                <p className="mt-1 text-xs text-emerald-700">
                  Tỷ lệ: {completedRows.length > 0 ? Math.round((passCount / completedRows.length) * 100) : 0}%
                </p>
              </div>

              <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-4 shadow-[var(--shadow-card)]">
                <p className="text-xs font-bold text-rose-800">Chưa đạt</p>
                <p className="mt-1 font-mono text-2xl font-black text-rose-600">
                  {failCount} <span className="font-sans text-xs font-semibold">HV</span>
                </p>
                <p className="mt-1 text-xs text-rose-600">Cần phụ đạo thêm</p>
              </div>

              <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-4 shadow-[var(--shadow-card)]">
                <p className="text-xs font-bold text-amber-900">Chưa làm bài</p>
                <p className="mt-1 font-mono text-2xl font-black text-amber-700">
                  {notTakenCount} <span className="font-sans text-xs font-semibold">HV</span>
                </p>
                <p className="mt-1 text-xs text-amber-800">
                  Trên {gradebookRows.length} học viên
                </p>
              </div>
            </div>
          )}

          {/* Clean Student Roster Grade Table */}
          <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-5 shadow-[var(--shadow-card)]">
            <div className="mb-4 flex items-center justify-between border-b border-shinme-line pb-3">
              <div>
                <h2 className="text-base font-black text-shinme-ink">
                  Danh sách điểm học viên ({gradebookRows.length})
                </h2>
                <p className="text-xs text-shinme-muted">
                  Hiển thị điểm cao nhất và thời gian nộp bài của học viên
                </p>
              </div>
            </div>

            {gradebookRows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-shinme-border p-8 text-center text-xs text-shinme-muted">
                Không tìm thấy học viên nào phù hợp.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-shinme-line text-shinme-muted">
                      <th className="py-2.5 px-3 font-bold">Mã HV</th>
                      <th className="py-2.5 px-3 font-bold">Họ và tên</th>
                      <th className="py-2.5 px-3 font-bold">Email</th>
                      <th className="py-2.5 px-3 font-bold">Điểm số</th>
                      <th className="py-2.5 px-3 font-bold">Lượt nộp</th>
                      <th className="py-2.5 px-3 font-bold">Thời gian làm</th>
                      <th className="py-2.5 px-3 font-bold">Thời gian nộp</th>
                      <th className="py-2.5 px-3 font-bold">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-shinme-line">
                    {gradebookRows.map((row) => (
                      <tr key={row.studentId} className="hover:bg-shinme-bg/50">
                        <td className="py-3 px-3 font-mono font-bold text-shinme-muted">
                          {row.studentCode}
                        </td>
                        <td className="py-3 px-3 font-bold text-shinme-ink">
                          {row.studentName}
                        </td>
                        <td className="py-3 px-3 text-shinme-muted">
                          {row.email}
                        </td>
                        <td className="py-3 px-3">
                          {row.score !== null ? (
                            <span className="font-mono text-sm font-black text-shinme-primary">
                              {row.score}/{row.totalPoints}đ
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono">--/{row.totalPoints}đ</span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-shinme-muted">
                          {row.attemptsCount}
                        </td>
                        <td className="py-3 px-3 font-mono text-shinme-muted">
                          {row.durationSeconds !== null
                            ? formatDurationMMSS(row.durationSeconds)
                            : "--:--"}
                        </td>
                        <td className="py-3 px-3 text-shinme-muted">
                          {row.submittedAt
                            ? new Date(row.submittedAt).toLocaleDateString("vi-VN", {
                                day: "2-digit",
                                month: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "--"}
                        </td>
                        <td className="py-3 px-3">
                          {row.status === "Đạt" ? (
                            <Badge tone="leaf">
                              <CheckCircle2 className="size-3" /> Đạt
                            </Badge>
                          ) : row.status === "Chưa đạt" ? (
                            <Badge tone="warn">
                              <XCircle className="size-3" /> Chưa đạt
                            </Badge>
                          ) : (
                            <Badge tone="neutral">Chưa làm</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
