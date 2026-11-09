"use client";

import React, { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  BarChart3,
  BookOpen,
  Sparkles,
  ArrowLeft,
  Play,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { FuriganaText } from "@/components/furigana-text";
import { MOCK_ROSTERS } from "@/lib/classroom-store";
import {
  readTests,
  getTestsServerSnapshot,
  subscribeTests,
  readAttempts,
  getAttemptsServerSnapshot,
  subscribeAttempts,
  type JLPTTest,
  type StudentTestAttempt,
} from "@/lib/test-center-store";

function formatDurationMMSS(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function SenseiGradebookPage() {
  const tests = useSyncExternalStore(
    subscribeTests,
    readTests,
    getTestsServerSnapshot
  );
  const attempts = useSyncExternalStore(
    subscribeAttempts,
    readAttempts,
    getAttemptsServerSnapshot
  );

  const [selectedTestId, setSelectedTestId] = useState<string>(
    "n3-mock-test-01"
  );

  const activeTest: JLPTTest =
    tests.find((t) => t.id === selectedTestId) ?? tests[0];

  const classRoster =
    MOCK_ROSTERS[activeTest.classId] ?? MOCK_ROSTERS["cls-n3-246"] ?? [];

  const testAttempts = attempts.filter((a) => a.testId === activeTest.id);

  // Build unified class gradebook rows combining roster + latest/best attempt per student
  const gradebookRows = classRoster.map((student) => {
    const studentAttempts = testAttempts.filter(
      (a) =>
        a.studentCode === student.code ||
        a.studentId === student.id ||
        a.studentName === student.fullName
    );
    const bestAttempt: StudentTestAttempt | undefined =
      studentAttempts.sort((a, b) => b.score - a.score)[0];

    const status: "Đạt" | "Chưa đạt" | "Chưa làm" = !bestAttempt
      ? "Chưa làm"
      : bestAttempt.passed
        ? "Đạt"
        : "Chưa đạt";

    return {
      studentId: student.id,
      studentCode: student.code,
      studentName: student.fullName,
      email: student.email,
      attempt: bestAttempt,
      attemptsCount: studentAttempts.length,
      score: bestAttempt ? bestAttempt.score : null,
      totalPoints: activeTest.totalPoints,
      durationSeconds: bestAttempt ? bestAttempt.durationSeconds : null,
      submittedAt: bestAttempt ? bestAttempt.submittedAt : null,
      status,
    };
  });

  // Also include any custom attempt from Demo Role Switcher if not already in roster
  for (const att of testAttempts) {
    const exists = gradebookRows.some(
      (r) => r.studentCode === att.studentCode
    );
    if (!exists) {
      gradebookRows.unshift({
        studentId: att.studentId,
        studentCode: att.studentCode,
        studentName: att.studentName,
        email: "hocvien@shinme.edu.vn",
        attempt: att,
        attemptsCount: 1,
        score: att.score,
        totalPoints: att.totalPoints,
        durationSeconds: att.durationSeconds,
        submittedAt: att.submittedAt,
        status: att.passed ? "Đạt" : "Chưa đạt",
      });
    }
  }

  // Compute Item Analysis ("Câu hỏi học viên hay sai nhất")
  const itemAnalysis = activeTest.questions
    .map((q, qIdx) => {
      const totalSubmits = testAttempts.length;
      if (totalSubmits === 0) {
        return {
          question: q,
          questionNumber: qIdx + 1,
          accuracyPercent: 0,
          correctCount: 0,
          wrongCount: 0,
          totalSubmits: 0,
          mostCommonWrongOption: null as number | null,
        };
      }

      let correctCount = 0;
      const wrongOptionCounts: Record<number, number> = {};

      for (const att of testAttempts) {
        const chosen = att.answers[q.id];
        if (chosen === q.correctIndex) {
          correctCount += 1;
        } else if (chosen !== undefined) {
          wrongOptionCounts[chosen] = (wrongOptionCounts[chosen] || 0) + 1;
        }
      }

      let mostCommonWrongOption: number | null = null;
      let maxWrong = 0;
      for (const [optKey, count] of Object.entries(wrongOptionCounts)) {
        if (count > maxWrong) {
          maxWrong = count;
          mostCommonWrongOption = Number(optKey);
        }
      }

      const accuracyPercent = Math.round((correctCount / totalSubmits) * 100);

      return {
        question: q,
        questionNumber: qIdx + 1,
        accuracyPercent,
        correctCount,
        wrongCount: totalSubmits - correctCount,
        totalSubmits,
        mostCommonWrongOption,
      };
    })
    .sort((a, b) => a.accuracyPercent - b.accuracyPercent);

  const completedRows = gradebookRows.filter((r) => r.score !== null);
  const classAverageScore =
    completedRows.length > 0
      ? Math.round(
          completedRows.reduce((s, r) => s + (r.score ?? 0), 0) /
            completedRows.length
        )
      : 0;
  const passCount = gradebookRows.filter((r) => r.status === "Đạt").length;
  const failCount = gradebookRows.filter((r) => r.status === "Chưa đạt").length;
  const notTakenCount = gradebookRows.filter(
    (r) => r.status === "Chưa làm"
  ).length;

  // Export Gradebook to UTF-8 BOM CSV
  const handleExportCSV = () => {
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
    ]);

    const csvString =
      "\uFEFF" +
      [headers.join(","), ...csvRows.map((r) => r.join(","))].join("\n");

    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Bang_Diem_${activeTest.code}_${activeTest.classId}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Đã xuất file CSV bảng điểm lớp (${gradebookRows.length} học viên)!`);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm lg:flex-row lg:items-center">
        <div className="space-y-1.5">
          <Link
            href="/portal/tests"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#135E36] hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Quay lại Trung tâm Khảo thí JLPT
          </Link>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Sổ Điểm Lớp Học & Phân Tích Câu Hỏi Hay Sai (Sensei Gradebook)
            </h1>
            <span className="rounded-full bg-[#6CC24A]/20 px-3 py-0.5 text-xs font-bold text-[#135E36]">
              Item Analysis chuẩn JLPT
            </span>
          </div>
          <p className="text-sm text-slate-600">
            Theo dõi kết quả làm bài của từng học viên và phát hiện sớm các cấu trúc ngữ pháp cả lớp đang nhầm lẫn nhiều nhất.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 rounded-xl border border-[#135E36] bg-emerald-50/70 px-4 py-2.5 text-xs font-extrabold text-[#135E36] transition hover:bg-emerald-100"
          >
            <Download className="h-4 w-4" />
            Xuất Bảng Điểm (.CSV)
          </button>

          <Link
            href="/portal/tests/create"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#135E36] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#0f4a2a]"
          >
            <Plus className="h-4 w-4 text-[#6CC24A]" />
            Soạn đề thi mới
          </Link>
        </div>
      </div>

      {/* Test Filter Bar & KPI Summary */}
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm lg:col-span-5">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-500">
              Chọn bài kiểm tra cần thống kê:
            </label>
            <select
              value={activeTest.id}
              onChange={(e) => setSelectedTestId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-[#FAF8F2] px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:border-[#135E36] focus:outline-none"
            >
              {tests.map((t) => (
                <option key={t.id} value={t.id}>
                  [{t.code}] {t.title}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
            <div className="font-jp text-xs font-bold text-[#135E36]">
              <FuriganaText text={activeTest.titleJa} /> • {activeTest.className}
            </div>
            <Link
              href={`/portal/tests/${activeTest.id}/take`}
              className="inline-flex items-center gap-1 text-xs font-extrabold text-[#135E36] hover:underline"
            >
              <Play className="h-3.5 w-3.5" />
              Mở phòng thi
            </Link>
          </div>
        </div>

        {/* 4 Summary Metrics */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:col-span-7">
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold text-slate-500">Điểm TB lớp</p>
            <p className="mt-1.5 font-mono text-2xl font-extrabold text-[#135E36]">
              {classAverageScore}
              <span className="text-xs font-normal text-slate-500">
                /{activeTest.totalPoints}đ
              </span>
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Điểm chuẩn: {activeTest.passScore}đ
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
            <p className="text-xs font-bold text-[#135E36]">Đạt (Goukaku)</p>
            <p className="mt-1.5 font-mono text-2xl font-extrabold text-[#135E36]">
              {passCount}{" "}
              <span className="font-sans text-xs font-semibold">HV</span>
            </p>
            <p className="mt-1 text-xs text-[#135E36]">
              Trên {gradebookRows.length} sĩ số lớp
            </p>
          </div>

          <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 shadow-sm">
            <p className="text-xs font-bold text-rose-800">Chưa đạt</p>
            <p className="mt-1.5 font-mono text-2xl font-extrabold text-rose-700">
              {failCount}{" "}
              <span className="font-sans text-xs font-semibold">HV</span>
            </p>
            <p className="mt-1 text-xs text-rose-700">Cần phụ đạo thêm</p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
            <p className="text-xs font-bold text-amber-900">Chưa làm bài</p>
            <p className="mt-1.5 font-mono text-2xl font-extrabold text-amber-800">
              {notTakenCount}{" "}
              <span className="font-sans text-xs font-semibold">HV</span>
            </p>
            <p className="mt-1 text-xs text-amber-800">Nhắc hạn nộp bài</p>
          </div>
        </div>
      </div>

      {/* ==================================================================
       * SECTION 1: ITEM ANALYSIS ("CÂU HỎI HỌC VIÊN HAY SAI NHẤT")
       * ================================================================== */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-rose-600" />
              <h2 className="text-lg font-extrabold text-slate-900">
                Câu hỏi học viên hay sai nhất (Item Analysis — Phân tích độ khó & lỗi sai)
              </h2>
            </div>
            <p className="text-xs text-slate-600">
              Sắp xếp tự động từ câu có tỷ lệ chính xác thấp nhất để Sensei ưu tiên chữa bài trên lớp.
            </p>
          </div>

          <span className="rounded-xl bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-800">
            Cảnh báo đỏ khi tỷ lệ đúng &lt; 65%
          </span>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {itemAnalysis.map((item) => {
            const isLowAccuracy = item.accuracyPercent < 65;
            const optionLetters = ["A", "B", "C", "D"];

            return (
              <div
                key={item.question.id}
                className={`rounded-2xl border p-4 transition ${
                  isLowAccuracy
                    ? "border-rose-200 bg-rose-50/35"
                    : "border-slate-200 bg-[#FAF8F2]/60"
                }`}
              >
                <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-lg px-2.5 py-0.5 font-mono text-xs font-extrabold text-white ${
                        isLowAccuracy ? "bg-rose-600" : "bg-[#135E36]"
                      }`}
                    >
                      Câu {item.questionNumber}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-slate-700 shadow-2xs">
                      {item.question.mondaiLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-xs font-extrabold ${
                        isLowAccuracy ? "text-rose-700" : "text-[#135E36]"
                      }`}
                    >
                      Tỷ lệ đúng: {item.accuracyPercent}% ({item.correctCount}/
                      {item.totalSubmits} HV)
                    </span>
                  </div>
                </div>

                {/* Accuracy Progress Bar */}
                <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-white">
                  <div
                    className={`h-full rounded-full ${
                      isLowAccuracy ? "bg-rose-500" : "bg-[#6CC24A]"
                    }`}
                    style={{ width: `${item.accuracyPercent}%` }}
                  />
                </div>

                {/* Grammar Point to Review */}
                <div className="mb-2 flex items-center gap-1.5 text-xs font-extrabold text-[#135E36]">
                  <BookOpen className="h-3.5 w-3.5 shrink-0" />
                  <span>Chủ điểm cần ôn tập: {item.question.grammarPoint}</span>
                </div>

                {/* Question Prompt Preview with Furigana */}
                <div className="mb-2.5 rounded-xl border border-slate-200/80 bg-white p-3 font-jp text-sm font-bold text-slate-900">
                  <FuriganaText text={item.question.prompt} />
                  {item.question.type === "star" && (
                    <p className="mt-1 font-jp text-xs font-normal text-amber-900">
                      <FuriganaText text={item.question.starPrefix || ""} /> [ ___ ] [ ___ ] [ ★ ] [ ___ ]{" "}
                      <FuriganaText text={item.question.starSuffix || ""} />
                    </p>
                  )}
                </div>

                {/* Correct Option vs Most Common Distractor */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-jp font-bold text-[#135E36]">
                    ✓ Đáp án đúng ({optionLetters[item.question.correctIndex]}):{" "}
                    <FuriganaText
                      text={item.question.options[item.question.correctIndex]}
                    />
                  </span>

                  {item.mostCommonWrongOption !== null && (
                    <span className="rounded-lg bg-rose-100 px-2.5 py-1 font-jp font-bold text-rose-800">
                      ✗ Bẫy hay chọn nhất (
                      {optionLetters[item.mostCommonWrongOption]}):{" "}
                      <FuriganaText
                        text={
                          item.question.options[item.mostCommonWrongOption]
                        }
                      />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ==================================================================
       * SECTION 2: CLASS SCORE OVERVIEW TABLE
       * ================================================================== */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-6">
          <div className="flex items-center gap-2.5">
            <Users className="h-5 w-5 text-[#135E36]" />
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">
                Bảng điểm chi tiết lớp {activeTest.className}
              </h2>
              <p className="text-xs text-slate-500">
                Tự động cập nhật ngay khi học viên nộp bài từ Phòng thi (`Exam Room`).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            <Download className="h-3.5 w-3.5 text-[#135E36]" />
            Tải file .CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-[#FAF8F2] text-xs font-extrabold uppercase tracking-wider text-slate-600">
                <th className="px-5 py-3.5">Mã HV</th>
                <th className="px-5 py-3.5">Họ và Tên Học Viên</th>
                <th className="px-5 py-3.5">Điểm số</th>
                <th className="px-5 py-3.5">Thời gian hoàn thành</th>
                <th className="px-5 py-3.5">Trạng thái</th>
                <th className="px-5 py-3.5">Ghi chú câu sai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {gradebookRows.map((row) => {
                const wrongQuestions = row.attempt
                  ? activeTest.questions
                      .map((q, idx) =>
                        row.attempt?.answers[q.id] !== q.correctIndex
                          ? `Câu ${idx + 1}`
                          : null
                      )
                      .filter(Boolean)
                  : [];

                return (
                  <tr
                    key={row.studentCode}
                    className="transition hover:bg-slate-50/80"
                  >
                    <td className="px-5 py-4 font-mono text-xs font-bold text-slate-700">
                      {row.studentCode}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-900">
                        {row.studentName}
                      </p>
                      <p className="text-xs text-slate-500">{row.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      {row.score !== null ? (
                        <div className="flex items-baseline gap-1 font-mono">
                          <span
                            className={`text-base font-extrabold ${
                              row.status === "Đạt"
                                ? "text-[#135E36]"
                                : "text-rose-600"
                            }`}
                          >
                            {row.score}
                          </span>
                          <span className="text-xs text-slate-400">
                            /{row.totalPoints}đ
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs font-semibold text-slate-700">
                      {row.durationSeconds !== null ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {formatDurationMMSS(row.durationSeconds)}
                        </span>
                      ) : (
                        <span className="text-slate-400">--:--</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {row.status === "Đạt" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#6CC24A]/20 px-3 py-1 text-xs font-extrabold text-[#135E36]">
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#135E36]" />
                          Đạt
                        </span>
                      )}
                      {row.status === "Chưa đạt" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-xs font-extrabold text-rose-800">
                          <XCircle className="h-3.5 w-3.5 text-rose-700" />
                          Chưa đạt
                        </span>
                      )}
                      {row.status === "Chưa làm" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-900">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-700" />
                          Chưa làm
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600">
                      {row.status === "Chưa làm" ? (
                        <span className="text-amber-700">
                          Chưa nộp bài kiểm tra
                        </span>
                      ) : wrongQuestions.length === 0 ? (
                        <span className="inline-flex items-center gap-1 font-bold text-[#135E36]">
                          <Sparkles className="h-3.5 w-3.5 text-[#6CC24A]" />
                          Tuyệt đối 100%
                        </span>
                      ) : (
                        <span>
                          Sai:{" "}
                          <strong className="text-rose-700">
                            {wrongQuestions.join(", ")}
                          </strong>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
