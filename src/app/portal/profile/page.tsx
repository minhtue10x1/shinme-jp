"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  User,
  Mail,
  GraduationCap,
  Calendar,
  LogOut,
  Save,
  Shield,
  BookOpen,
  Sparkles,
  Users,
  Users2,
  Edit3,
  Loader2,
  CheckCircle2,
  Camera,
  Link2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { UserAvatar } from "@/components/user-avatar";
import { compressImageToAvatar } from "@/lib/image-utils";
import { isSafeHttpUrl } from "@/lib/utils";
import { useRole } from "@/lib/role-context";
import {
  getUserProfile,
  updateUserClassByAdmin,
  updateUserAvatar,
  getAllUsers,
  getClasses,
} from "@/lib/db/services";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfileDoc, ClassDoc } from "@/lib/db/schema";

export default function ProfilePage() {
  const router = useRouter();
  const { role, user, firebaseUser, logout, setUserProfile } = useRole();

  const [dbProfile, setDbProfile] = useState<UserProfileDoc | null>(null);
  const [classesList, setClassesList] = useState<ClassDoc[]>([]);
  const [allUsersList, setAllUsersList] = useState<UserProfileDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states for self-profile update
  const [fullNameInput, setFullNameInput] = useState("");
  const [targetJLPTInput, setTargetJLPTInput] = useState<string>("N3");
  const [isSaving, setIsSaving] = useState(false);

  // Avatar Upload & URL states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isAvatarUrlModalOpen, setIsAvatarUrlModalOpen] = useState(false);
  const [avatarUrlInput, setAvatarUrlInput] = useState("");

  // Admin selected user for class assignment
  const [adminSelectedUid, setAdminSelectedUid] = useState<string>("");
  const [adminTargetClassId, setAdminTargetClassId] = useState<string>("");
  const [isAdminUpdating, setIsAdminUpdating] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);

        // 1. Load active classes
        const classes = await getClasses();
        setClassesList(classes);
        if (classes.length > 0) {
          setAdminTargetClassId(classes[0].id);
        }

        // 2. Load current profile from Firestore if authenticated
        if (firebaseUser) {
          const prof = await getUserProfile(firebaseUser.uid);
          if (prof) {
            setDbProfile(prof);
            setFullNameInput(prof.fullName || "");
            setTargetJLPTInput(prof.targetJLPT || "N3");
          }
        } else {
          // Fallback to role context user
          setFullNameInput(user.name);
        }

        // 3. If Admin, load all users to allow re-assigning classes
        if (role === "admin") {
          const users = await getAllUsers();
          setAllUsersList(users);
          if (users.length > 0) {
            setAdminSelectedUid(users[0].uid);
          }
        }
      } catch (err) {
        console.warn("Could not load profile data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [firebaseUser, role, user.name]);

  // Handle self-profile update (Tự cập nhật họ tên & mục tiêu JLPT)
  const handleUpdateSelfProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) {
      toast.info("Vui lòng đăng nhập tài khoản để cập nhật hồ sơ!");
      return;
    }

    try {
      setIsSaving(true);
      const userRef = doc(db, "users", firebaseUser.uid);
      await updateDoc(userRef, {
        fullName: fullNameInput.trim(),
        targetJLPT: targetJLPTInput,
        updatedAt: new Date().toISOString(),
      });

      if (dbProfile) {
        const updated = {
          ...dbProfile,
          fullName: fullNameInput.trim(),
          targetJLPT: targetJLPTInput as "N5" | "N4" | "N3" | "N2" | "N1" | "KAIWA",
        };
        setDbProfile(updated);
        setUserProfile(updated);
      }

      toast.success("Cập nhật thông tin cá nhân thành công!");
    } catch (err) {
      console.error(err);
      toast.error("Không thể lưu thông tin. Vui lòng thử lại!");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Admin updating a user's class assignment
  const handleAdminAssignClass = async () => {
    if (!adminSelectedUid || !adminTargetClassId) return;

    const targetCls = classesList.find((c) => c.id === adminTargetClassId);
    if (!targetCls) return;

    try {
      setIsAdminUpdating(true);
      await updateUserClassByAdmin(adminSelectedUid, targetCls.id, targetCls.name);

      // Update in-memory state
      setAllUsersList((prev) =>
        prev.map((u) =>
          u.uid === adminSelectedUid
            ? { ...u, classId: targetCls.id, className: targetCls.name }
            : u
        )
      );

      // If updating oneself
      if (firebaseUser && adminSelectedUid === firebaseUser.uid && dbProfile) {
        const next = { ...dbProfile, classId: targetCls.id, className: targetCls.name };
        setDbProfile(next);
        setUserProfile(next);
      }

      toast.success(`Đã xếp học viên vào lớp: ${targetCls.name}`);
    } catch (err) {
      console.error(err);
      toast.error("Không thể cập nhật lớp học cho người dùng này.");
    } finally {
      setIsAdminUpdating(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Đã đăng xuất tài khoản.");
    router.push("/login");
  };

  // Upload avatar image from device -> compress to Data URL -> save to Firestore
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // reset so same file can be re-selected

    if (!firebaseUser) {
      toast.error("Vui lòng đăng nhập tài khoản thật để đổi ảnh đại diện!");
      return;
    }

    try {
      setIsUploadingAvatar(true);
      const compressedDataUrl = await compressImageToAvatar(file, 256, 0.82);
      await updateUserAvatar(firebaseUser.uid, compressedDataUrl);

      if (dbProfile) {
        const updated = { ...dbProfile, avatarUrl: compressedDataUrl };
        setDbProfile(updated);
        setUserProfile(updated);
      }

      toast.success("Cập nhật ảnh đại diện thành công!");
    } catch (err) {
      console.error("Avatar upload failed:", err);
      toast.error(err instanceof Error ? err.message : "Không thể tải ảnh đại diện lên.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Save external image URL as avatar
  const handleSaveAvatarUrl = async () => {
    if (!firebaseUser) {
      toast.error("Vui lòng đăng nhập tài khoản thật để đổi ảnh đại diện!");
      return;
    }

    const cleanUrl = avatarUrlInput.trim();
    if (!isSafeHttpUrl(cleanUrl)) {
      toast.error("Đường dẫn ảnh phải bắt đầu bằng https:// hoặc http://");
      return;
    }

    try {
      setIsUploadingAvatar(true);
      await updateUserAvatar(firebaseUser.uid, cleanUrl);
      if (dbProfile) {
        const updated = { ...dbProfile, avatarUrl: cleanUrl };
        setDbProfile(updated);
        setUserProfile(updated);
      }
      setIsAvatarUrlModalOpen(false);
      toast.success("Đã cập nhật ảnh đại diện từ link!");
    } catch (err) {
      console.error(err);
      toast.error("Không thể lưu đường dẫn ảnh.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Remove avatar back to initials
  const handleRemoveAvatar = async () => {
    if (!firebaseUser) return;
    try {
      setIsUploadingAvatar(true);
      await updateUserAvatar(firebaseUser.uid, "");
      if (dbProfile) {
        const updated = { ...dbProfile, avatarUrl: "" };
        setDbProfile(updated);
        setUserProfile(updated);
      }
      toast.success("Đã gỡ ảnh đại diện.");
    } catch (err) {
      console.error(err);
      toast.error("Không thể gỡ ảnh đại diện.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <div className="space-y-6 animate-[rise-in_260ms_var(--ease-out-expo)_both] pb-16">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-shinme-line pb-5">
        <div>
          <h1 className="text-2xl font-black text-shinme-ink sm:text-3xl">Hồ sơ cá nhân & Tài khoản</h1>
          <p className="mt-1 text-sm font-semibold text-shinme-muted">
            Quản lý thông tin học viên, mục tiêu JLPT và lớp học đang theo học
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={handleLogout} className="text-shinme-danger hover:bg-rose-50 border-rose-200">
          <LogOut className="size-4" /> Đăng xuất
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Profile Card */}
        <div className="rounded-3xl border border-shinme-border bg-shinme-surface p-6 shadow-sm lg:col-span-4 space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative group">
              <UserAvatar
                src={user.avatarUrl}
                fallbackText={user.avatarText}
                alt={user.name}
                size="xl"
                className="border-4 border-shinme-leaf shadow-md"
                fallbackClassName="bg-shinme-accent text-shinme-primary-deep"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                title="Tải ảnh đại diện từ máy tính / điện thoại"
                className="absolute bottom-0 right-0 grid size-8 place-items-center rounded-full bg-shinme-primary text-white border-2 border-white shadow-md transition-transform hover:scale-105 disabled:opacity-50"
              >
                {isUploadingAvatar ? <Loader2 className="size-4 animate-spin" /> : <Camera className="size-4" />}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleAvatarFileChange}
                className="hidden"
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="inline-flex items-center gap-1 rounded-full bg-shinme-leaf px-3 py-1 text-xs font-bold text-shinme-primary transition-colors hover:bg-shinme-accent/30"
              >
                <Camera className="size-3" /> Tải ảnh mới
              </button>
              <button
                type="button"
                onClick={() => {
                  setAvatarUrlInput(user.avatarUrl || "");
                  setIsAvatarUrlModalOpen(true);
                }}
                disabled={isUploadingAvatar}
                className="inline-flex items-center gap-1 rounded-full bg-shinme-bg border border-shinme-border px-3 py-1 text-xs font-bold text-shinme-ink-soft transition-colors hover:bg-shinme-leaf hover:text-shinme-primary"
              >
                <Link2 className="size-3" /> Link ảnh
              </button>
              {user.avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={isUploadingAvatar}
                  className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-100"
                  title="Gỡ ảnh đại diện"
                >
                  <Trash2 className="size-3" />
                </button>
              )}
            </div>

            <h2 className="mt-4 text-xl font-black text-shinme-ink">{user.name}</h2>
            <p className="font-mono text-xs font-bold text-shinme-primary bg-shinme-leaf px-2.5 py-0.5 rounded-full mt-1">
              {user.code}
            </p>

            <span className="mt-2 inline-flex items-center gap-1 text-xs font-extrabold uppercase tracking-wide text-shinme-muted">
              <Shield className="size-3.5 text-shinme-primary" />
              {role === "admin"
                ? "Quản trị viên (Admin)"
                : role === "sensei"
                  ? "Giảng viên (Sensei)"
                  : role === "guest"
                    ? "Khách (Chưa xếp lớp)"
                    : "Học viên (Student)"}
            </span>
          </div>

          <div className="border-t border-shinme-line pt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between text-xs">
              <span className="text-shinme-muted flex items-center gap-1.5 font-bold">
                <Mail className="size-3.5" /> Email:
              </span>
              <strong className="text-shinme-ink font-mono">{user.email || (firebaseUser?.email ?? "Chưa liên kết")}</strong>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-shinme-muted flex items-center gap-1.5 font-bold">
                <GraduationCap className="size-3.5" /> Lớp học:
              </span>
              <strong className="text-shinme-primary">{user.className || "Chưa xếp lớp"}</strong>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-shinme-muted flex items-center gap-1.5 font-bold">
                <BookOpen className="size-3.5" /> Mục tiêu JLPT:
              </span>
              <strong className="text-shinme-ink font-bold">{dbProfile?.targetJLPT || "N3"}</strong>
            </div>
          </div>
        </div>

        {/* Right Column: Update Forms & Admin Control */}
        <div className="space-y-6 lg:col-span-8">
          {/* Form 1: Self Profile Information */}
          <div className="rounded-3xl border border-shinme-border bg-shinme-surface p-6 shadow-sm">
            <h3 className="text-lg font-black text-shinme-ink flex items-center gap-2 mb-1">
              <Edit3 className="size-5 text-shinme-primary" /> Cập nhật thông tin cá nhân
            </h3>
            <p className="text-xs text-shinme-muted mb-5">
              Học viên có thể tự đổi họ tên hiển thị và mục tiêu học tập JLPT của mình
            </p>

            <form onSubmit={handleUpdateSelfProfile} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">Họ và tên hiển thị *</label>
                  <input
                    type="text"
                    required
                    value={fullNameInput}
                    onChange={(e) => setFullNameInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-[#135E36] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">Mục tiêu kỳ thi JLPT</label>
                  <select
                    value={targetJLPTInput}
                    onChange={(e) => setTargetJLPTInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-[#135E36] focus:outline-none"
                  >
                    <option value="N5">JLPT N5 (Sơ cấp 1)</option>
                    <option value="N4">JLPT N4 (Sơ cấp 2)</option>
                    <option value="N3">JLPT N3 (Trung cấp)</option>
                    <option value="N2">JLPT N2 (Trung thượng cấp)</option>
                    <option value="N1">JLPT N1 (Cao cấp)</option>
                    <option value="KAIWA">Giao tiếp Kaiwa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Lớp học hiện tại</label>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600 flex items-center justify-between">
                  <span>{user.className || "Chưa xếp lớp"}</span>
                  <span className="text-xs text-slate-400 font-semibold">(Chỉ Admin mới có quyền đổi lớp)</span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button size="sm" type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Lưu thay đổi cá nhân
                </Button>
              </div>
            </form>
          </div>

          {/* Form 2: ADMIN ONLY - Sửa / Gán Lớp học cho Học viên & Giảng viên */}
          {role === "admin" && (
            <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Users className="size-5 text-amber-800" />
                <h3 className="text-lg font-black text-amber-950">
                  Phân quyền Admin: Sắp xếp / Chuyển lớp cho Người dùng
                </h3>
              </div>
              <p className="text-xs text-amber-800 mb-5">
                Chức năng dành riêng cho Quản trị viên: chọn học viên trong hệ thống và phân bổ vào lớp học phù hợp.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">Chọn người dùng / Học viên *</label>
                  <select
                    value={adminSelectedUid}
                    onChange={(e) => setAdminSelectedUid(e.target.value)}
                    className="w-full rounded-xl border border-amber-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-[#135E36] focus:outline-none"
                  >
                    {allUsersList.map((u) => (
                      <option key={u.uid} value={u.uid}>
                        [{u.code}] {u.fullName} ({u.role}) — {u.className || "Chưa có lớp"}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">Lớp học cần xếp vào *</label>
                  <select
                    value={adminTargetClassId}
                    onChange={(e) => setAdminTargetClassId(e.target.value)}
                    className="w-full rounded-xl border border-amber-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-[#135E36] focus:outline-none"
                  >
                    {classesList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.level})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <Button asChild size="sm" variant="outline">
                  <Link href="/portal/users">
                    <Users2 className="size-4" /> Đi tới Quản trị Người dùng & Phân lớp →
                  </Link>
                </Button>
                <button
                  type="button"
                  onClick={handleAdminAssignClass}
                  disabled={isAdminUpdating}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#135E36] px-5 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#0f4a2a] disabled:opacity-50"
                >
                  {isAdminUpdating ? <Loader2 className="size-4 animate-spin text-[#6CC24A]" /> : <CheckCircle2 className="size-4 text-[#6CC24A]" />}
                  Lưu xếp lớp (Admin Update)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal nhập Link ảnh đại diện */}
      {isAvatarUrlModalOpen && (
        <Dialog open={true} onOpenChange={(open) => !open && setIsAvatarUrlModalOpen(false)}>
          <DialogContent className="max-w-md">
            <div className="p-6 space-y-4">
              <div>
                <DialogTitle className="text-lg font-black text-shinme-ink flex items-center gap-2">
                  <Link2 className="size-5 text-shinme-primary" /> Đặt ảnh đại diện bằng Link
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs text-shinme-muted">
                  Dán đường dẫn ảnh trực tiếp (URL) từ internet hoặc link ảnh công khai.
                </DialogDescription>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-shinme-ink">Đường dẫn ảnh (URL):</label>
                <input
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={avatarUrlInput}
                  onChange={(e) => setAvatarUrlInput(e.target.value)}
                  className="h-10 w-full rounded-xl border border-shinme-border bg-shinme-surface px-3 text-xs font-medium text-shinme-ink focus:border-shinme-primary focus:outline-none"
                />
              </div>

              {avatarUrlInput.trim() && (
                <div className="flex items-center gap-3 rounded-xl bg-shinme-bg p-3 border border-shinme-line">
                  <UserAvatar
                    src={avatarUrlInput.trim()}
                    fallbackText={user.avatarText}
                    size="md"
                  />
                  <span className="text-xs font-semibold text-shinme-muted">Xem trước ảnh đại diện</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2 border-t border-shinme-line">
                <Button variant="ghost" size="sm" onClick={() => setIsAvatarUrlModalOpen(false)}>
                  Hủy
                </Button>
                <Button size="sm" onClick={handleSaveAvatarUrl} disabled={isUploadingAvatar}>
                  {isUploadingAvatar ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="size-4" /> Lưu ảnh đại diện
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

