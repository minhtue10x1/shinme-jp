"use client";

import React, { useState, useSyncExternalStore } from "react";
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
  readTests,
  getTestsServerSnapshot,
  subscribeTests,
  saveTest,
  deleteTest,
  readAttempts,
  getAttemptsServerSnapshot,
  subscribeAttempts,
  type JLPTTest,
} from "@/lib/test-center-store";

export default function SenseiTestManagePage() {
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

  const [expandedTestId, setExpandedTestId] = useState<string | null>(
    "n3-mock-test-01"
  );

  const handleToggleShuffle = (test: JLPTTest) => {
    const updated: JLPTTest = {
      ...test,
      shuffleQuestions: !test.shuffleQuestions,
    };
    saveTest(updated);
    toast.success(
      updated.shuffleQuestions
        ? `Đã bật trộn câu hỏi ngẫu nhiên cho "${test.code}"`
        : `Đã tắt trộn câu hỏi ngẫu nhiên cho "${test.code}"`
    );
  };

  const handleDuplicate = (test: JLPTTest) => {
    const copy: JLPTTest = {
      ...test,
      id: `${test.id}-copy-${Date.now().toString(36)}`,
      code: `${test.code}-COPY`,
      title: `${test.title} (Bản sao)`,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    saveTest(copy);
    toast.success(`Đã nhân bản đề thi "${test.code}"`);
  };

  const handleDelete = (test: JLPTTest) => {
    if (tests.length <= 1) {
      toast.error("Cần giữ lại ít nhất 1 đề thi trong hệ thống.");
      return;
    }
    deleteTest(test.id);
    toast.info(`Đã xóa đề thi "${test.title}"`);
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
            Kiểm tra cấu trúc câu hỏi, đáp án, lời giải Furigana và cấu hình trộn đề cho từng lớp học.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/portal/gradebook"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            <BarChart3 className="h-4 w-4 text-[#135E36]" />
            Mở Sổ điểm & Phân tích câu sai
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

      {/* Test List */}
      <div className="space-y-4">
        {tests.map((test) => {
          const isExpanded = expandedTestId === test.id;
          const testAttempts = attempts.filter((a) => a.testId === test.id);
          const passCount = testAttempts.filter((a) => a.passed).length;

          return (
            <div
              key={test.id}
              className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm"
            >
              <div className="flex flex-col justify-between gap-4 p-6 lg:flex-row lg:items-center">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg bg-[#135E36] px-2.5 py-0.5 font-mono text-xs font-bold text-white">
                      {test.code}
                    </span>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-[#135E36]">
                      {test.className}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                      <Clock className="h-3.5 w-3.5" />
                      {test.durationMinutes} phút · Điểm đạt: {test.passScore}/
                      {test.totalPoints}
                    </span>
                  </div>

                  <h2 className="text-lg font-extrabold text-slate-900">
                    {test.title}
                  </h2>
                  <p className="font-jp text-sm font-semibold text-[#135E36]">
                    <FuriganaText text={test.titleJa} />
                  </p>

                  <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-600">
                    <span>
                      Tổng số câu: <strong>{test.questions.length} câu</strong>
                    </span>
                    <span>
                      Lượt nộp bài: <strong>{testAttempts.length} lượt</strong> (
                      {passCount} Đạt)
                    </span>
                    <span>
                      Số lần làm tối đa:{" "}
                      <strong>
                        {test.maxAttempts === 0
                          ? "Không giới hạn"
                          : `${test.maxAttempts} lần`}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleShuffle(test)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                      test.shuffleQuestions
                        ? "border-[#135E36] bg-emerald-50 text-[#135E36]"
                        : "border-slate-200 bg-slate-50 text-slate-600"
                    }`}
                  >
                    <Shuffle className="h-3.5 w-3.5" />
                    {test.shuffleQuestions ? "Đang trộn đề" : "Không trộn đề"}
                  </button>

                  <Link
                    href={`/portal/tests/${test.id}/take`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#135E36]/20 bg-[#FAF8F2] px-3 py-2 text-xs font-bold text-[#135E36] hover:bg-emerald-50"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Thi thử
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDuplicate(test)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Nhân bản
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(test)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Xóa
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setExpandedTestId(isExpanded ? null : test.id)
                    }
                    className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white"
                  >
                    {isExpanded ? (
                      <>
                        Ẩn chi tiết <ChevronUp className="h-3.5 w-3.5" />
                      </>
                    ) : (
                      <>
                        Xem {test.questions.length} câu{" "}
                        <ChevronDown className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Question List */}
              {isExpanded && (
                <div className="border-t border-slate-200 bg-[#FAF8F2] p-6">
                  <div className="space-y-3">
                    {test.questions.map((q, idx) => (
                      <div
                        key={q.id}
                        className="rounded-xl border border-slate-200/90 bg-white p-4"
                      >
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-md bg-[#135E36] px-2 py-0.5 font-mono text-xs font-bold text-white">
                              Câu {idx + 1} ({q.points}đ)
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                              {q.type === "standard" && (
                                <BookOpen className="h-3 w-3 text-[#135E36]" />
                              )}
                              {q.type === "star" && (
                                <Star className="h-3 w-3 text-amber-600" />
                              )}
                              {q.type === "dokkai" && (
                                <FileText className="h-3 w-3 text-sky-700" />
                              )}
                              {q.type === "choukai" && (
                                <Headphones className="h-3 w-3 text-purple-700" />
                              )}
                              {q.mondaiLabel}
                            </span>
                            <span className="text-xs font-semibold text-[#135E36]">
                              • {q.grammarPoint}
                            </span>
                          </div>
                          {q.type === "choukai" && (
                            <span className="rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-bold text-purple-800">
                              Giới hạn nghe:{" "}
                              {q.audioPlayLimit === 0
                                ? "Không giới hạn"
                                : `${q.audioPlayLimit} lần`}
                            </span>
                          )}
                        </div>

                        <div className="mb-3 font-jp text-sm font-bold text-slate-900">
                          <FuriganaText text={q.prompt} />
                        </div>

                        {q.type === "star" && (
                          <div className="mb-3 rounded-lg bg-amber-50/70 px-3 py-2 font-jp text-xs text-amber-950">
                            <FuriganaText text={q.starPrefix || ""} />{" "}
                            <span className="font-mono font-bold">
                              [ ___ ] [ ___ ] [ ★ ] [ ___ ]
                            </span>{" "}
                            <FuriganaText text={q.starSuffix || ""} />
                          </div>
                        )}

                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                          {q.options.map((opt, optIdx) => {
                            const isCorrect = q.correctIndex === optIdx;
                            return (
                              <div
                                key={optIdx}
                                className={`flex items-center justify-between rounded-lg border px-3 py-2 font-jp text-xs ${
                                  isCorrect
                                    ? "border-[#135E36] bg-emerald-50 font-bold text-[#135E36]"
                                    : "border-slate-200 bg-slate-50/50 text-slate-700"
                                }`}
                              >
                                <span>
                                  {["A", "B", "C", "D"][optIdx]}.{" "}
                                  <FuriganaText text={opt} />
                                </span>
                                {isCorrect && (
                                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#135E36]" />
                                )}
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-2.5 border-t border-slate-100 pt-2 text-xs text-slate-600">
                          <strong className="text-[#135E36]">Giải thích: </strong>
                          <FuriganaText text={q.explanation} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
