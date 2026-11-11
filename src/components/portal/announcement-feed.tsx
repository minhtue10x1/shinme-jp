"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import {
  Bell,
  Check,
  Megaphone,
  Pin,
  PinOff,
  Plus,
  Send,
  Sparkles,
  Trash2,
  UserCheck,
} from "lucide-react";
import { FuriganaText } from "@/components/furigana-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import {
  getActiveClassId,
  subscribeActiveClass,
} from "@/lib/classroom-store";
import { useRole } from "@/lib/role-context";
import {
  getAnnouncements,
  saveAnnouncementDoc,
  deleteAnnouncementDoc,
  togglePinAnnouncementDoc,
  getClasses,
} from "@/lib/db/services";
import type { AnnouncementDoc, ClassDoc } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

export function AnnouncementFeed() {
  const { role, user } = useRole();
  const activeClassId = useSyncExternalStore(
    subscribeActiveClass,
    () => getActiveClassId(role),
    () => "cls-n3-246"
  );

  const [announcements, setAnnouncements] = useState<AnnouncementDoc[]>([]);
  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [titleJa, setTitleJa] = useState("");
  const [category, setCategory] = useState<AnnouncementDoc["category"]>("BTVN & Luyện thi");
  const [targetClassId, setTargetClassId] = useState(activeClassId);
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [annList, classList] = await Promise.all([
        getAnnouncements(),
        getClasses(),
      ]);
      setAnnouncements(annList);
      setClasses(classList);
    } catch (err) {
      console.error("Load announcements error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (role !== "guest") {
      loadData();
    } else {
      setIsLoading(false);
    }
  }, [role]);

  // Filter announcements:
  // If student: only show announcements for their assigned class (user.classId) or ALL
  // If sensei/admin: show announcements for the currently selected class or ALL
  const relevantClassId = role === "student" ? (user.classId || "cls-n3-246") : activeClassId;
  const filtered = announcements.filter(
    (a) => a.classId === relevantClassId || a.classId === "ALL"
  );

  // Sort pinned first, then newest
  const sorted = [...filtered].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Vui lòng nhập đầy đủ tiêu đề và nội dung.");
      return;
    }

    const cls = classes.find((c) => c.id === targetClassId);
    const className = targetClassId === "ALL" ? "Toàn bộ lớp học" : cls?.name ?? "Lớp học";

    const newAnn: AnnouncementDoc = {
      id: `ann-${Date.now().toString(36)}`,
      classId: targetClassId,
      className,
      title: title.trim(),
      titleJa: titleJa.trim() || undefined,
      content: content.trim(),
      authorName: user.name || "Sensei Shinme",
      authorRole: role === "sensei" ? "Sensei" : "Admin",
      category,
      isPinned,
      createdAt: new Date().toISOString(),
    };

    try {
      await saveAnnouncementDoc(newAnn);
      toast.success("Đã đăng thông báo thành công!", {
        description: isPinned ? "Thông báo đã được ghim lên đầu bảng tin." : "Học viên sẽ thấy thông báo này trên bảng tin.",
      });

      setTitle("");
      setTitleJa("");
      setContent("");
      setIsPinned(false);
      setIsComposerOpen(false);
      await loadData();
    } catch (err) {
      console.error("Create announcement error:", err);
      toast.error("Lỗi khi đăng thông báo. Vui lòng thử lại.");
    }
  };

  const handleTogglePin = async (id: string, currentPinned: boolean) => {
    try {
      await togglePinAnnouncementDoc(id, currentPinned);
      toast.info(currentPinned ? "Đã gỡ ghim thông báo." : "Đã ghim thông báo lên đầu bảng tin.");
      await loadData();
    } catch (err) {
      console.error("Toggle pin error:", err);
      toast.error("Lỗi khi cập nhật ghim.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa thông báo này?")) return;
    try {
      await deleteAnnouncementDoc(id);
      toast.success("Đã xóa thông báo.");
      await loadData();
    } catch (err) {
      console.error("Delete announcement error:", err);
      toast.error("Lỗi khi xóa thông báo.");
    }
  };

  if (role === "guest") return null;

  return (
    <div className="space-y-4 rounded-3xl border border-shinme-border bg-shinme-surface p-6 shadow-[var(--shadow-card)]">
      {/* Feed Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-shinme-line pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-xl bg-shinme-leaf text-shinme-primary">
              <Megaphone className="size-4" />
            </span>
            <h2 className="text-lg font-black text-shinme-ink">Bảng tin & Thông báo lớp học</h2>
            <Badge tone="leaf">{filtered.length} Tin</Badge>
          </div>
          <p className="mt-1 text-xs text-shinme-muted">
            Dặn dò học vụ, lịch thi thử, bài tập về nhà và cập nhật từ Sensei
          </p>
        </div>

        {role !== "student" && (
          <Button size="sm" onClick={() => setIsComposerOpen(true)}>
            <Plus className="size-4" /> Soạn thông báo mới
          </Button>
        )}
      </div>

      {/* Announcements List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-shinme-bg animate-pulse" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="py-8 text-center text-xs text-shinme-muted">
          Chưa có thông báo nào cho lớp học này.
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((item) => (
            <article
              key={item.id}
              className={cn(
                "relative rounded-2xl border p-5 transition-all",
                item.isPinned
                  ? "border-shinme-primary/30 bg-shinme-leaf-faint/40 shadow-xs"
                  : "border-shinme-border bg-shinme-surface hover:border-shinme-primary/20"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-shinme-line/60 pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  {item.isPinned && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-shinme-primary px-2.5 py-0.5 text-xs font-black text-white">
                      <Pin className="size-3 fill-white" /> Đã ghim
                    </span>
                  )}
                  <Badge tone={item.category === "BTVN & Luyện thi" ? "warn" : "leaf"}>
                    {item.category}
                  </Badge>
                  <span className="rounded bg-shinme-bg px-2 py-0.5 font-mono text-xs font-bold text-shinme-muted">
                    {item.classId === "ALL" ? "Toàn trung tâm" : item.className.split(" ")[0]}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <time className="text-xs text-shinme-muted">
                    {new Date(item.createdAt).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </time>

                  {role !== "student" && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleTogglePin(item.id, item.isPinned)}
                        className="rounded-lg p-1.5 text-shinme-muted hover:bg-shinme-bg hover:text-shinme-primary"
                        title={item.isPinned ? "Bỏ ghim" : "Ghim lên đầu"}
                      >
                        {item.isPinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50"
                        title="Xóa thông báo"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3">
                <h3 className="text-base font-black text-shinme-ink leading-snug">{item.title}</h3>
                {item.titleJa && (
                  <FuriganaText text={item.titleJa} className="mt-0.5 block text-xs font-bold text-shinme-primary" />
                )}
                <p className="mt-2 text-sm leading-relaxed text-shinme-ink-soft whitespace-pre-line">
                  {item.content}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between pt-3 border-t border-shinme-line text-xs font-semibold text-shinme-muted">
                <div className="flex items-center gap-1.5 text-shinme-primary">
                  <UserCheck className="size-3.5" />
                  <span>
                    Người đăng: <strong>{item.authorName} ({item.authorRole})</strong>
                  </span>
                </div>
                <span className="text-xs text-shinme-muted">Thông báo chính thức Shinme</span>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Sensei Composer Modal */}
      {isComposerOpen && (
        <Dialog open={true} onOpenChange={(open) => !open && setIsComposerOpen(false)}>
          <DialogContent className="max-w-xl">
            <form onSubmit={handleCreateAnnouncement} className="p-6 sm:p-8 space-y-4">
              <div>
                <DialogTitle className="text-xl font-black text-shinme-ink flex items-center gap-2">
                  <Megaphone className="size-5 text-shinme-primary" /> Đăng thông báo lớp học
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs text-shinme-muted">
                  Thông báo sẽ xuất hiện ngay lập tức trên bảng tin của học viên trong lớp.
                </DialogDescription>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-shinme-ink">
                  Lớp nhận thông báo <span className="text-shinme-danger">*</span>
                </label>
                <select
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  className="h-11 w-full rounded-xl border-2 border-shinme-border bg-shinme-surface px-3 text-sm font-bold text-shinme-ink focus:border-shinme-primary focus:outline-none"
                >
                  <option value="ALL">Toàn bộ tất cả các lớp học</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-shinme-ink">
                  Chuyên mục thông báo
                </label>
                <div className="flex flex-wrap gap-2">
                  {(["BTVN & Luyện thi", "Lịch học & Phòng học", "Tài liệu học tập", "Thông báo chung"] as const).map(
                    (cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs font-bold transition-colors",
                          category === cat
                            ? "bg-shinme-primary text-white"
                            : "bg-shinme-bg text-shinme-ink-soft border border-shinme-border hover:bg-shinme-leaf"
                        )}
                      >
                        {cat}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-shinme-ink">
                  Tiêu đề thông báo <span className="text-shinme-danger">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: [QUAN TRỌNG] Nhắc nhở nộp bài tập Minna no Nihongo Bài 26..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-11 w-full rounded-xl border-2 border-shinme-border bg-shinme-surface px-4 text-sm font-bold text-shinme-ink focus:border-shinme-primary focus:outline-none placeholder:text-shinme-muted/60"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-shinme-ink">
                  Tiêu đề tiếng Nhật <span className="text-shinme-muted font-normal">(tùy chọn)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: 宿題[しゅくだい]の提出[ていしゅつ]について..."
                  value={titleJa}
                  onChange={(e) => setTitleJa(e.target.value)}
                  className="h-11 w-full rounded-xl border-2 border-shinme-border bg-shinme-surface px-4 text-sm font-jp font-bold text-shinme-primary focus:border-shinme-primary focus:outline-none placeholder:text-shinme-muted/60"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-shinme-ink">
                  Nội dung chi tiết <span className="text-shinme-danger">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Nhập nội dung dặn dò, hạn nộp, link học hoặc tài liệu đính kèm..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full rounded-xl border-2 border-shinme-border bg-shinme-surface p-3 text-sm text-shinme-ink focus:border-shinme-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pin-toggle"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="size-4 rounded accent-shinme-primary cursor-pointer"
                />
                <label htmlFor="pin-toggle" className="text-xs font-black text-shinme-ink cursor-pointer">
                  Ghim thông báo quan trọng này lên đầu bảng tin
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-shinme-line">
                <Button variant="ghost" size="sm" type="button" onClick={() => setIsComposerOpen(false)}>
                  Hủy
                </Button>
                <Button size="sm" type="submit">
                  <Send /> Đăng thông báo
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
