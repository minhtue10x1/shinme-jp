"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Copy,
  Shuffle,
  Play,
  BarChart3,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Headphones,
  Star,
  FileText,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { FuriganaText } from "@/components/furigana-text";
import {
  getAllTests,
  getAllSubmissions,
  saveTestDoc,
  deleteTestDoc,
} from "@/lib/db/services";
import type { JLPTTestDoc, TestSubmissionDoc } from "@/lib/db/schema";

export default function SenseiTestManagePage() {
  const [tests, setTests] = useState<JLPTTestDoc[]>([]);
  const [submissions, setSubmissions] = useState<TestSubmissionDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTestId, setExpandedTestId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [testList, subList] = await Promise.all([
        getAllTests(),
        getAllSubmissions(),
      ]);
      setTests(testList);
      setSubmissions(subList);
      if (testList.length > 0 && !expandedTestId) {
        setExpandedTestId(testList[0].id);
      }
    } catch (err) {
      console.error("Failed to load tests for manage:", err);
      toast.error("Không thể tải danh sách đề thi từ cơ sở dữ liệu.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleShuffle = async (test: JLPTTestDoc) => {
    try {
      const updated: JLPTTestDoc = {
        ...test,
        shuffleQuestions: !test.shuffleQuestions,
      };
      await saveTestDoc(updated);
      setTests((prev) => prev.map((t) => (t.id === test.id ? updated : t)));
      toast.success(
        updated.shuffleQuestions
          ? `Đã bật trộn câu hỏi ngẫu nhiên cho "${test.code}"`
          : `Đã tắt trộn câu hỏi ngẫu nhiên cho "${test.code}"`
      );
    } catch (err) {
      console.error("Toggle shuffle error:", err);
      toast.error("Lỗi khi cập nhật cài đặt đề thi.");
    }
  };

  const handleDuplicate = async (test: JLPTTestDoc) => {
    try {
      const copy: JLPTTestDoc = {
        ...test,
        id: `test-${Date.now().toString(36)}`,
        code: `${test.code}-COPY`,
        title: `${test.title} (Bản sao)`,
        createdAt: new Date().toISOString().slice(0, 10),
      };
      await saveTestDoc(copy);
      setTests((prev) => [copy, ...prev]);
      toast.success(`Đã nhân bản đề thi "${test.code}"`);
    } catch (err) {
      console.error("Duplicate error:", err);
      toast.error("Không thể nhân bản đề thi.");
    }
  };

  const handleDelete = async (test: JLPTTestDoc) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa đề thi "${test.title}"?`)) return;
    try {
      await deleteTestDoc(test.id);
      setTests((prev) => prev.filter((t) => t.id !== test.id));
      toast.info(`Đã xóa đề thi "${test.title}"`);
    } catch (err) {
      console.error("Delete test error:", err);
      toast.error("Không thể xóa đề thi.");
    }
  };

  return (
    <div className="space-y-6 pb-14">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm lg:flex-row lg:items-center">
        <div className="space-y-1.5">
          <Link
            href="/portal/tests"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#135E36] hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Quay lại Trung tâm Khảo thí
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Quản lý Kho Đề Thi JLPT (Sensei Test Manager)
          </h1>
          <p className="text-sm text-slate-600">
            Kiểm tra cấu trúc câu hỏi, đáp án, lời giải Furigana và cấu hình trộn đề.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/portal/gradebook"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            <BarChart3 className="h-4 w-4 text-[#135E36]" />
            Mở Sổ điểm bài kiểm tra
          </Link>
          <Link
            href="/portal/tests/create"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#135E36] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#0f4a2a]"
          >
            <Plus className="h-4 w-4 text-[#6CC24A]" />
            Soạn Đề Thi Mới
          </Link>
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-36 rounded-2xl border border-slate-200 bg-white p-6 animate-pulse" />
          ))}
        </div>
      ) : tests.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
          <h3 className="text-lg font-black text-slate-900">Chưa có đề thi nào trên hệ thống</h3>
          <p className="mt-1 text-xs text-slate-500">Hãy bấm "Soạn Đề Thi Mới" để tạo bài kiểm tra đầu tiên.</p>
          <Link
            href="/portal/tests/create"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#135E36] px-4 py-2 text-xs font-bold text-white"
          >
            <Plus className="size-4" /> Soạn Đề Thi Mới
          </Link>
        </div>
      ) : (
        /* Test List */
        <div className="space-y-4">
          {tests.map((test) => {
            const isExpanded = expandedTestId === test.id;
            const testAttempts = submissions.filter((a) => a.testId === test.id);
            const passCount = testAttempts.filter((a) => a.passed).length;
            const avgScore =
              testAttempts.length > 0
                ? Math.round(
                    testAttempts.reduce((acc, c) => acc + c.score, 0) /
                      testAttempts.length
                  )
                : 0;

            return (
              <div
                key={test.id}
                className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition hover:border-[#135E36]/40"
              >
                {/* Summary Header Row */}
                <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#135E36]">
                        {test.code}
                      </span>
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-800">
                        JLPT {test.level}
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                        {test.className}
                      </span>
                      <span className="text-xs text-slate-600">
                        {(test.questions || []).length} câu hỏi · {test.totalPoints} điểm ·{" "}
                        {test.durationMinutes} phút
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-slate-900">{test.title}</h2>
                    {test.titleJa && (
                      <FuriganaText
                        text={test.titleJa}
                        className="text-xs text-slate-600 font-jp"
                      />
                    )}
                  </div>

                  {/* Actions & Stats */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Performance quick badge */}
                    <div className="hidden rounded-xl bg-slate-50 px-3 py-1.5 text-right sm:block border border-slate-100">
                      <div className="text-xs font-medium text-slate-600">
                        {testAttempts.length} lượt nộp
                      </div>
                      <div className="text-xs font-bold text-[#135E36]">
                        {testAttempts.length > 0
                          ? `TB: ${avgScore}/${test.totalPoints}đ (${passCount} Đạt)`
                          : "Chưa có lượt nộp"}
                      </div>
                    </div>

                    {/* Shuffle toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleShuffle(test)}
                      title="Bật/Tắt trộn thứ tự câu hỏi khi học viên làm bài"
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                        test.shuffleQuestions
                          ? "border-[#135E36] bg-emerald-50 text-[#135E36]"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Shuffle className="h-3.5 w-3.5" />
                      {test.shuffleQuestions ? "Trộn câu: BẬT" : "Trộn câu: TẮT"}
                    </button>

                    {/* Duplicate */}
                    <button
                      type="button"
                      onClick={() => handleDuplicate(test)}
                      title="Nhân bản đề thi"
                      className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    >
                      <Copy className="h-4 w-4" />
                    </button>

                    {/* Test Take preview */}
                    <Link
                      href={`/portal/tests/${test.id}/take`}
                      title="Thi thử với tư cách học viên"
                      className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-200"
                    >
                      <Play className="h-3.5 w-3.5 text-[#135E36]" />
                      Thi thử
                    </Link>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDelete(test)}
                      title="Xóa đề thi"
                      className="rounded-xl border border-rose-200 p-2 text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    {/* Expand/Collapse details */}
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedTestId(isExpanded ? null : test.id)
                      }
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      {isExpanded ? (
                        <>
                          Thu gọn <ChevronUp className="h-3.5 w-3.5" />
                        </>
                      ) : (
                        <>
                          Xem câu hỏi <ChevronDown className="h-3.5 w-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Question Details */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/60 p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Danh sách {(test.questions || []).length} câu hỏi chi tiết
                      </span>
                      <span className="text-xs text-slate-600">
                        Cấu trúc Furigana chuẩn: 「漢字[かんじ]」
                      </span>
                    </div>

                    <div className="space-y-3">
                      {(test.questions || []).map((q, idx) => (
                        <div
                          key={q.id}
                          className="rounded-xl border border-slate-200/80 bg-white p-4 text-xs shadow-2xs"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="rounded-md bg-slate-100 px-2 py-0.5 font-bold text-slate-800">
                                Câu {idx + 1}
                              </span>
                              <span
                                className={`rounded px-1.5 py-0.5 font-semibold ${
                                  q.type === "star"
                                    ? "bg-amber-100 text-amber-900"
                                    : q.type === "dokkai"
                                    ? "bg-blue-100 text-blue-900"
                                    : q.type === "choukai"
                                    ? "bg-purple-100 text-purple-900"
                                    : "bg-emerald-100 text-[#135E36]"
                                }`}
                              >
                                {q.type === "star"
                                  ? "Dấu sao ★"
                                  : q.type === "dokkai"
                                  ? "Đọc hiểu Dokkai"
                                  : q.type === "choukai"
                                  ? "Nghe Choukai"
                                  : "Trắc nghiệm chuẩn"}
                              </span>
                              <span className="text-slate-600">{q.points} điểm</span>
                            </div>

                            <span className="font-semibold text-slate-600">
                              {q.mondaiLabel}
                            </span>
                          </div>

                          {/* Dokkai passage preview if exists */}
                          {q.passageText && (
                            <div className="my-2.5 rounded-lg border border-blue-200 bg-blue-50/50 p-3">
                              <div className="mb-1 flex items-center gap-1 font-bold text-blue-900">
                                <BookOpen className="h-3.5 w-3.5" /> Đoạn văn Đọc hiểu (Passage)
                              </div>
                              <FuriganaText
                                text={q.passageText}
                                className="line-clamp-3 text-xs leading-relaxed text-slate-800 font-jp"
                              />
                            </div>
                          )}

                          {/* Prompt */}
                          <div className="my-2.5 text-sm font-semibold text-slate-900">
                            <FuriganaText text={q.prompt} />
                          </div>

                          {/* Star hints if star question */}
                          {q.type === "star" && (
                            <div className="my-2 rounded-md bg-amber-50/60 p-2 font-jp text-xs">
                              <span className="font-bold text-amber-900">
                                Cấu trúc sắp xếp:
                              </span>{" "}
                              {q.starPrefix || ""} ___ ___ ★ ___ {q.starSuffix || ""}
                            </div>
                          )}

                          {/* 4 Options Grid */}
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {q.options.map((opt, optIdx) => {
                              const isCorrect = optIdx === q.correctIndex;
                              return (
                                <div
                                  key={optIdx}
                                  className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 transition ${
                                    isCorrect
                                      ? "border-emerald-300 bg-emerald-50 text-[#135E36] font-bold"
                                      : "border-slate-100 bg-slate-50/50 text-slate-700"
                                  }`}
                                >
                                  <span
                                    className={`flex h-4 w-4 items-center justify-center rounded-full text-xs font-bold ${
                                      isCorrect
                                        ? "bg-[#135E36] text-white"
                                        : "bg-slate-200 text-slate-600"
                                    }`}
                                  >
                                    {["1", "2", "3", "4"][optIdx]}
                                  </span>
                                  <FuriganaText text={opt} className="font-jp" />
                                  {isCorrect && (
                                    <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-[#135E36]" />
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Explanation */}
                          {q.explanation && (
                            <div className="mt-2.5 rounded-md bg-slate-100 p-2 text-xs text-slate-600">
                              <span className="font-bold text-slate-800">
                                Lời giải:
                              </span>{" "}
                              <FuriganaText text={q.explanation} />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
