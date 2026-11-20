"use client";

import React, { useState, useRef } from "react";
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
import type { TestQuestion } from "@/lib/test-center-store";

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
  onImported: (result: PdfImportResult) => void;
}

const VERCEL_SAFE_MAX_BYTES = 4.2 * 1024 * 1024; // 4.2MB (Vercel Serverless body limit is 4.5MB)

export function PdfImportDialog({
  open,
  onOpenChange,
  defaultLevel = "N3",
  onImported,
}: PdfImportDialogProps) {
  const { firebaseUser } = useRole();
  const { lang } = useTranslation();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [level, setLevel] = useState<string>(defaultLevel);
  const [pageRange, setPageRange] = useState<string>("");
  const [includeChoukai, setIncludeChoukai] = useState<boolean>(false);
  const [importMode, setImportMode] = useState<"replace" | "append">("replace");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFilePick = (file: File | undefined | null) => {
    setErrorMsg(null);
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
    setSelectedFile(file);
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

    if (selectedFile.size > VERCEL_SAFE_MAX_BYTES) {
      setErrorMsg(
        lang === "vi"
          ? "File PDF vượt quá 4.2MB (giới hạn tải lên trực tiếp của Vercel). Hãy nén nhẹ PDF hoặc tách nhỏ thành từng phần (VD: Từ vựng–Ngữ pháp riêng, Đọc hiểu riêng) rồi dùng chế độ 'Thêm nối tiếp'."
          : lang === "ja"
            ? "PDFサイズが4.2MBを超えています。ファイルを圧縮するか分割して「末尾に追加」モードで取り込んでください。"
            : "PDF exceeds 4.2MB direct upload limit. Please compress or split the PDF and use Append mode."
      );
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMsg(null);

      const idToken = await firebaseUser.getIdToken();
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("level", level);
      if (pageRange.trim()) formData.append("pageRange", pageRange.trim());
      formData.append("includeChoukai", String(includeChoukai));

      const res = await fetch("/api/tests/import-pdf", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMsg(
          data?.error ||
            (lang === "vi"
              ? `Không thể đọc file PDF (HTTP ${res.status}).`
              : `Could not parse PDF (HTTP ${res.status}).`)
        );
        return;
      }

      const importedQuestions = Array.isArray(data.questions) ? (data.questions as TestQuestion[]) : [];
      if (importedQuestions.length === 0) {
        setErrorMsg(
          lang === "vi"
            ? "Không tìm thấy câu hỏi trắc nghiệm nào trong file PDF."
            : "No multiple-choice questions were found in this PDF."
        );
        return;
      }

      onImported({
        questions: importedQuestions,
        suggestedTitle: data.suggestedTitle,
        suggestedTitleJa: data.suggestedTitleJa,
        mode: importMode,
      });

      toast.success(
        lang === "vi"
          ? `Đã bóc tách thành công ${importedQuestions.length} câu hỏi từ PDF!`
          : lang === "ja"
            ? `PDFから${importedQuestions.length}問を抽出しました！`
            : `Extracted ${importedQuestions.length} questions from PDF!`,
        {
          description:
            lang === "vi"
              ? "Sensei hãy rà soát lại đề và chọn đáp án đúng cho từng câu trước khi xuất bản."
              : lang === "ja"
                ? "公開前に各問題の内容を確認し、正解を選択してください。"
                : "Please review each question and select the correct answer before publishing.",
        }
      );

      setSelectedFile(null);
      setPageRange("");
      onOpenChange(false);
    } catch (err) {
      console.error("PDF import error:", err);
      setErrorMsg(
        err instanceof Error
          ? err.message
          : lang === "vi"
            ? "Lỗi kết nối khi gửi file PDF."
            : "Network error while uploading PDF."
      );
    } finally {
      setIsProcessing(false);
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
                  ? "Tải lên đề thi giấy bản PDF (cả file chữ lẫn ảnh scan). AI sẽ tự bóc tách từng Mondai (Trắc nghiệm, ★, Đọc hiểu) và để trống đáp án để Sensei tự rà soát & chọn."
                  : lang === "ja"
                    ? "JLPTの紙試験PDF（スキャン画像含む）をアップロードすると、AIが問題ごとに自動抽出し、講師が正解を選択できる状態にします。"
                    : "Upload a paper JLPT PDF (text or scanned). AI extracts questions by Mondai and leaves answer keys blank for Sensei to review and select."}
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
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · PDF
                    </p>
                  </div>
                </div>
                {!isProcessing && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
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
                    ? "Hỗ trợ PDF chữ & PDF scan (tối đa 4.2MB / lượt nhập)"
                    : lang === "ja"
                      ? "テキストPDF・スキャンPDF対応（最大4.2MB）"
                      : "Supports text & scanned PDFs (max 4.2MB per upload)"}
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
                {lang === "vi" ? "Khoảng trang (Tuỳ chọn)" : lang === "ja" ? "ページ範囲（任意）" : "Page Range (Optional)"}
              </label>
              <input
                type="text"
                disabled={isProcessing}
                value={pageRange}
                onChange={(e) => setPageRange(e.target.value)}
                placeholder={lang === "vi" ? "VD: 1-8 (để trống = toàn bộ)" : "e.g. 1-8 (blank = all)"}
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
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-bold text-shinme-primary">
              <Loader2 className="size-4 shrink-0 animate-spin" />
              <span>
                {lang === "vi"
                  ? "AI đang đọc đề giấy PDF và phân loại từng Mondai... (thường mất 10–25 giây)"
                  : lang === "ja"
                    ? "AIがPDFを解析し、問題ごとに分類しています...（10〜25秒ほどかかります）"
                    : "AI is reading the PDF and classifying Mondai questions... (typically 10–25s)"}
              </span>
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
