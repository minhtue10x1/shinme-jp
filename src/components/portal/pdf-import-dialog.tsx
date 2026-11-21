"use client";

import React, { useState, useRef } from "react";
import { PDFDocument } from "pdf-lib";
import {
  FileUp,
  FileText,
  Sparkles,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useRole } from "@/lib/role-context";
import { useTranslation } from "@/lib/i18n/context";
import { buildQuestionNumberMap, type TestQuestion } from "@/lib/test-center-store";

type PdfImportResult = {
  questions: TestQuestion[];
  suggestedTitle?: string;
  suggestedTitleJa?: string;
  mode: "replace" | "append";
};

interface PdfImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultLevel?: string;
  modeType?: "jlpt" | "assignment";
  onImported: (result: PdfImportResult) => void;
}

const PAGES_PER_CHUNK = 3; // Small 3-page slices avoid Vercel 4.5MB limit & reduce Gemini 503/timeouts
const MAX_RAW_PDF_BYTES = 30 * 1024 * 1024; // Up to 30MB raw PDF supported thanks to client-side slicing

/**
 * Parses a page range string like "1-3, 5, 8-10" into sorted 0-based page indices.
 * If blank, returns all pages [0 .. totalPages - 1].
 */
function parsePageIndices(rangeStr: string, totalPages: number): number[] {
  const cleaned = rangeStr.trim();
  if (!cleaned) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  const set = new Set<number>();
  const parts = cleaned.split(",");
  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const dashMatch = trimmed.match(/^(\d+)\s*-\s*(\d+)$/);
    if (dashMatch) {
      const start = Math.max(1, parseInt(dashMatch[1], 10));
      const end = Math.min(totalPages, parseInt(dashMatch[2], 10));
      for (let p = start; p <= end; p++) {
        set.add(p - 1);
      }
    } else if (/^\d+$/.test(trimmed)) {
      const p = parseInt(trimmed, 10);
      if (p >= 1 && p <= totalPages) set.add(p - 1);
    }
  }

  return Array.from(set).sort((a, b) => a - b);
}

export function PdfImportDialog({
  open,
  onOpenChange,
  defaultLevel = "N3",
  modeType = "jlpt",
  onImported,
}: PdfImportDialogProps) {
  const { firebaseUser } = useRole();
  const { lang } = useTranslation();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [level, setLevel] = useState<string>(defaultLevel);
  const [pageRange, setPageRange] = useState<string>("");
  const [includeChoukai, setIncludeChoukai] = useState<boolean>(false);
  const [importMode, setImportMode] = useState<"replace" | "append">("replace");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressText, setProgressText] = useState<string>("");
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFilePick = async (file: File | undefined | null) => {
    setErrorMsg(null);
    setTotalPages(null);
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMsg(
        lang === "vi"
          ? "Vui lòng chọn tệp định dạng PDF (.pdf)."
          : lang === "ja"
            ? "PDFファイル（.pdf）を選択してください。"
            : "Please select a valid PDF file (.pdf)."
      );
      return;
    }

    if (file.size > MAX_RAW_PDF_BYTES) {
      setErrorMsg(
        lang === "vi"
          ? "File PDF vượt quá 30MB. Vui lòng nén nhẹ file trước khi tải lên."
          : "PDF file exceeds 30MB limit."
      );
      return;
    }

    setSelectedFile(file);
    try {
      const buf = await file.arrayBuffer();
      const doc = await PDFDocument.load(buf, { ignoreEncryption: true });
      setTotalPages(doc.getPageCount());
    } catch {
      setTotalPages(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    if (!firebaseUser) {
      toast.error(
        lang === "vi"
          ? "Vui lòng đăng nhập tài khoản Sensei/Admin để sử dụng tính năng này."
          : "Please sign in as Sensei/Admin to use PDF import."
      );
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMsg(null);
      setProgressPercent(5);
      setProgressText(
        lang === "vi"
          ? "Đang phân tích & cắt nhỏ các trang PDF..."
          : lang === "ja"
            ? "PDFページを分割しています..."
            : "Analyzing & splitting PDF pages..."
      );

      const rawBuffer = await selectedFile.arrayBuffer();
      const srcPdf = await PDFDocument.load(rawBuffer, { ignoreEncryption: true });
      const docPageCount = srcPdf.getPageCount();
      const targetIndices = parsePageIndices(pageRange, docPageCount);

      if (targetIndices.length === 0) {
        setErrorMsg(
          lang === "vi"
            ? `Khoảng trang không hợp lệ (file PDF có tổng cộng ${docPageCount} trang).`
            : `Invalid page range (PDF has ${docPageCount} pages).`
        );
        return;
      }

      // Build 3-page chunks
      const chunks: number[][] = [];
      for (let i = 0; i < targetIndices.length; i += PAGES_PER_CHUNK) {
        chunks.push(targetIndices.slice(i, i + PAGES_PER_CHUNK));
      }

      const idToken = await firebaseUser.getIdToken();
      const allExtracted: TestQuestion[] = [];
      let suggestedTitle = "";
      let suggestedTitleJa = "";
      const failedChunkLabels: string[] = [];
      let lastChunkError = "";
      const passageTextToGroupId = new Map<string, string>();
      const MAX_CHUNK_UPLOAD_BYTES = Math.floor(3.8 * 1024 * 1024); // Stay safely under Vercel's 4.5MB body limit

      const mergeExtractedQuestions = (rawList: TestQuestion[], scopeTag: string) => {
        const chunkQuestions = rawList.map((q) => {
          if (q.type !== "dokkai") return q;
          const normText = (q.passageText || "").replace(/\s+/g, "").slice(0, 120);
          if (normText.length >= 24) {
            const existingGid = passageTextToGroupId.get(normText);
            if (existingGid) {
              return { ...q, passageGroupId: existingGid };
            }
            const scopedGid = q.passageGroupId
              ? `${scopeTag}-${q.passageGroupId}`
              : `${scopeTag}-dokkai-${q.id}`;
            passageTextToGroupId.set(normText, scopedGid);
            return { ...q, passageGroupId: scopedGid };
          }
          const scopedGid = q.passageGroupId
            ? q.passageGroupId === "info-retrieval"
              ? "info-retrieval-37-38"
              : `${scopeTag}-${q.passageGroupId}`
            : `${scopeTag}-dokkai-${q.id}`;
          return { ...q, passageGroupId: scopedGid };
        });
        allExtracted.push(...chunkQuestions);
      };

      const sendSlice = async (
        sliceIndices: number[],
        scopeTag: string
      ): Promise<{ ok: boolean; error?: string; oversized?: boolean }> => {
        const firstP = sliceIndices[0] + 1;
        const lastP = sliceIndices[sliceIndices.length - 1] + 1;
        const sliceLabel = firstP === lastP ? `Trang ${firstP}` : `Trang ${firstP}-${lastP}`;

        const chunkPdf = await PDFDocument.create();
        const copiedPages = await chunkPdf.copyPages(srcPdf, sliceIndices);
        for (const p of copiedPages) {
          chunkPdf.addPage(p);
        }
        const chunkBytes = await chunkPdf.save();

        // If a multi-page slice exceeds Vercel's ~4.5MB serverless limit, immediately split into 1-page slices
        if (sliceIndices.length > 1 && chunkBytes.byteLength > MAX_CHUNK_UPLOAD_BYTES) {
          return {
            ok: false,
            oversized: true,
            error: `Cụm ${sliceLabel} nặng ${(chunkBytes.byteLength / (1024 * 1024)).toFixed(1)}MB (> 3.8MB)`,
          };
        }

        const chunkBlob = new Blob([new Uint8Array(chunkBytes)], { type: "application/pdf" });
        const chunkFile = new File([chunkBlob], `chunk_${firstP}_${lastP}.pdf`, {
          type: "application/pdf",
        });

        const formData = new FormData();
        formData.append("file", chunkFile);
        formData.append("mode", modeType);
        formData.append("level", level);
        formData.append("chunkLabel", sliceLabel);
        formData.append("includeChoukai", String(includeChoukai));

        try {
          const res = await fetch("/api/tests/import-pdf", {
            method: "POST",
            headers: { Authorization: `Bearer ${idToken}` },
            body: formData,
          });

          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            return {
              ok: false,
              error: data?.error || (res.status === 413 ? "File cụm trang quá nặng (413)" : `HTTP ${res.status}`),
            };
          }

          if (!suggestedTitle && data.suggestedTitle) suggestedTitle = data.suggestedTitle;
          if (!suggestedTitleJa && data.suggestedTitleJa) suggestedTitleJa = data.suggestedTitleJa;

          if (Array.isArray(data.questions) && data.questions.length > 0) {
            mergeExtractedQuestions(data.questions as TestQuestion[], scopeTag);
          }

          return { ok: true };
        } catch (fetchErr) {
          return {
            ok: false,
            error: fetchErr instanceof Error ? fetchErr.message : "Network error",
          };
        }
      };

      for (let cIdx = 0; cIdx < chunks.length; cIdx++) {
        const indices = chunks[cIdx];
        const firstPageNum = indices[0] + 1;
        const lastPageNum = indices[indices.length - 1] + 1;
        const label =
          firstPageNum === lastPageNum
            ? `Trang ${firstPageNum}`
            : `Trang ${firstPageNum}-${lastPageNum}`;

        setProgressPercent(Math.round(((cIdx + 0.3) / chunks.length) * 100));
        setProgressText(
          lang === "vi"
            ? `Đang bóc cụm ${cIdx + 1}/${chunks.length} (${label}) · Đã thu được ${allExtracted.length} câu...`
            : lang === "ja"
              ? `バッチ ${cIdx + 1}/${chunks.length} (${label}) を解析中 · 抽出済み ${allExtracted.length}問...`
              : `Extracting batch ${cIdx + 1}/${chunks.length} (${label}) · ${allExtracted.length} questions so far...`
        );

        const result = await sendSlice(indices, `c${cIdx + 1}`);

        if (!result.ok) {
          // Auto-fallback: if a multi-page slice fails (e.g. heavy cover page, dense Goi pages, or 502/413/timeout),
          // automatically split and retry page-by-page so we don't drop all 3 pages!
          if (indices.length > 1) {
            for (let pPos = 0; pPos < indices.length; pPos++) {
              const singlePageIdx = indices[pPos];
              const singleLabel = `Trang ${singlePageIdx + 1}`;
              setProgressText(
                lang === "vi"
                  ? `Cụm ${label} quá dày/nặng — đang tự tách bóc lẻ ${singleLabel} (${pPos + 1}/${indices.length}) · Đã thu ${allExtracted.length} câu...`
                  : `Retrying ${singleLabel} individually (${pPos + 1}/${indices.length}) · ${allExtracted.length} questions so far...`
              );
              const singleRes = await sendSlice([singlePageIdx], `c${cIdx + 1}p${pPos + 1}`);
              if (!singleRes.ok) {
                failedChunkLabels.push(singleLabel);
                lastChunkError = singleRes.error || result.error || "Unknown error";
              }
            }
          } else {
            failedChunkLabels.push(label);
            lastChunkError = result.error || "Unknown error";
          }
        }

        setProgressPercent(Math.round(((cIdx + 1) / chunks.length) * 100));
      }

      if (allExtracted.length === 0) {
        setErrorMsg(
          lastChunkError ||
            (lang === "vi"
              ? "Không trích xuất được câu hỏi trắc nghiệm nào từ các trang đã chọn."
              : "No multiple-choice questions could be extracted from the selected pages.")
        );
        return;
      }

      // Automatically group Q37-38 (and any 情報検索 questions) into one shared Dokkai cluster
      // so Sensei only needs to upload/paste the poster image ONCE for both questions.
      if (modeType === "jlpt") {
        const numMap = buildQuestionNumberMap(allExtracted);
        for (let i = 0; i < allExtracted.length; i++) {
          const q = allExtracted[i];
          const meta = numMap[q.id];
          const isDefault3738 =
            meta?.section === "bunpou_dokkai" &&
            (meta.localNumber === 37 || meta.localNumber === 38);
          const isInfoRetrieval =
            q.passageGroupId === "info-retrieval-37-38" ||
            /情報検索/.test(q.mondaiLabel || "") ||
            /情報検索/.test(q.passageTitle || "") ||
            /情報検索/.test(q.passageText || "");

          if (isDefault3738 || isInfoRetrieval) {
            allExtracted[i] = {
              ...q,
              type: "dokkai",
              section: "bunpou_dokkai",
              passageGroupId: "info-retrieval-37-38",
              passageTitle:
                q.passageTitle || "情報検索 (Tìm kiếm thông tin — Câu 37–38)",
            };
          }
        }
      }

      onImported({
        questions: allExtracted,
        suggestedTitle,
        suggestedTitleJa,
        mode: importMode,
      });

      if (failedChunkLabels.length > 0) {
        toast.warning(
          lang === "vi"
            ? `Đã bóc được ${allExtracted.length} câu, nhưng có phần bị lỗi: ${failedChunkLabels.join(", ")}`
            : `Extracted ${allExtracted.length} questions, but some slices failed: ${failedChunkLabels.join(", ")}`,
          {
            description:
              lang === "vi"
                ? `Bạn có thể nhập lại riêng các trang bị lỗi bằng chế độ "Thêm nối tiếp". (${lastChunkError})`
                : `You can re-import failed pages using Append mode. (${lastChunkError})`,
          }
        );
      } else {
        toast.success(
          lang === "vi"
            ? `Đã bóc tách thành công ${allExtracted.length} câu hỏi từ PDF!`
            : lang === "ja"
              ? `PDFから${allExtracted.length}問を抽出しました！`
              : `Extracted ${allExtracted.length} questions from PDF!`,
          {
            description:
              lang === "vi"
                ? "Sensei hãy rà soát lại đề và chọn đáp án đúng cho từng câu trước khi xuất bản."
                : lang === "ja"
                  ? "公開前に各問題の内容を確認し、正解を選択してください。"
                  : "Please review each question and select the correct answer before publishing.",
          }
        );
      }

      setSelectedFile(null);
      setTotalPages(null);
      setPageRange("");
      onOpenChange(false);
    } catch (err) {
      console.error("PDF import error:", err);
      setErrorMsg(
        err instanceof Error
          ? err.message
          : lang === "vi"
            ? "Lỗi khi xử lý file PDF."
            : "Error while processing PDF."
      );
    } finally {
      setIsProcessing(false);
      setProgressText("");
      setProgressPercent(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !isProcessing && onOpenChange(next)}>
      <DialogContent className="max-w-xl">
        <div className="space-y-5 p-6">
          <div className="flex items-start gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-shinme-primary text-white">
              <Sparkles className="size-5 text-shinme-accent" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-shinme-ink">
                {lang === "vi"
                  ? "Nhập đề thi JLPT từ file PDF (AI)"
                  : lang === "ja"
                    ? "PDFファイルからJLPT問題を取り込む (AI)"
                    : "Import JLPT Exam from PDF (AI)"}
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs leading-relaxed text-shinme-muted">
                {lang === "vi"
                  ? "Tự động cắt PDF thành từng cụm 3 trang để bóc nhanh, chống quá tải và hỗ trợ đề dài tới 30MB. Đáp án được để trống để Sensei tự rà soát & chọn."
                  : lang === "ja"
                    ? "PDFを3ページずつ自動分割して高速抽出します（最大30MB対応）。正解は講師が確認して選択できます。"
                    : "Automatically slices PDF into 3-page batches for fast, reliable extraction (up to 30MB). Answer keys are left blank for Sensei to review."}
              </DialogDescription>
            </div>
          </div>

          {/* Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (!isProcessing) handleFilePick(e.dataTransfer.files?.[0]);
            }}
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className="cursor-pointer rounded-2xl border-2 border-dashed border-shinme-border bg-shinme-bg/60 p-6 text-center transition hover:border-shinme-primary hover:bg-shinme-leaf/30"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              disabled={isProcessing}
              onChange={(e) => handleFilePick(e.target.files?.[0])}
              className="hidden"
            />
            {selectedFile ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-shinme-border bg-white p-3 text-left">
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="size-8 shrink-0 text-shinme-primary" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-shinme-ink">{selectedFile.name}</p>
                    <p className="text-xs text-shinme-muted">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      {totalPages !== null ? ` · ${totalPages} trang PDF` : " · PDF"}
                    </p>
                  </div>
                </div>
                {!isProcessing && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      setTotalPages(null);
                      setErrorMsg(null);
                    }}
                    className="rounded-lg p-1.5 text-shinme-muted hover:bg-slate-100 hover:text-shinme-ink"
                    aria-label="Remove file"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <FileUp className="mx-auto size-8 text-shinme-primary" />
                <p className="text-sm font-bold text-shinme-ink">
                  {lang === "vi"
                    ? "Kéo thả file PDF đề thi vào đây hoặc bấm để chọn"
                    : lang === "ja"
                      ? "PDFファイルをここにドラッグ＆ドロップ、またはクリックして選択"
                      : "Drag & drop your JLPT PDF here or click to browse"}
                </p>
                <p className="text-xs text-shinme-muted">
                  {lang === "vi"
                    ? "Hỗ trợ PDF chữ & PDF scan (tối đa 30MB · tự động cắt 3 trang/cụm)"
                    : lang === "ja"
                      ? "テキストPDF・スキャンPDF対応（最大30MB・3ページごとに自動分割）"
                      : "Supports text & scanned PDFs (up to 30MB · auto-sliced 3 pages/batch)"}
                </p>
              </div>
            )}
          </div>

          {/* Options */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-shinme-ink">
                {lang === "vi" ? "Cấp độ đề thi (Gợi ý cho AI)" : lang === "ja" ? "対象レベル" : "JLPT Level Hint"}
              </label>
              <select
                value={level}
                disabled={isProcessing}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full rounded-xl border border-shinme-border bg-white px-3 py-2 text-xs font-bold text-shinme-ink focus:border-shinme-primary focus:outline-none"
              >
                <option value="N5">JLPT N5</option>
                <option value="N4">JLPT N4</option>
                <option value="N3">JLPT N3</option>
                <option value="N2">JLPT N2</option>
                <option value="N1">JLPT N1</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-shinme-ink">
                {lang === "vi" ? "Khoảng trang (Cắt trang thật)" : lang === "ja" ? "ページ範囲（任意）" : "Page Range (Optional)"}
              </label>
              <input
                type="text"
                disabled={isProcessing}
                value={pageRange}
                onChange={(e) => setPageRange(e.target.value)}
                placeholder={lang === "vi" ? "VD: 1-6 hoặc 2-4, 7-9 (trống = tất cả)" : "e.g. 1-6 or 2-4, 7-9"}
                className="w-full rounded-xl border border-shinme-border bg-white px-3 py-2 text-xs font-medium text-shinme-ink focus:border-shinme-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-shinme-line bg-shinme-bg/50 p-3.5">
            <div className="flex flex-wrap gap-4 text-xs font-bold text-shinme-ink">
              <label className="inline-flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="import-mode"
                  disabled={isProcessing}
                  checked={importMode === "replace"}
                  onChange={() => setImportMode("replace")}
                  className="accent-shinme-primary"
                />
                <span>
                  {lang === "vi"
                    ? "Thay thế danh sách câu hỏi hiện tại"
                    : lang === "ja"
                      ? "現在の問題を置き換える"
                      : "Replace current questions"}
                </span>
              </label>
              <label className="inline-flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="import-mode"
                  disabled={isProcessing}
                  checked={importMode === "append"}
                  onChange={() => setImportMode("append")}
                  className="accent-shinme-primary"
                />
                <span>
                  {lang === "vi"
                    ? "Thêm nối tiếp vào cuối đề"
                    : lang === "ja"
                      ? "末尾に追加する"
                      : "Append to existing exam"}
                </span>
              </label>
            </div>

            <label className="flex cursor-pointer items-center gap-2 pt-1 text-xs text-shinme-muted">
              <input
                type="checkbox"
                disabled={isProcessing}
                checked={includeChoukai}
                onChange={(e) => setIncludeChoukai(e.target.checked)}
                className="accent-shinme-primary"
              />
              <span>
                {lang === "vi"
                  ? "Bóc thêm khung câu hỏi Nghe hiểu (Choukai) nếu PDF có"
                  : lang === "ja"
                    ? "聴解（Choukai）セクションも含める"
                    : "Also extract Listening (Choukai) question shells if present"}
              </span>
            </label>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isProcessing && (
            <div className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-bold text-shinme-primary">
              <div className="flex items-center gap-2.5">
                <Loader2 className="size-4 shrink-0 animate-spin" />
                <span>{progressText || "Đang xử lý PDF..."}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-emerald-200/70">
                <div
                  className="h-full rounded-full bg-shinme-primary transition-all duration-300"
                  style={{ width: `${Math.max(8, progressPercent)}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-shinme-line pt-3">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => onOpenChange(false)}
              className="rounded-xl border border-shinme-border bg-white px-4 py-2 text-xs font-bold text-shinme-ink-soft hover:bg-slate-50 disabled:opacity-50"
            >
              {lang === "vi" ? "Hủy" : lang === "ja" ? "キャンセル" : "Cancel"}
            </button>
            <button
              type="button"
              disabled={!selectedFile || isProcessing}
              onClick={handleImport}
              className="inline-flex items-center gap-2 rounded-xl bg-shinme-primary px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-shinme-primary-deep disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {lang === "vi" ? "Đang bóc tách..." : lang === "ja" ? "抽出中..." : "Extracting..."}
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4 text-shinme-accent" />
                  {lang === "vi" ? "Bắt đầu bóc đề PDF" : lang === "ja" ? "PDFから問題を作成" : "Extract Questions"}
                </>
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
