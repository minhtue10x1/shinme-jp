"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import { toast } from "sonner";
import {
  Check,
  Download,
  Eye,
  FastForward,
  FileAudio,
  FileSpreadsheet,
  FileText,
  Filter,
  FolderLock,
  Headphones,
  Lock,
  Pause,
  Play,
  Plus,
  Presentation,
  RotateCcw,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
  Upload,
  Volume2,
  X,
} from "lucide-react";
import { FuriganaText } from "@/components/furigana-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ClassSelector } from "@/components/portal/class-selector";
import {
  deleteResource,
  getActiveClassId,
  getResourcesServerSnapshot,
  readResources,
  saveResource,
  subscribeActiveClass,
  subscribeResources,
  type ClassResource,
  type ResourceCategory,
} from "@/lib/classroom-store";
import { getClasses } from "@/lib/db/services";
import type { ClassDoc } from "@/lib/db/schema";
import { useRole } from "@/lib/role-context";
import { cn } from "@/lib/utils";

const TABS: { id: ResourceCategory; label: string }[] = [
  { id: "ALL", label: "Tất cả" },
  { id: "Goi", label: "Từ vựng (Goi)" },
  { id: "Bunpou", label: "Ngữ pháp (Bunpou)" },
  { id: "Dokkai", label: "Đọc hiểu (Dokkai)" },
  { id: "Choukai", label: "Nghe hiểu (Choukai - MP3)" },
  { id: "PDF", label: "File PDF Giáo trình" },
];

export default function ResourcesPage() {
  const { role, user } = useRole();
  const activeClassId = useSyncExternalStore(
    subscribeActiveClass,
    () => getActiveClassId(role),
    () => "cls-n3-246"
  );
  const resources = useSyncExternalStore(
    subscribeResources,
    readResources,
    getResourcesServerSnapshot
  );

  const [activeTab, setActiveTab] = useState<ResourceCategory>("ALL");
  const [search, setSearch] = useState("");
  const [selectedResource, setSelectedResource] = useState<ClassResource | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [classesList, setClassesList] = useState<ClassDoc[]>([]);

  useEffect(() => {
    getClasses().then(setClassesList).catch(console.error);
  }, []);

  // Upload Form State
  const [upTitle, setUpTitle] = useState("");
  const [upTitleJa, setUpTitleJa] = useState("");
  const [upCategory, setUpCategory] = useState<ClassResource["category"]>("Bunpou");
  const [upFileType, setUpFileType] = useState<ClassResource["fileType"]>("PDF");
  const [upLessonTag, setUpLessonTag] = useState("Bài 26");
  const [upFileSize, setUpFileSize] = useState("6.5 MB");
  const [upTargetClass, setUpTargetClass] = useState(activeClassId);
  const [upIsProtected, setUpIsProtected] = useState(true);
  const [upDescription, setUpDescription] = useState("");

  // Scope resources based on role and class
  const relevantClassId = role === "student" ? "cls-n3-246" : activeClassId;
  const filtered = resources.filter((res) => {
    // Class check
    const matchesClass = res.classId === relevantClassId || res.classId === "ALL";
    if (!matchesClass) return false;
    // Category tab check
    if (activeTab !== "ALL" && res.category !== activeTab) return false;
    // Search query check
    if (
      search &&
      !res.title.toLowerCase().includes(search.toLowerCase()) &&
      !res.lessonTag.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!upTitle.trim()) {
      toast.error("Vui lòng nhập tên tài liệu.");
      return;
    }

    const targetCls = classesList.find((c) => c.id === upTargetClass);
    const className = upTargetClass === "ALL" ? "Toàn bộ lớp học" : (targetCls?.name || targetCls?.code || "Lớp học");

    saveResource({
      classId: upTargetClass,
      className,
      title: upTitle.trim(),
      titleJa: upTitleJa.trim() || undefined,
      category: upCategory,
      fileType: upFileType,
      fileSize: upFileSize,
      lessonTag: upLessonTag.trim() || "Tài liệu",
      uploadedBy: `${user.name} (${role === "sensei" ? "Sensei" : "Admin"})`,
      isProtected: upIsProtected,
      description: upDescription.trim() || undefined,
      previewText: "Nội dung tài liệu học tập chuẩn giáo trình Trung tâm Nhật ngữ Shinme.",
    });

    toast.success("Đã tải lên tài liệu thành công!", {
      description: upIsProtected
        ? "Đã bật chế độ: Chỉ cho phép xem/nghe trực tuyến (Chặn tải xuống)."
        : "Học viên được phép tải về máy.",
    });

    setUpTitle("");
    setUpTitleJa("");
    setUpDescription("");
    setIsUploadOpen(false);
  };

  const handleDeleteResource = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteResource(id);
    toast.success("Đã xóa tài liệu khỏi kho lớp.");
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "PDF":
        return <FileText className="size-5 text-red-600" />;
      case "MP3":
        return <Headphones className="size-5 text-amber-600" />;
      case "DOCX":
        return <Presentation className="size-5 text-blue-600" />;
      default:
        return <FileSpreadsheet className="size-5 text-green-600" />;
    }
  };

  return (
    <div className="space-y-6 animate-[rise-in_260ms_var(--ease-out-expo)_both]">
      {/* Top Header */}
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-shinme-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-shinme-ink sm:text-3xl">
              Kho Tài liệu Lớp học (Class Resources)
            </h1>
            <Badge tone="leaf">Phase 2 Protected</Badge>
          </div>
          <p className="mt-1 text-sm font-semibold text-shinme-muted">
            Tài liệu số hóa theo kỹ năng · Audio Choukai · Tùy chọn bảo vệ bản quyền trực tuyến
          </p>
        </div>

        {role !== "student" && (
          <Button size="sm" onClick={() => setIsUploadOpen(true)}>
            <Upload /> Tải lên tài liệu mới
          </Button>
        )}
      </div>

      {/* Class Selector Switcher */}
      <ClassSelector />

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-black transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-shinme-primary text-white shadow-xs"
                  : "bg-shinme-surface text-shinme-ink-soft border border-shinme-border hover:bg-shinme-leaf hover:text-shinme-primary"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-shinme-muted" />
          <input
            type="text"
            placeholder="Tìm theo tên bài, bài học..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full rounded-full border border-shinme-border bg-shinme-surface pl-10 pr-4 text-xs font-semibold text-shinme-ink placeholder:text-shinme-muted focus:border-shinme-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Resource Cards Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-shinme-border bg-shinme-surface p-12 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-shinme-leaf text-shinme-primary mb-3">
            <FolderLock className="size-6" />
          </div>
          <h3 className="text-base font-black text-shinme-ink">Không tìm thấy tài liệu phù hợp</h3>
          <p className="mt-1 text-xs text-shinme-muted">
            Hãy thử chọn chuyên mục khác hoặc thêm tài liệu mới nếu bạn là Sensei.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((res) => (
            <div
              key={res.id}
              onClick={() => setSelectedResource(res)}
              className="group flex flex-col justify-between rounded-3xl border border-shinme-border bg-shinme-surface p-5 shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-lift)] hover:border-shinme-accent/60 cursor-pointer"
            >
              <div>
                {/* Header tags */}
                <div className="flex items-center justify-between gap-2 border-b border-shinme-line pb-3">
                  <div className="flex items-center gap-2">
                    <span className="grid size-9 place-items-center rounded-xl bg-shinme-bg">
                      {getFileIcon(res.fileType)}
                    </span>
                    <span className="text-xs font-black text-shinme-ink font-mono">{res.fileType}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Badge tone="leaf">{res.lessonTag}</Badge>
                    {res.isProtected && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[0.65rem] font-black"
                        title="Tài liệu chỉ cho phép xem/nghe trực tuyến — Không cho phép tải xuống"
                      >
                        <Lock className="size-3" /> Chỉ xem
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="mt-3">
                  <h3 className="text-base font-black text-shinme-ink group-hover:text-shinme-primary transition-colors leading-snug">
                    {res.title}
                  </h3>
                  {res.titleJa && (
                    <FuriganaText text={res.titleJa} className="mt-0.5 block text-xs font-bold text-shinme-primary" />
                  )}
                  {res.description && (
                    <p className="mt-2 text-xs text-shinme-muted line-clamp-2 leading-relaxed">
                      {res.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="mt-5 pt-3 border-t border-shinme-line flex items-center justify-between text-xs text-shinme-muted">
                <span className="font-mono tabular">{res.fileSize}</span>

                <div className="flex items-center gap-2">
                  {role !== "student" && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteResource(res.id, e)}
                      title="Xóa tài liệu"
                      className="grid size-7 place-items-center rounded-lg text-shinme-muted hover:bg-shinme-danger-soft hover:text-shinme-danger transition-colors"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-shinme-primary">
                    <Eye className="size-3.5" /> Mở xem
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Built-in Media & Document Viewer Modal */}
      {selectedResource && (
        <ResourceViewerModal
          resource={selectedResource}
          onClose={() => setSelectedResource(null)}
        />
      )}

      {/* Sensei Upload Resource Modal */}
      {isUploadOpen && (
        <Dialog open={true} onOpenChange={(open) => !open && setIsUploadOpen(false)}>
          <DialogContent className="max-w-xl">
            <form onSubmit={handleUploadSubmit} className="p-6 sm:p-8 space-y-4">
              <div>
                <DialogTitle className="text-xl font-black text-shinme-ink flex items-center gap-2">
                  <Upload className="size-5 text-shinme-primary" /> Tải lên tài liệu lớp học
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs text-shinme-muted">
                  Phân loại theo kỹ năng, gán lớp và thiết lập quy tắc bảo vệ bản quyền trực tuyến.
                </DialogDescription>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-shinme-ink">
                    Lớp nhận tài liệu <span className="text-shinme-danger">*</span>
                  </label>
                  <select
                    value={upTargetClass}
                    onChange={(e) => setUpTargetClass(e.target.value)}
                    className="h-10 w-full rounded-xl border-2 border-shinme-border bg-shinme-surface px-3 text-xs font-bold text-shinme-ink focus:border-shinme-primary focus:outline-none"
                  >
                    {classesList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.shortName || c.name}
                      </option>
                    ))}
                    <option value="ALL">Toàn bộ lớp học</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-shinme-ink">
                    Kỹ năng (Chuyên mục) <span className="text-shinme-danger">*</span>
                  </label>
                  <select
                    value={upCategory}
                    onChange={(e) => setUpCategory(e.target.value as ClassResource["category"])}
                    className="h-10 w-full rounded-xl border-2 border-shinme-border bg-shinme-surface px-3 text-xs font-bold text-shinme-ink focus:border-shinme-primary focus:outline-none"
                  >
                    <option value="Bunpou">Ngữ pháp (Bunpou)</option>
                    <option value="Goi">Từ vựng (Goi)</option>
                    <option value="Dokkai">Đọc hiểu (Dokkai)</option>
                    <option value="Choukai">Nghe hiểu (Choukai - MP3)</option>
                    <option value="PDF">Giáo trình PDF</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-shinme-ink">
                    Định dạng file
                  </label>
                  <select
                    value={upFileType}
                    onChange={(e) => setUpFileType(e.target.value as ClassResource["fileType"])}
                    className="h-10 w-full rounded-xl border-2 border-shinme-border bg-shinme-surface px-3 text-xs font-bold text-shinme-ink focus:border-shinme-primary focus:outline-none"
                  >
                    <option value="PDF">PDF (.pdf)</option>
                    <option value="MP3">MP3 (.mp3 - Choukai)</option>
                    <option value="DOCX">Word Document (.docx)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-shinme-ink">
                    Nhãn bài học (Lesson Tag)
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Bài 26, Tuần 3, Soumatome..."
                    value={upLessonTag}
                    onChange={(e) => setUpLessonTag(e.target.value)}
                    className="h-10 w-full rounded-xl border-2 border-shinme-border bg-shinme-surface px-3 text-xs font-bold text-shinme-ink focus:border-shinme-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-shinme-ink">
                  Tên tài liệu <span className="text-shinme-danger">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Minna no Nihongo Bài 26 — Dịch & Giải thích ngữ pháp..."
                  value={upTitle}
                  onChange={(e) => setUpTitle(e.target.value)}
                  className="h-10 w-full rounded-xl border-2 border-shinme-border bg-shinme-surface px-3 text-xs font-bold text-shinme-ink focus:border-shinme-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-shinme-ink">
                  Tên tiếng Nhật <span className="text-shinme-muted font-normal">(tùy chọn)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: 文法[ぶんぽう]まとめ..."
                  value={upTitleJa}
                  onChange={(e) => setUpTitleJa(e.target.value)}
                  className="h-10 w-full rounded-xl border-2 border-shinme-border bg-shinme-surface px-3 text-xs font-jp font-bold text-shinme-primary focus:border-shinme-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-shinme-ink">
                  Mô tả & ghi chú cho học viên
                </label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú cách học hoặc bài tập kèm theo..."
                  value={upDescription}
                  onChange={(e) => setUpDescription(e.target.value)}
                  className="w-full rounded-xl border-2 border-shinme-border bg-shinme-surface p-2.5 text-xs text-shinme-ink focus:border-shinme-primary focus:outline-none"
                />
              </div>

              {/* Security Rule Toggle */}
              <div className="rounded-2xl bg-amber-50 p-4 border border-amber-200 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="protected-rule"
                    checked={upIsProtected}
                    onChange={(e) => setUpIsProtected(e.target.checked)}
                    className="size-4 rounded accent-shinme-primary cursor-pointer"
                  />
                  <label htmlFor="protected-rule" className="text-xs font-black text-amber-900 cursor-pointer flex items-center gap-1.5">
                    <Lock className="size-3.5" /> Chỉ cho phép xem/nghe trực tuyến (Chặn tải xuống)
                  </label>
                </div>
                <p className="text-[0.7rem] text-amber-700 leading-relaxed pl-6">
                  Khi bật chế độ này, học viên chỉ có thể đọc tài liệu hoặc nghe audio trong trình xem của Shinme LMS. Các nút tải về và in ấn sẽ bị vô hiệu hóa để bảo vệ bản quyền.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-shinme-line">
                <Button variant="ghost" size="sm" type="button" onClick={() => setIsUploadOpen(false)}>
                  Hủy
                </Button>
                <Button size="sm" type="submit">
                  <Upload /> Lưu & Xuất bản tài liệu
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
 * BUILT-IN MEDIA & DOCUMENT VIEWER MODAL
 * ------------------------------------------------------------------ */
function ResourceViewerModal({
  resource,
  onClose,
}: {
  resource: ClassResource;
  onClose: () => void;
}) {
  const isAudio = resource.fileType === "MP3";

  // Audio Player State for Choukai
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState<number>(1.0);
  const totalDuration = 45; // 45 seconds sample audio

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <div className="p-6 sm:p-8 space-y-5">
          {/* Header */}
          <div className="border-b border-shinme-line pb-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="rounded bg-shinme-primary text-white text-[0.65rem] font-black uppercase px-2 py-0.5">
                  {resource.fileType}
                </span>
                <Badge tone="leaf">{resource.lessonTag}</Badge>
              </div>

              {resource.isProtected ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-900 border border-amber-300">
                  <Lock className="size-3.5" /> Chặn tải xuống · Bản quyền nội bộ
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-shinme-leaf px-3 py-1 text-xs font-black text-shinme-primary">
                  <Check className="size-3.5" /> Cho phép tải về máy
                </span>
              )}
            </div>

            <DialogTitle className="mt-3 text-lg font-black text-shinme-ink">
              {resource.title}
            </DialogTitle>
            {resource.titleJa && (
              <FuriganaText text={resource.titleJa} className="mt-0.5 block text-xs font-bold text-shinme-primary" />
            )}
            <p className="mt-1 text-xs text-shinme-muted">
              Lớp: <strong>{resource.className}</strong> · Giảng viên: {resource.uploadedBy} · Dung lượng: {resource.fileSize}
            </p>
          </div>

          {/* Body Viewer */}
          {isAudio ? (
            /* MP3 Audio Player with 0.75x, 1.0x, 1.25x */
            <div className="rounded-2xl bg-shinme-bg p-5 border border-shinme-line space-y-4">
              <div className="flex items-center justify-between text-xs font-black uppercase text-shinme-primary">
                <span className="flex items-center gap-1.5">
                  <Headphones className="size-4" /> Trình phát Choukai Shinme
                </span>
                <span className="font-mono">{resource.audioDuration || "05:42"}</span>
              </div>

              {/* Scrubber */}
              <div className="space-y-1">
                <div className="h-2.5 w-full rounded-full bg-shinme-line overflow-hidden cursor-pointer">
                  <div
                    className="h-full bg-shinme-accent transition-all duration-300"
                    style={{ width: `${(currentTime / totalDuration) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-[0.7rem] font-mono text-shinme-muted">
                  <span>00:{currentTime.toString().padStart(2, "0")}</span>
                  <span>00:{totalDuration}</span>
                </div>
              </div>

              {/* Audio Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentTime((t) => Math.max(0, t - 5))}
                    className="grid size-8 place-items-center rounded-full bg-shinme-surface border border-shinme-border text-xs font-bold hover:bg-shinme-leaf"
                  >
                    -5s
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="grid size-11 place-items-center rounded-full bg-shinme-primary text-white shadow-md hover:bg-shinme-primary-hover active:scale-95"
                  >
                    {isPlaying ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current ml-0.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setCurrentTime((t) => Math.min(totalDuration, t + 5))}
                    className="grid size-8 place-items-center rounded-full bg-shinme-surface border border-shinme-border text-xs font-bold hover:bg-shinme-leaf"
                  >
                    +5s
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPlaying(false);
                      setCurrentTime(0);
                    }}
                    className="grid size-8 place-items-center rounded-full bg-shinme-surface border border-shinme-border text-xs hover:bg-shinme-leaf"
                  >
                    <RotateCcw className="size-3.5" />
                  </button>
                </div>

                {/* Speed Controls: 0.75x, 1.0x, 1.25x as requested */}
                <div className="flex items-center gap-1 rounded-full bg-shinme-surface p-1 border border-shinme-border">
                  <span className="px-2 text-[0.7rem] font-black text-shinme-muted">Tốc độ:</span>
                  {[0.75, 1.0, 1.25].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSpeed(s)}
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-black transition-colors tabular",
                        speed === s
                          ? "bg-shinme-primary text-white"
                          : "text-shinme-ink-soft hover:bg-shinme-leaf"
                      )}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Document Preview (PDF / DOCX) */
            <div className="space-y-3">
              <div className="rounded-2xl border border-shinme-border bg-shinme-bg p-5 max-h-60 overflow-y-auto space-y-3">
                <div className="flex items-center justify-between border-b border-shinme-line pb-2">
                  <span className="text-xs font-black uppercase text-shinme-muted">
                    Xem trước trang 1/4
                  </span>
                  <Badge tone="neutral">Độ phân giải chuẩn</Badge>
                </div>
                <div className="text-xs leading-relaxed text-shinme-ink-soft whitespace-pre-line font-sans">
                  {resource.previewText ||
                    "Đang nạp dữ liệu xem trước trực tuyến... Toàn bộ giáo trình và bài giải đã được kiểm duyệt bởi ban giáo vụ Shinme."}
                </div>
              </div>
            </div>
          )}

          {/* Security Notice / Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-shinme-line">
            <div className="text-xs text-shinme-muted">
              {resource.isProtected ? (
                <span className="text-amber-800 font-bold flex items-center gap-1">
                  <ShieldAlert className="size-3.5 text-amber-600" /> Bản quyền được bảo vệ. Vui lòng không sao chép trái phép.
                </span>
              ) : (
                <span>Tài liệu cho phép học viên tải về học tập cá nhân.</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Đóng
              </Button>

              {/* Strict Download Protection: If protected, DO NOT SHOW download button */}
              {resource.isProtected ? (
                <Button size="sm" disabled className="opacity-50 cursor-not-allowed">
                  <Lock /> Đã khóa tải xuống
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => {
                    toast.success(`Đang bắt đầu tải xuống: ${resource.title}`, {
                      description: `File ${resource.fileType} (${resource.fileSize})`,
                    });
                  }}
                >
                  <Download /> Tải về máy
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
