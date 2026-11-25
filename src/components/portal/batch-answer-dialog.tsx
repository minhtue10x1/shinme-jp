"use client";

import React, { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardList, Sparkles, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "@/lib/i18n/context";
import {
  EXAM_SECTION_META,
  buildQuestionNumberMap,
  inferQuestionSection,
  type ExamSectionId,
  type TestQuestion,
} from "@/lib/test-center-store";

export type BatchScope = "ALL" | ExamSectionId;

interface BatchAnswerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questions: TestQuestion[];
  defaultScope?: BatchScope;
  showSections?: boolean;
  onApply: (updates: Record<string, number>) => void;
}

type ParsedToken = {
  raw: string;
  value: number | null; // 1..4 if valid, null if invalid
  error?: string;
};

/**
 * Parses batch answer input such as:
 * - "1 2 1 4 3 2"
 * - "1, 2, 1, 4, 3, 2"
 * - "121432" (compact digits with no spaces)
 * - "1. 2\n2. 4\n3) 1" (numbered answer list)
 */
function parseBatchAnswerTokens(input: string): ParsedToken[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  // Normalize numbered prefixes like "1. 2", "1) 2", "1: 2", "Câu 1: 2" on separate lines
  const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const tokens: string[] = [];

  for (const line of lines) {
    // Check if the entire line is a single numbered answer like "12. 3" or "Câu 12: 3" or "12) 3"
    const singleNumbered = line.match(/^(?:câu\s*|q\s*)?\d+\s*[.):\-]\s*([^\s,;]+)$/i);
    if (singleNumbered) {
      tokens.push(singleNumbered[1]);
      continue;
    }

    // Split by whitespace, commas, semicolons, slashes, pipes
    const parts = line.split(/[\s,;/|]+/).filter(Boolean);
    for (const part of parts) {
      // Handle compact digit string like "123412" (only when length >= 2 and all digits)
      if (/^\d{2,}$/.test(part)) {
        for (const ch of part) {
          tokens.push(ch);
        }
      } else {
        // Strip leading numbering like "1:3" or "1)3"
        const inlineMatch = part.match(/^\d+[.):](.+)$/);
        tokens.push(inlineMatch ? inlineMatch[1] : part);
      }
    }
  }

  return tokens.map((raw) => {
    if (/^[1-4]$/.test(raw)) {
      return { raw, value: Number(raw) };
    }
    return {
      raw,
      value: null,
      error: `Giá trị "${raw}" không hợp lệ (chỉ nhận 1, 2, 3, 4)`,
    };
  });
}

export function BatchAnswerDialog({
  open,
  onOpenChange,
  questions,
  defaultScope = "ALL",
  showSections = true,
  onApply,
}: BatchAnswerDialogProps) {
  const { tr } = useTranslation();
  const [scope, setScope] = useState<BatchScope>(defaultScope);
  const [rawInput, setRawInput] = useState("");

  // Sync defaultScope whenever dialog opens
  React.useEffect(() => {
    if (open) {
      setScope(defaultScope);
    }
  }, [open, defaultScope]);

  const questionNumberMap = useMemo(() => buildQuestionNumberMap(questions), [questions]);

  const targetQuestions = useMemo(() => {
    if (!showSections || scope === "ALL") return questions;
    return questions.filter((q) => inferQuestionSection(q) === scope);
  }, [questions, scope, showSections]);

  const parsed = useMemo(() => parseBatchAnswerTokens(rawInput), [rawInput]);
  const invalidTokens = useMemo(
    () =>
      parsed
        .map((t, i) => ({ ...t, index: i + 1 }))
        .filter((t) => t.value === null),
    [parsed]
  );

  const applicableCount = Math.min(parsed.length, targetQuestions.length);
  const validApplicableCount = parsed
    .slice(0, targetQuestions.length)
    .filter((t) => t.value !== null).length;

  const handleApply = () => {
    if (invalidTokens.length > 0 || validApplicableCount === 0) return;

    const updates: Record<string, number> = {};
    for (let i = 0; i < applicableCount; i++) {
      const val = parsed[i]?.value;
      if (val !== null && val >= 1 && val <= 4) {
        updates[targetQuestions[i].id] = val - 1; // convert 1..4 to 0..3
      }
    }

    onApply(updates);
    setRawInput("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <div className="space-y-4 p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-[#135E36] text-white">
                <ClipboardList className="size-5 text-[#6CC24A]" />
              </div>
              <div>
                <DialogTitle className="text-base font-black text-slate-900">
                  {tr("Nhập đáp án hàng loạt (Batch 1–4)", "Batch Answer Key Input (1–4)", "正解を一括入力 (1〜4)")}
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-xs text-slate-600">
                  {tr(
                    'Nhập hoặc dán chuỗi đáp án từ 1 đến 4 (VD: "1 2 1 4 3 2 ..." hoặc "121432..."). Hệ thống sẽ tự động gán theo thứ tự từng câu.',
                    'Paste or type answers 1–4 (e.g. "1 2 1 4 3 2 ..."). Answers are mapped in order.',
                    '1〜4の解答を貼り付けまたは入力してください（例："1 2 1 4 3 2 ..."）。順番に自動割り当てされます。'
                  )}
                </DialogDescription>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Scope selector */}
          {showSections && (
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                {tr("Phạm vi áp dụng đáp án:", "Apply to section:", "適用範囲：")}
              </label>
              <div className="flex flex-wrap gap-2">
                {(["ALL", "goi", "bunpou_dokkai", "choukai"] as const).map((tab) => {
                  const count =
                    tab === "ALL"
                      ? questions.length
                      : questions.filter((q) => inferQuestionSection(q) === tab).length;
                  if (tab !== "ALL" && count === 0) return null;
                  const active = scope === tab;
                  const label =
                    tab === "ALL"
                      ? tr("Toàn bộ đề", "All Questions", "全問題")
                      : EXAM_SECTION_META[tab].shortLabel;
                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setScope(tab)}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-extrabold transition ${
                        active
                          ? "border-[#135E36] bg-[#135E36] text-white"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-emerald-50"
                      }`}
                    >
                      <span className="font-jp">{label}</span>
                      <span
                        className={`rounded-full px-1.5 py-0.5 font-mono text-xs ${
                          active ? "bg-white/20 text-white" : "bg-white text-slate-600"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Batch Input Textarea */}
          <div>
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-700">
                {tr(
                  `Chuỗi đáp án (${parsed.length} / ${targetQuestions.length} câu):`,
                  `Answer sequence (${parsed.length} / ${targetQuestions.length} items):`,
                  `解答シーケンス (${parsed.length} / ${targetQuestions.length}問)：`
                )}
              </label>
              {rawInput && (
                <button
                  type="button"
                  onClick={() => setRawInput("")}
                  className="text-xs font-bold text-slate-500 hover:text-rose-600"
                >
                  {tr("Xóa trắng", "Clear", "クリア")}
                </button>
              )}
            </div>
            <textarea
              rows={4}
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder={tr(
                "VD: 1 2 1 4 3 2 4 1 3 2 ... (cách nhau bằng dấu cách, phẩy, xuống dòng hoặc viết liền 121432)",
                "e.g. 1 2 1 4 3 2 4 1 3 2 ...",
                "例：1 2 1 4 3 2 4 1 3 2 ...（スペース・カンマ・改行・連続入力に対応）"
              )}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 font-mono text-sm font-bold tracking-wide text-slate-900 focus:border-[#135E36] focus:outline-none"
            />
          </div>

          {/* Validation Alerts */}
          {invalidTokens.length > 0 && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <div>
                <p className="font-extrabold">
                  {tr(
                    `Phát hiện ${invalidTokens.length} đáp án không hợp lệ (chỉ chấp nhận số 1, 2, 3, 4):`,
                    `Found ${invalidTokens.length} invalid values (only 1–4 allowed):`,
                    `無効な値が ${invalidTokens.length} 件あります（1〜4のみ有効）：`
                  )}
                </p>
                <p className="mt-0.5 font-mono text-xs">
                  {invalidTokens
                    .slice(0, 8)
                    .map((t) => `#${t.index}: "${t.raw}"`)
                    .join(" · ")}
                  {invalidTokens.length > 8 ? " ..." : ""}
                </p>
              </div>
            </div>
          )}

          {parsed.length > targetQuestions.length && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-xs font-semibold text-amber-900">
              <AlertTriangle className="size-4 shrink-0 text-amber-600" />
              <span>
                {tr(
                  `Bạn đã nhập ${parsed.length} đáp án nhưng phạm vi này chỉ có ${targetQuestions.length} câu. Các đáp án dư phía sau sẽ được bỏ qua.`,
                  `You entered ${parsed.length} answers for ${targetQuestions.length} questions. Extra answers will be ignored.`,
                  `${targetQuestions.length}問に対して ${parsed.length}個の解答が入力されています。余分な解答は無視されます。`
                )}
              </span>
            </div>
          )}

          {/* Live Mapping Preview */}
          {parsed.length > 0 && targetQuestions.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-bold text-slate-600">
                {tr("Xem trước khớp đáp án:", "Live mapping preview:", "割り当てプレビュー：")}
              </p>
              <div className="grid max-h-44 grid-cols-4 gap-1.5 overflow-y-auto rounded-xl border border-slate-200 bg-[#FAF8F2] p-2.5 sm:grid-cols-6">
                {parsed.slice(0, targetQuestions.length).map((token, idx) => {
                  const q = targetQuestions[idx];
                  const meta = questionNumberMap[q.id];
                  const qNum = showSections && meta ? meta.localNumber : idx + 1;
                  const isInvalid = token.value === null;
                  return (
                    <div
                      key={`${q.id}-${idx}`}
                      className={`flex items-center justify-between rounded-lg border px-2 py-1 font-mono text-xs font-bold ${
                        isInvalid
                          ? "border-rose-300 bg-rose-100 text-rose-800"
                          : "border-emerald-200 bg-white text-slate-800"
                      }`}
                    >
                      <span className="text-slate-500">#{qNum}</span>
                      <span className={isInvalid ? "text-rose-700" : "text-[#135E36]"}>
                        {token.raw}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
            >
              {tr("Hủy", "Cancel", "キャンセル")}
            </button>
            <button
              type="button"
              disabled={invalidTokens.length > 0 || validApplicableCount === 0}
              onClick={handleApply}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#135E36] px-5 py-2 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#0f4a2a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {validApplicableCount > 0 ? (
                <CheckCircle2 className="size-4 text-[#6CC24A]" />
              ) : (
                <Sparkles className="size-4 text-[#6CC24A]" />
              )}
              {tr(
                `Áp dụng ${validApplicableCount} đáp án`,
                `Apply ${validApplicableCount} Answers`,
                `${validApplicableCount}問の解答を適用`
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
