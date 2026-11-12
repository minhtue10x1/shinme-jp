"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Download,
  FileAudio,
  FileSpreadsheet,
  FileText,
  Headphones,
  Presentation,
  Search,
  Upload,
  Plus,
  Trash2,
  ExternalLink,
  BookOpen,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  Link as LinkIcon,
} from "lucide-react";
import { FuriganaText } from "@/components/furigana-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ChokaiAudioPlayer } from "@/components/portal/chokai-audio-player";
import { useRole } from "@/lib/role-context";
import { isSafeHttpUrl } from "@/lib/utils";
import {
  getClasses,
  getMaterials,
  saveMaterialDoc,
  deleteMaterialDoc,
  uploadMaterialFile,
} from "@/lib/db/services";
import type { ClassDoc, MaterialDoc } from "@/lib/db/schema";
import { toast } from "sonner";

const CATEGORIES = [
  "Tất cả danh mục",
  "Giáo trình chính",
  "Kanji & Từ vựng",
  "Nghe hiểu Chokai",
  "Ngữ pháp & Đề thi",
  "Tài liệu bổ trợ",
] as const;

export default function MaterialsPage() {
  const { role, user } = useRole();

  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [materials, setMaterials] = useState<MaterialDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedClassId, setSelectedClassId] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("Tất cả danh mục");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal Upload State
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    titleJa: "",
    classId: "ALL",
    format: "PDF" as MaterialDoc["format"],
    category: "Giáo trình chính" as MaterialDoc["category"],
    lesson: "Bài 1",
    externalUrl: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [classList, materialList] = await Promise.all([
        getClasses(),
        getMaterials(),
      ]);
      setClasses(classList);
      setMaterials(materialList);
    } catch (err) {
      console.error("Load materials error:", err);
      toast.error("Không thể tải danh sách tài liệu từ hệ thống.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Materials
  const filteredMaterials = useMemo(() => {
    return materials.filter((m) => {
      // Filter by Class
      if (selectedClassId !== "ALL" && m.classId !== "ALL" && m.classId !== selectedClassId) {
        return false;
      }
      // Filter by Category
      if (selectedCategory !== "Tất cả danh mục" && m.category !== selectedCategory) {
        return false;
      }
      // Filter by Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = m.title.toLowerCase().includes(q);
        const matchLesson = m.lesson.toLowerCase().includes(q);
        const matchJa = m.titleJa ? m.titleJa.toLowerCase().includes(q) : false;
        if (!matchTitle && !matchLesson && !matchJa) return false;
      }
      return true;
    });
  }, [materials, selectedClassId, selectedCategory, searchQuery]);

  const getIcon = (format: string) => {
    switch (format) {
      case "PDF":
        return <FileText className="size-5 text-red-600" />;
      case "Audio":
        return <FileAudio className="size-5 text-amber-600" />;
      case "Slide":
        return <Presentation className="size-5 text-blue-600" />;
      default:
        return <FileSpreadsheet className="size-5 text-green-600" />;
    }
  };

  const handleOpenUploadModal = () => {
    setSelectedFile(null);
    setUploadPercent(0);
    setFormData({
      title: "",
      titleJa: "",
      classId: classes[0]?.id || "ALL",
      format: "PDF",
      category: "Giáo trình chính",
      lesson: "Bài 1",
      externalUrl: "",
    });
    setIsUploadOpen(true);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Vui lòng nhập tiêu đề tài liệu!");
      return;
    }

    if (!selectedFile && !formData.externalUrl.trim()) {
      toast.error("Vui lòng chọn 1 file để tải lên hoặc dán link tài liệu trực tiếp!");
      return;
    }

    if (!selectedFile && !isSafeHttpUrl(formData.externalUrl)) {
      toast.error("Link tài liệu phải bắt đầu bằng https:// hoặc http://");
      return;
    }

    try {
      setIsUploading(true);
      setUploadPercent(10);

      let fileUrl = formData.externalUrl.trim();
      let fileName = selectedFile ? selectedFile.name : "Tài liệu trực tuyến";
      let sizeFormatted = "Google Drive / Link";

      // Upload file to Firebase Storage if file was provided
      if (selectedFile) {
        const res = await uploadMaterialFile(
          selectedFile,
          `materials/${formData.classId}`,
          (percent) => setUploadPercent(percent)
        );
        fileUrl = res.url;
        sizeFormatted = res.sizeFormatted;
      }

      const chosenClass = classes.find((c) => c.id === formData.classId);
      const className = formData.classId === "ALL" ? "Toàn bộ học viên" : chosenClass?.name || "Lớp học";

      const payload: MaterialDoc = {
        id: `mat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        title: formData.title.trim(),
        titleJa: formData.titleJa.trim() || undefined,
        classId: formData.classId,
        className,
        format: formData.format,
        category: formData.category,
        lesson: formData.lesson.trim(),
        fileUrl,
        fileName,
        size: sizeFormatted,
        uploadedBy: user.name || "Sensei Shinme",
        createdAt: new Date().toISOString(),
      };

      await saveMaterialDoc(payload);
      toast.success("Tải lên và lưu tài liệu thành công!");
      setIsUploadOpen(false);
      await loadData();
    } catch (err) {
      console.error("Upload material error:", err);
      toast.error("Không thể tải lên tài liệu. Vui lòng thử lại!");
    } finally {
      setIsUploading(false);
      setUploadPercent(0);
    }
  };

  const handleDeleteMaterial = async (m: MaterialDoc) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa tài liệu "${m.title}"?`)) return;
    try {
      await deleteMaterialDoc(m.id, m.fileUrl);
      toast.success(`Đã xóa tài liệu ${m.title}`);
      await loadData();
    } catch (err) {
      console.error("Delete material error:", err);
      toast.error("Không thể xóa tài liệu.");
    }
  };

  return (
    <div className="space-y-6 animate-[rise-in_260ms_var(--ease-out-expo)_both]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-shinme-line pb-5">
        <div>
          <h1 className="text-2xl font-black text-shinme-ink sm:text-3xl">Kho học liệu & Giáo trình</h1>
          <p className="mt-1 text-sm font-semibold text-shinme-muted">
            Tài liệu số hóa, slide giảng dạy, bảng từ vựng và audio chokai dành cho các lớp học
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone="leaf">{materials.length} Tài liệu</Badge>
          {role !== "student" && (
            <Button size="sm" onClick={handleOpenUploadModal}>
              <Upload className="size-4" /> Tải lên tài liệu mới
            </Button>
          )}
        </div>
      </div>

      {/* Interactive Chokai Player Banner */}
      <ChokaiAudioPlayer />

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-shinme-border bg-shinme-surface p-4 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Class Filter */}
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-shinme-ink focus:border-shinme-primary focus:outline-none"
          >
            <option value="ALL">Tất cả lớp học</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                Lớp: {cls.shortName} ({cls.level})
              </option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-shinme-ink focus:border-shinme-primary focus:outline-none"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Search Input */}
        <div className="relative min-w-[14rem] flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-shinme-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tiêu đề, bài học..."
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-xs font-medium text-shinme-ink placeholder:text-shinme-muted focus:border-shinme-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Materials List / Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 rounded-2xl border border-shinme-border bg-shinme-surface/60 p-5 animate-pulse" />
          ))}
        </div>
      ) : filteredMaterials.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-shinme-border bg-shinme-surface p-12 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-shinme-leaf text-shinme-primary">
            <BookOpen className="size-8" />
          </div>
          <h3 className="mt-4 text-lg font-black text-shinme-ink">Chưa có tài liệu nào</h3>
          <p className="mt-1 text-sm text-shinme-muted">
            {searchQuery || selectedClassId !== "ALL" || selectedCategory !== "Tất cả danh mục"
              ? "Không có tài liệu nào phù hợp với bộ lọc hiện tại."
              : "Lớp học chưa có học liệu số hóa được tải lên."}
          </p>
          {role !== "student" && (
            <Button className="mt-5" onClick={handleOpenUploadModal}>
              <Upload className="size-4" /> Tải lên tài liệu đầu tiên
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredMaterials.map((m) => (
            <div
              key={m.id}
              className="flex flex-col justify-between rounded-2xl border border-shinme-border bg-shinme-surface p-5 shadow-[var(--shadow-card)] transition-[border-color,box-shadow] hover:border-shinme-primary/40 hover:shadow-[var(--shadow-lift)]"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 rounded-lg bg-shinme-bg p-2">
                    {getIcon(m.format)}
                    <span className="text-xs font-black text-shinme-ink">{m.format}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-shinme-muted">
                      {m.classId === "ALL" ? "Chung" : m.className.split(" ")[0]}
                    </span>
                    <Badge tone="leaf">{m.category}</Badge>
                  </div>
                </div>

                <h3 className="mt-3 text-base font-black text-shinme-ink">{m.title}</h3>
                {m.titleJa && (
                  <FuriganaText text={m.titleJa} className="mt-0.5 block text-xs font-bold text-shinme-primary" />
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-shinme-muted">
                  <span className="font-bold text-shinme-primary">{m.lesson}</span>
                  <span>·</span>
                  <span className="tabular">{m.size}</span>
                  <span>·</span>
                  <span>Sensei: {m.uploadedBy}</span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-shinme-line pt-3">
                <a
                  href={isSafeHttpUrl(m.fileUrl) ? m.fileUrl : "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => {
                    if (!isSafeHttpUrl(m.fileUrl)) {
                      e.preventDefault();
                      toast.error("Đường dẫn tài liệu không hợp lệ.");
                    }
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-shinme-primary hover:underline"
                >
                  <Download className="size-3.5" />
                  Mở / Tải về máy
                  <ExternalLink className="size-3 opacity-70" />
                </a>

                {role !== "student" && (
                  <button
                    type="button"
                    onClick={() => handleDeleteMaterial(m)}
                    className="rounded-lg p-1.5 text-xs text-rose-600 hover:bg-rose-50"
                    title="Xóa tài liệu này"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =====================================================================
       * MODAL: UPLOAD NEW MATERIAL (SENSEI & ADMIN)
       * ===================================================================== */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-xl">
          <DialogTitle className="flex items-center gap-2 text-lg font-black text-shinme-ink">
            <Upload className="size-5 text-shinme-primary" />
            Tải lên tài liệu lớp học
          </DialogTitle>
          <DialogDescription className="text-xs text-shinme-muted">
            Thêm tài liệu mới hoặc chia sẻ link tài liệu cho học viên theo từng lớp học
          </DialogDescription>

          <form onSubmit={handleUploadSubmit} className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold text-shinme-ink">Tiêu đề tài liệu *</label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Giáo trình Soumatome N3 — Ngữ pháp Tuần 1-4"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 focus:border-shinme-primary focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-shinme-ink">Lớp học áp dụng *</label>
                <select
                  value={formData.classId}
                  onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 focus:border-shinme-primary focus:outline-none"
                >
                  <option value="ALL">Toàn bộ trung tâm (Chung)</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.shortName} ({cls.level})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-shinme-ink">Danh mục học liệu *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as MaterialDoc["category"] })}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 focus:border-shinme-primary focus:outline-none"
                >
                  <option value="Giáo trình chính">Giáo trình chính</option>
                  <option value="Kanji & Từ vựng">Kanji & Từ vựng</option>
                  <option value="Nghe hiểu Chokai">Nghe hiểu Chokai</option>
                  <option value="Ngữ pháp & Đề thi">Ngữ pháp & Đề thi</option>
                  <option value="Tài liệu bổ trợ">Tài liệu bổ trợ</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-shinme-ink">Định dạng file</label>
                <select
                  value={formData.format}
                  onChange={(e) => setFormData({ ...formData, format: e.target.value as MaterialDoc["format"] })}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 focus:border-shinme-primary focus:outline-none"
                >
                  <option value="PDF">Tài liệu PDF</option>
                  <option value="Audio">Audio / MP3 (Chokai)</option>
                  <option value="Slide">Bài giảng Slide / PPTX</option>
                  <option value="Doc">Văn bản Docx / Excel</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-shinme-ink">Bài học tương ứng</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Bài 26 hoặc Tuần 2"
                  value={formData.lesson}
                  onChange={(e) => setFormData({ ...formData, lesson: e.target.value })}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 focus:border-shinme-primary focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-shinme-ink">
                Tiêu đề tiếng Nhật / Furigana (tùy chọn)
              </label>
              <input
                type="text"
                placeholder="Ví dụ: 第26課[だいにじゅうろっか] 文法[ぶんぽう]"
                value={formData.titleJa}
                onChange={(e) => setFormData({ ...formData, titleJa: e.target.value })}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 focus:border-shinme-primary focus:outline-none font-jp"
              />
            </div>

            {/* File Picker */}
            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-4 text-center">
              <input
                type="file"
                id="material-file-input"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSelectedFile(e.target.files[0]);
                  }
                }}
                className="hidden"
                accept=".pdf,.mp3,.wav,.m4a,.ppt,.pptx,.doc,.docx,.xlsx,.zip"
              />
              <label htmlFor="material-file-input" className="cursor-pointer block">
                <div className="mx-auto grid size-10 place-items-center rounded-xl bg-shinme-leaf text-shinme-primary mb-2">
                  <Upload className="size-5" />
                </div>
                <p className="text-xs font-bold text-shinme-ink">
                  {selectedFile ? (
                    <span className="text-shinme-primary font-mono">{selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                  ) : (
                    "Nhấp để chọn file từ máy tính (PDF, MP3, PPTX, DOCX...)"
                  )}
                </p>
                <p className="mt-1 text-xs text-shinme-muted">Hỗ trợ file tối đa 50MB</p>
              </label>
            </div>

            {/* External URL alternative */}
            <div>
              <label className="mb-1 block text-xs font-semibold text-shinme-muted">
                Hoặc dán liên kết tài liệu trực tiếp (Google Drive / OneDrive / YouTube)
              </label>
              <input
                type="url"
                placeholder="https://drive.google.com/file/d/..."
                value={formData.externalUrl}
                onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-shinme-primary focus:outline-none font-mono"
              />
            </div>

            {/* Upload Progress Bar */}
            {isUploading && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-shinme-primary">
                  <span>Đang lưu tài liệu...</span>
                  <span className="tabular">{uploadPercent}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-shinme-line">
                  <div
                    className="h-full bg-shinme-primary transition-all duration-300"
                    style={{ width: `${uploadPercent}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsUploadOpen(false)} disabled={isUploading}>
                Hủy
              </Button>
              <Button type="submit" size="sm" disabled={isUploading}>
                {isUploading ? `Đang tải lên (${uploadPercent}%)...` : "Lưu & Xuất bản"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
