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
import { useTranslation } from "@/lib/i18n/context";
import {
  getAllTests,
  getTestsByClass,
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
  const { lang, tr } = useTranslation();

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
        role === "student"
          ? user.classId
            ? getTestsByClass(user.classId)
            : Promise.resolve([])
          : getAllTests(),
        role === "student" ? Promise.resolve([]) : getClasses(),
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
      toast.error(tr("Không thể tải dữ liệu bảng điểm.", "Failed to load gradebook data.", "成績表データを読み込めませんでした。"));
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
      toast.error(tr("Chưa có dữ liệu bảng điểm để xuất file.", "No gradebook data to export.", "出力する成績データがありません。"));
      return;
    }

    const headers = [
      tr("Mã Học Viên", "Student ID", "受講生ID"),
      tr("Họ và Tên", "Full Name", "氏名"),
      tr("Lớp", "Class", "クラス"),
      tr("Mã Đề Thi", "Exam Code", "試験コード"),
      tr("Điểm Số", "Score", "得点"),
      tr("Tổng Điểm", "Total Points", "満点"),
      tr("Thời Gian Làm Bài (MM:SS)", "Duration (MM:SS)", "所要時間 (MM:SS)"),
      tr("Số Lần Làm", "Attempts", "受験回数"),
      tr("Trạng Thái", "Status", "判定"),
      tr("Thời Gian Nộp", "Submitted At", "提出日時"),
    ];

    const csvRows = gradebookRows.map((row) => [
      row.studentCode,
      `"${row.studentName}"`,
      `"${activeTest.className}"`,
      activeTest.code,
      row.score !== null ? String(row.score) : tr("Chưa nộp", "Not submitted", "未提出"),
      String(row.totalPoints),
      row.durationSeconds !== null
        ? formatDurationMMSS(row.durationSeconds)
        : "--:--",
      String(row.attemptsCount),
      row.status === "Đạt" ? tr("Đạt", "Pass", "合格") : row.status === "Chưa đạt" ? tr("Chưa đạt", "Fail", "不合格") : tr("Chưa làm", "Pending", "未受験"),
      row.submittedAt ? new Date(row.submittedAt).toLocaleString(lang === "vi" ? "vi-VN" : lang === "ja" ? "ja-JP" : "en-US") : "--",
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

    toast.success(
      tr(
        `Đã xuất file CSV bảng điểm (${gradebookRows.length} học viên)!`,
        `Exported gradebook CSV (${gradebookRows.length} students)!`,
        `成績CSVを出力しました（${gradebookRows.length}名）！`
      )
    );
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
            {tr("Quay lại Trung tâm Khảo thí JLPT", "Back to JLPT Exam Center", "JLPT試験センターへ戻る")}
          </Link>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-black text-shinme-ink">
              {role === "student"
                ? tr("Bảng Điểm Cá Nhân & Lịch Sử Thi", "Personal Gradebook & Exam History", "個人成績表・受験履歴")
                : tr("Bảng Điểm Bài Kiểm Tra (Sensei Gradebook)", "Exam Gradebook (Sensei Gradebook)", "試験成績表（講師用）")}
            </h1>
            <Badge tone="leaf">{tr("Kết quả chính thức", "Official Results", "公式結果")}</Badge>
          </div>
          <p className="text-sm font-semibold text-shinme-muted">
            {role === "student"
              ? tr(
                "Theo dõi toàn bộ lịch sử điểm số, kết quả đạt chuẩn và thời gian làm bài của bạn",
                "Track your scores, passing status, and test duration history",
                "過去の得点・合否判定・所要時間の履歴を確認できます"
              )
              : tr(
                "Theo dõi kết quả làm bài, điểm thi và sĩ số hoàn thành của từng học viên theo lớp",
                "Monitor student test scores, pass rates, and class completion metrics",
                "クラスごとの受講生の成績・合格率・受験状況を確認できます"
              )}
          </p>
        </div>

        {role !== "student" && (
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleExportCSV}>
              <Download className="size-3.5" /> {tr("Xuất file CSV", "Export CSV", "CSV出力")}
            </Button>
            {activeTest && (
              <Button asChild size="sm">
                <Link href={`/portal/tests/${activeTest.id}/take`}>
                  <Play className="size-3.5" /> {tr("Xem đề thi", "View Exam", "試験を見る")}
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
              {tr(
                `Lịch sử ${studentHistory.length} bài thi đã hoàn thành`,
                `Exam History (${studentHistory.length} completed)`,
                `受験履歴（完了 ${studentHistory.length}件）`
              )}
            </h2>
            <p className="text-xs text-shinme-muted mt-1">
              {tr(
                "Điểm số được lưu trữ tự động sau mỗi lần nộp bài kiểm tra",
                "Scores are automatically recorded upon each test submission",
                "テスト提出後、得点は自動的に記録されます"
              )}
            </p>

            {studentHistory.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-shinme-border p-8 text-center mt-4">
                <p className="text-sm font-bold text-shinme-muted">
                  {tr("Bạn chưa làm bài kiểm tra nào.", "You have not taken any exams yet.", "まだ受験した試験はありません。")}
                </p>
                <Button asChild size="sm" className="mt-3">
                  <Link href="/portal/tests">
                    {tr("Vào phòng thi ngay", "Enter Exam Room", "試験室へ入る")}
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-shinme-line text-shinme-muted">
                      <th className="py-2.5 px-3 font-bold">{tr("Mã đề thi", "Exam Code", "試験コード")}</th>
                      <th className="py-2.5 px-3 font-bold">{tr("Điểm đạt được", "Score", "得点")}</th>
                      <th className="py-2.5 px-3 font-bold">{tr("Thời gian làm bài", "Duration", "所要時間")}</th>
                      <th className="py-2.5 px-3 font-bold">{tr("Thời gian nộp", "Submitted At", "提出日時")}</th>
                      <th className="py-2.5 px-3 font-bold">{tr("Kết quả", "Result", "判定")}</th>
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
                          {tr("điểm", "pts", "点")}
                        </td>
                        <td className="py-3 px-3 font-mono text-shinme-muted">
                          {formatDurationMMSS(sub.durationSeconds)}
                        </td>
                        <td className="py-3 px-3 text-shinme-muted">
                          {new Date(sub.submittedAt).toLocaleString(lang === "vi" ? "vi-VN" : lang === "ja" ? "ja-JP" : "en-US")}
                        </td>
                        <td className="py-3 px-3">
                          <Badge tone={sub.passed ? "leaf" : "warn"}>
                            {sub.passed ? tr("Đạt (Goukaku)", "Pass (Goukaku)", "合格") : tr("Chưa đạt", "Failed", "不合格")}
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
                <span className="text-xs font-bold text-shinme-ink">
                  {tr("Chọn đề thi:", "Select exam:", "試験を選択：")}
                </span>
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
                  {tr(
                    `Chuẩn đạt: ${activeTest.passScore}/${activeTest.totalPoints} điểm`,
                    `Passing score: ${activeTest.passScore}/${activeTest.totalPoints} pts`,
                    `合格基準：${activeTest.passScore}/${activeTest.totalPoints}点`
                  )}
                </span>
              )}
            </div>

            <div className="relative min-w-[14rem] flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-shinme-muted" />
              <input
                type="text"
                value={searchStudent}
                onChange={(e) => setSearchStudent(e.target.value)}
                placeholder={tr("Tìm học viên theo tên, mã...", "Search student by name, ID...", "氏名・IDで検索...")}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-xs font-medium text-shinme-ink placeholder:text-shinme-muted focus:border-shinme-primary focus:outline-none"
              />
            </div>
          </div>

          {/* 4 Summary Metrics Cards */}
          {activeTest && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-4 shadow-[var(--shadow-card)]">
                <p className="text-xs font-bold text-shinme-muted">
                  {tr("Điểm TB lớp", "Class Average", "クラス平均")}
                </p>
                <p className="mt-1 font-mono text-2xl font-black text-shinme-primary">
                  {classAvgScore}
                  <span className="text-xs font-normal text-shinme-muted">
                    /{activeTest.totalPoints}{tr("đ", " pts", "点")}
                  </span>
                </p>
                <p className="mt-1 text-xs text-shinme-muted">
                  {tr(`Chuẩn: ${activeTest.passScore}đ`, `Pass: ${activeTest.passScore} pts`, `合格点：${activeTest.passScore}点`)}
                </p>
              </div>

              <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-4 shadow-[var(--shadow-card)]">
                <p className="text-xs font-bold text-emerald-800">
                  {tr("Đạt (Goukaku)", "Pass (Goukaku)", "合格")}
                </p>
                <p className="mt-1 font-mono text-2xl font-black text-emerald-600">
                  {passCount} <span className="font-sans text-xs font-semibold">{tr("HV", "std", "名")}</span>
                </p>
                <p className="mt-1 text-xs text-emerald-700">
                  {tr("Tỷ lệ: ", "Rate: ", "合格率：")}
                  {completedRows.length > 0 ? Math.round((passCount / completedRows.length) * 100) : 0}%
                </p>
              </div>

              <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-4 shadow-[var(--shadow-card)]">
                <p className="text-xs font-bold text-rose-800">
                  {tr("Chưa đạt", "Failed", "不合格")}
                </p>
                <p className="mt-1 font-mono text-2xl font-black text-rose-600">
                  {failCount} <span className="font-sans text-xs font-semibold">{tr("HV", "std", "名")}</span>
                </p>
                <p className="mt-1 text-xs text-rose-600">
                  {tr("Cần phụ đạo thêm", "Needs extra tutoring", "補講が必要")}
                </p>
              </div>

              <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-4 shadow-[var(--shadow-card)]">
                <p className="text-xs font-bold text-amber-900">
                  {tr("Chưa làm bài", "Not Attempted", "未受験")}
                </p>
                <p className="mt-1 font-mono text-2xl font-black text-amber-700">
                  {notTakenCount} <span className="font-sans text-xs font-semibold">{tr("HV", "std", "名")}</span>
                </p>
                <p className="mt-1 text-xs text-amber-800">
                  {tr(`Trên ${gradebookRows.length} học viên`, `Out of ${gradebookRows.length} students`, `全${gradebookRows.length}名中`)}
                </p>
              </div>
            </div>
          )}

          {/* Clean Student Roster Grade Table */}
          <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-5 shadow-[var(--shadow-card)]">
            <div className="mb-4 flex items-center justify-between border-b border-shinme-line pb-3">
              <div>
                <h2 className="text-base font-black text-shinme-ink">
                  {tr(
                    `Danh sách điểm học viên (${gradebookRows.length})`,
                    `Student Grade List (${gradebookRows.length})`,
                    `受講生成績一覧（${gradebookRows.length}名）`
                  )}
                </h2>
                <p className="text-xs text-shinme-muted">
                  {tr(
                    "Hiển thị điểm cao nhất và thời gian nộp bài của học viên",
                    "Showing highest score and test submission duration per student",
                    "各受講生の最高得点と提出時間を表示しています"
                  )}
                </p>
              </div>
            </div>

            {gradebookRows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-shinme-border p-8 text-center text-xs text-shinme-muted">
                {tr("Không tìm thấy học viên nào phù hợp.", "No matching students found.", "該当する受講生が見つかりません。")}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-shinme-line text-shinme-muted">
                      <th className="py-2.5 px-3 font-bold">{tr("Mã HV", "ID", "ID")}</th>
                      <th className="py-2.5 px-3 font-bold">{tr("Họ và tên", "Full Name", "氏名")}</th>
                      <th className="py-2.5 px-3 font-bold">Email</th>
                      <th className="py-2.5 px-3 font-bold">{tr("Điểm số", "Score", "得点")}</th>
                      <th className="py-2.5 px-3 font-bold">{tr("Lượt nộp", "Attempts", "回数")}</th>
                      <th className="py-2.5 px-3 font-bold">{tr("Thời gian làm", "Duration", "所要時間")}</th>
                      <th className="py-2.5 px-3 font-bold">{tr("Thời gian nộp", "Submitted At", "提出日時")}</th>
                      <th className="py-2.5 px-3 font-bold">{tr("Trạng thái", "Status", "判定")}</th>
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
                              {row.score}/{row.totalPoints}{tr("đ", " pts", "点")}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono">--/{row.totalPoints}{tr("đ", " pts", "点")}</span>
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
                            ? new Date(row.submittedAt).toLocaleDateString(lang === "vi" ? "vi-VN" : lang === "ja" ? "ja-JP" : "en-US", {
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
                              <CheckCircle2 className="size-3" /> {tr("Đạt", "Pass", "合格")}
                            </Badge>
                          ) : row.status === "Chưa đạt" ? (
                            <Badge tone="warn">
                              <XCircle className="size-3" /> {tr("Chưa đạt", "Fail", "不合格")}
                            </Badge>
                          ) : (
                            <Badge tone="neutral">{tr("Chưa làm", "Pending", "未受験")}</Badge>
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
