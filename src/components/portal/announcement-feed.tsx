"use client";

import { useState, useSyncExternalStore } from "react";
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
  deleteAnnouncement,
  getActiveClassId,
  MOCK_CLASSES,
  readAnnouncements,
  saveAnnouncement,
  subscribeActiveClass,
  subscribeAnnouncements,
  togglePinAnnouncement,
  type ClassAnnouncement,
} from "@/lib/classroom-store";
import { useRole } from "@/lib/role-context";
import { cn } from "@/lib/utils";

export function AnnouncementFeed() {
  const { role, user } = useRole();
  const activeClassId = useSyncExternalStore(
    subscribeActiveClass,
    () => getActiveClassId(role),
    () => "cls-n3-246"
  );
  const announcements = useSyncExternalStore(
    subscribeAnnouncements,
    readAnnouncements,
    () => []
  );

  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [titleJa, setTitleJa] = useState("");
  const [category, setCategory] = useState<ClassAnnouncement["category"]>("BTVN & Luyện thi");
  const [targetClassId, setTargetClassId] = useState(activeClassId);
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);

  // Filter announcements:
  // If student: only show announcements for their assigned class (cls-n3-246) or ALL
  // If sensei/admin: show announcements for the currently selected class or ALL
  const relevantClassId = role === "student" ? "cls-n3-246" : activeClassId;
  const filtered = announcements.filter(
    (a) => a.classId === relevantClassId || a.classId === "ALL"
  );

  // Sort pinned first, then newest
  const sorted = [...filtered].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Vui lòng nhập đầy đủ tiêu đề và nội dung.");
      return;
    }

    const cls = MOCK_CLASSES.find((c) => c.id === targetClassId);
    const className = targetClassId === "ALL" ? "Toàn bộ lớp học" : cls?.name ?? "Lớp học";

    saveAnnouncement({
      classId: targetClassId,
      className,
      title: title.trim(),
      titleJa: titleJa.trim() || undefined,
      content: content.trim(),
      authorName: user.name,
      authorRole: role === "sensei" ? "Sensei" : "Admin",
      category,
      isPinned,
    });

    toast.success("Đã đăng thông báo thành công!", {
      description: isPinned ? "Thông báo đã được ghim lên đầu bảng tin." : "Học viên sẽ thấy thông báo này trên bảng tin.",
    });

    setTitle("");
    setTitleJa("");
    setContent("");
    setIsPinned(false);
    setIsComposerOpen(false);
  };

  const handleTogglePin = (id: string, currentPinned: boolean) => {
    togglePinAnnouncement(id);
    toast.info(currentPinned ? "Đã gỡ ghim thông báo" : "Đã ghim thông báo lên đầu bảng tin");
  };

  const handleDelete = (id: string) => {
    deleteAnnouncement(id);
    toast.success("Đã xóa thông báo.");
  };

  return (
    <div className="space-y-4">
      {/* Feed Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-shinme-leaf text-shinme-primary">
            <Megaphone className="size-4" />
          </span>
          <div>
            <h2 className="text-lg font-black text-shinme-ink">Bảng tin lớp học (Classroom Feed)</h2>
            <p className="text-xs text-shinme-muted">
              {role === "student"
                ? "Thông báo quan trọng từ Sensei Tanaka và trung tâm"
                : "Đăng thông báo, dặn dò BTVN và ghim tin quan trọng"}
            </p>
          </div>
        </div>

        {role !== "student" && (
          <Button size="sm" onClick={() => setIsComposerOpen(true)}>
            <Plus /> Đăng thông báo mới
          </Button>
        )}
      </div>

      {/* Announcements List */}
      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-shinme-border bg-shinme-surface p-8 text-center">
          <p className="font-bold text-shinme-ink">Chưa có thông báo nào cho lớp này.</p>
          <p className="mt-1 text-xs text-shinme-muted">
            Sensei có thể đăng thông báo đầu tiên bằng nút &quot;Đăng thông báo mới&quot; phía trên.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((item) => (
            <article
              key={item.id}
              className={cn(
                "rounded-2xl border bg-shinme-surface p-5 shadow-[var(--shadow-card)] transition-all",
                item.isPinned
                  ? "border-shinme-accent/60 bg-gradient-to-r from-shinme-leaf-faint/80 to-shinme-surface"
                  : "border-shinme-border"
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-shinme-line pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  {item.isPinned && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-shinme-accent px-2.5 py-0.5 text-xs font-black text-shinme-primary-deep shadow-xs">
                      <Pin className="size-3 fill-current" /> ĐÃ GHIM
                    </span>
                  )}
                  <Badge tone={item.category === "BTVN & Luyện thi" ? "warn" : "leaf"}>
                    {item.category}
                  </Badge>
                  <span className="text-xs font-bold text-shinme-muted">
                    Lớp: <strong className="text-shinme-ink">{item.className}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="tabular text-xs text-shinme-muted">
                    {new Date(item.createdAt).toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </span>

                  {role !== "student" && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleTogglePin(item.id, item.isPinned)}
                        title={item.isPinned ? "Gỡ ghim" : "Ghim lên đầu"}
                        className="grid size-7 place-items-center rounded-lg text-shinme-muted hover:bg-shinme-bg hover:text-shinme-primary transition-colors"
                      >
                        {item.isPinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        title="Xóa thông báo"
                        className="grid size-7 place-items-center rounded-lg text-shinme-muted hover:bg-shinme-danger-soft hover:text-shinme-danger transition-colors"
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
                <span className="text-[0.7rem] text-shinme-muted">Shinme Portal Notification</span>
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
                  Thông báo sẽ xuất hiện trên bảng tin của học viên theo thời gian thực.
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
                  {MOCK_CLASSES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                  <option value="ALL">Toàn bộ tất cả các lớp học</option>
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
