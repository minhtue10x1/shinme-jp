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
import { useTranslation } from "@/lib/i18n/context";

export function AnnouncementFeed() {
  const { role, user } = useRole();
  const { lang, tr } = useTranslation();
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
        getAnnouncements(role === "student" ? user.classId : undefined),
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
  }, [role, user.classId]);

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
      toast.error(tr("Vui lòng nhập đầy đủ tiêu đề và nội dung.", "Please fill in both title and content.", "タイトルと内容の両方を入力してください。"));
      return;
    }

    const cls = classes.find((c) => c.id === targetClassId);
    const className = targetClassId === "ALL" ? tr("Toàn bộ lớp học", "All Classes", "全クラス") : (cls?.name ?? tr("Lớp học", "Class", "クラス"));

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
      toast.success(
        tr("Đã đăng thông báo thành công!", "Announcement posted successfully!", "お知らせを投稿しました！"),
        {
          description: isPinned
            ? tr("Thông báo đã được ghim lên đầu bảng tin.", "Announcement pinned to the top of the feed.", "お知らせをトップに固定しました。")
            : tr("Học viên sẽ thấy thông báo này trên bảng tin.", "Students will see this announcement on the feed.", "受講生のお知らせ一覧に表示されます。"),
        }
      );

      setTitle("");
      setTitleJa("");
      setContent("");
      setIsPinned(false);
      setIsComposerOpen(false);
      await loadData();
    } catch (err) {
      console.error("Create announcement error:", err);
      toast.error(tr("Lỗi khi đăng thông báo. Vui lòng thử lại.", "Error posting announcement. Please try again.", "投稿中にエラーが発生しました。もう一度お試しください。"));
    }
  };

  const handleTogglePin = async (id: string, currentPinned: boolean) => {
    try {
      await togglePinAnnouncementDoc(id, currentPinned);
      toast.info(
        currentPinned
          ? tr("Đã gỡ ghim thông báo.", "Announcement unpinned.", "固定を解除しました。")
          : tr("Đã ghim thông báo lên đầu bảng tin.", "Announcement pinned to top of feed.", "お知らせをトップに固定しました。")
      );
      await loadData();
    } catch (err) {
      console.error("Toggle pin error:", err);
      toast.error(tr("Lỗi khi cập nhật ghim.", "Error updating pin status.", "固定状態の更新に失敗しました。"));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(tr("Bạn có chắc chắn muốn xóa thông báo này?", "Are you sure you want to delete this announcement?", "このお知らせを削除してもよろしいですか？"))) return;
    try {
      await deleteAnnouncementDoc(id);
      toast.success(tr("Đã xóa thông báo.", "Announcement deleted.", "お知らせを削除しました。"));
      await loadData();
    } catch (err) {
      console.error("Delete announcement error:", err);
      toast.error(tr("Lỗi khi xóa thông báo.", "Error deleting announcement.", "お知らせの削除に失敗しました。"));
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
            <h2 className="text-lg font-black text-shinme-ink">
              {tr("Bảng tin & Thông báo lớp học", "Feed & Class Announcements", "クラスお知らせ・掲示板")}
            </h2>
            <Badge tone="leaf">
              {tr(`${filtered.length} Tin`, `${filtered.length} Posts`, `${filtered.length}件`)}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-shinme-muted">
            {tr(
              "Dặn dò học vụ, lịch thi thử, bài tập về nhà và cập nhật từ Sensei",
              "Academic notices, mock test schedules, homework and updates from Sensei",
              "学習連絡・模擬試験日程・宿題・講師からのお知らせ"
            )}
          </p>
        </div>

        {role !== "student" && (
          <Button size="sm" onClick={() => setIsComposerOpen(true)}>
            <Plus className="size-4" /> {tr("Soạn thông báo mới", "New Announcement", "新規お知らせ作成")}
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
          {tr("Chưa có thông báo nào cho lớp học này.", "No announcements for this class yet.", "このクラスのお知らせはまだありません。")}
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
                      <Pin className="size-3 fill-white" /> {tr("Đã ghim", "Pinned", "固定済み")}
                    </span>
                  )}
                  <Badge tone={item.category === "BTVN & Luyện thi" ? "warn" : "leaf"}>
                    {item.category === "BTVN & Luyện thi"
                      ? tr("BTVN & Luyện thi", "Homework & Prep", "宿題・試験対策")
                      : item.category === "Lịch học & Phòng học"
                      ? tr("Lịch học & Phòng học", "Schedule & Room", "授業日程・教室")
                      : item.category === "Tài liệu học tập"
                      ? tr("Tài liệu học tập", "Learning Materials", "教材資料")
                      : tr("Thông báo chung", "General Notice", "一般お知らせ")}
                  </Badge>
                  <span className="rounded bg-shinme-bg px-2 py-0.5 font-mono text-xs font-bold text-shinme-muted">
                    {item.classId === "ALL"
                      ? tr("Toàn trung tâm", "Center-wide", "全校共通")
                      : item.className.split(" ")[0]}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <time className="text-xs text-shinme-muted">
                    {new Date(item.createdAt).toLocaleDateString(lang === "vi" ? "vi-VN" : lang === "ja" ? "ja-JP" : "en-US", {
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
                        title={item.isPinned ? tr("Bỏ ghim", "Unpin", "固定解除") : tr("Ghim lên đầu", "Pin to top", "トップに固定")}
                      >
                        {item.isPinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50"
                        title={tr("Xóa thông báo", "Delete announcement", "お知らせを削除")}
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
                    {tr("Người đăng:", "Posted by:", "投稿者：")}{" "}
                    <strong>{item.authorName} ({item.authorRole})</strong>
                  </span>
                </div>
                <span className="text-xs text-shinme-muted">
                  {tr("Thông báo chính thức Shinme", "Shinme Official Notice", "Shinme公式お知らせ")}
                </span>
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
                  <Megaphone className="size-5 text-shinme-primary" />{" "}
                  {tr("Đăng thông báo lớp học", "Post Class Announcement", "クラスお知らせを投稿")}
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs text-shinme-muted">
                  {tr(
                    "Thông báo sẽ xuất hiện ngay lập tức trên bảng tin của học viên trong lớp.",
                    "The announcement will immediately appear on the students' class feed.",
                    "投稿後すぐにクラス内の受講生掲示板に表示されます。"
                  )}
                </DialogDescription>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-shinme-ink">
                  {tr("Lớp nhận thông báo", "Target Class", "対象クラス")} <span className="text-shinme-danger">*</span>
                </label>
                <select
                  value={targetClassId}
                  onChange={(e) => setTargetClassId(e.target.value)}
                  className="h-11 w-full rounded-xl border-2 border-shinme-border bg-shinme-surface px-3 text-sm font-bold text-shinme-ink focus:border-shinme-primary focus:outline-none"
                >
                  <option value="ALL">{tr("Toàn bộ tất cả các lớp học", "All Classes", "すべてのクラス")}</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-shinme-ink">
                  {tr("Chuyên mục thông báo", "Announcement Category", "カテゴリー")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { id: "BTVN & Luyện thi", vi: "BTVN & Luyện thi", en: "Homework & Prep", ja: "宿題・試験対策" },
                      { id: "Lịch học & Phòng học", vi: "Lịch học & Phòng học", en: "Schedule & Room", ja: "授業日程・教室" },
                      { id: "Tài liệu học tập", vi: "Tài liệu học tập", en: "Learning Materials", ja: "教材資料" },
                      { id: "Thông báo chung", vi: "Thông báo chung", en: "General Notice", ja: "一般お知らせ" },
                    ] as const
                  ).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.id as AnnouncementDoc["category"])}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-bold transition-colors",
                        category === cat.id
                          ? "bg-shinme-primary text-white"
                          : "bg-shinme-bg text-shinme-ink-soft border border-shinme-border hover:bg-shinme-leaf"
                      )}
                    >
                      {tr(cat.vi, cat.en, cat.ja)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-shinme-ink">
                  {tr("Tiêu đề thông báo", "Announcement Title", "タイトル")}{" "}
                  <span className="text-shinme-danger">*</span>
                </label>
                <input
                  type="text"
                  placeholder={tr(
                    "Ví dụ: [QUAN TRỌNG] Nhắc nhở nộp bài tập Minna no Nihongo Bài 26...",
                    "Example: [IMPORTANT] Reminder to submit Minna no Nihongo Lesson 26 homework...",
                    "例：【重要】みんなの日本語 第26課の宿題提出について..."
                  )}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-11 w-full rounded-xl border-2 border-shinme-border bg-shinme-surface px-4 text-sm font-bold text-shinme-ink focus:border-shinme-primary focus:outline-none placeholder:text-shinme-muted/60"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-shinme-ink">
                  {tr("Tiêu đề tiếng Nhật", "Japanese Title", "日本語タイトル")}{" "}
                  <span className="text-shinme-muted font-normal">({tr("tùy chọn", "optional", "任意")})</span>
                </label>
                <input
                  type="text"
                  placeholder={tr("Ví dụ: 宿題[しゅくだい]の提出[ていしゅつ]について...", "Example: 宿題[しゅくだい]の提出[ていしゅつ]について...", "例：宿題[しゅくだい]の提出[ていしゅつ]について...")}
                  value={titleJa}
                  onChange={(e) => setTitleJa(e.target.value)}
                  className="h-11 w-full rounded-xl border-2 border-shinme-border bg-shinme-surface px-4 text-sm font-jp font-bold text-shinme-primary focus:border-shinme-primary focus:outline-none placeholder:text-shinme-muted/60"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black uppercase text-shinme-ink">
                  {tr("Nội dung chi tiết", "Detailed Content", "詳細内容")}{" "}
                  <span className="text-shinme-danger">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder={tr(
                    "Nhập nội dung dặn dò, hạn nộp, link học hoặc tài liệu đính kèm...",
                    "Enter details, submission deadlines, meeting links or attachments...",
                    "連絡事項、提出期限、授業リンクなどを入力してください..."
                  )}
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
                  {tr(
                    "Ghim thông báo quan trọng này lên đầu bảng tin",
                    "Pin this important announcement to the top",
                    "この重要なお知らせをトップに固定する"
                  )}
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-shinme-line">
                <Button variant="ghost" size="sm" type="button" onClick={() => setIsComposerOpen(false)}>
                  {tr("Hủy", "Cancel", "キャンセル")}
                </Button>
                <Button size="sm" type="submit">
                  <Send /> {tr("Đăng thông báo", "Post Announcement", "投稿する")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
