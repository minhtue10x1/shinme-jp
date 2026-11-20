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
import { compressImageToAvatar, dataUrlToBlob } from "@/lib/image-utils";
import { isSafeHttpUrl } from "@/lib/utils";
import { useRole } from "@/lib/role-context";
import { useTranslation } from "@/lib/i18n/context";
import {
  getUserProfile,
  updateUserClassByAdmin,
  updateUserAvatar,
  uploadUserAvatarToStorage,
  getAllUsers,
  getClasses,
} from "@/lib/db/services";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfileDoc, ClassDoc } from "@/lib/db/schema";

export default function ProfilePage() {
  const router = useRouter();
  const { role, user, firebaseUser, logout, setUserProfile } = useRole();
  const { lang, t } = useTranslation();

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
      toast.info(lang === "vi" ? "Vui lòng đăng nhập tài khoản để cập nhật hồ sơ!" : "Please log in to update your profile!");
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

      toast.success(lang === "vi" ? "Cập nhật thông tin cá nhân thành công!" : "Personal profile updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error(lang === "vi" ? "Không thể lưu thông tin. Vui lòng thử lại!" : "Failed to save profile. Please try again!");
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

      toast.success(lang === "vi" ? `Đã xếp học viên vào lớp: ${targetCls.name}` : `Assigned student to: ${targetCls.name}`);
    } catch (err) {
      console.error(err);
      toast.error(lang === "vi" ? "Không thể cập nhật lớp học cho người dùng này." : "Failed to update class assignment.");
    } finally {
      setIsAdminUpdating(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success(lang === "vi" ? "Đã đăng xuất tài khoản." : "Signed out successfully.");
    router.push("/login");
  };

  // Upload avatar image from device -> compress to Data URL -> save to Firestore
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // reset so same file can be re-selected

    if (!firebaseUser) {
      toast.error(lang === "vi" ? "Vui lòng đăng nhập tài khoản thật để đổi ảnh đại diện!" : "Please log in to change your avatar!");
      return;
    }

    try {
      setIsUploadingAvatar(true);
      const compressedDataUrl = await compressImageToAvatar(file, 256, 0.82);

      // Prefer Firebase Storage URL so Firestore user docs stay lightweight when listing users
      let finalAvatarUrl = compressedDataUrl;
      try {
        const blob = dataUrlToBlob(compressedDataUrl);
        finalAvatarUrl = await uploadUserAvatarToStorage(firebaseUser.uid, blob);
      } catch (storageErr) {
        console.warn("Firebase Storage avatar upload unavailable, falling back to compressed DataURL:", storageErr);
      }

      await updateUserAvatar(firebaseUser.uid, finalAvatarUrl);

      if (dbProfile) {
        const updated = { ...dbProfile, avatarUrl: finalAvatarUrl };
        setDbProfile(updated);
        setUserProfile(updated);
      }

      toast.success(lang === "vi" ? "Cập nhật ảnh đại diện thành công!" : "Avatar updated successfully!");
    } catch (err) {
      console.error("Avatar upload failed:", err);
      toast.error(err instanceof Error ? err.message : (lang === "vi" ? "Không thể tải ảnh đại diện lên." : "Failed to upload avatar."));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Save external image URL as avatar
  const handleSaveAvatarUrl = async () => {
    if (!firebaseUser) {
      toast.error(lang === "vi" ? "Vui lòng đăng nhập tài khoản thật để đổi ảnh đại diện!" : "Please log in to change your avatar!");
      return;
    }

    const cleanUrl = avatarUrlInput.trim();
    if (!isSafeHttpUrl(cleanUrl)) {
      toast.error(lang === "vi" ? "Đường dẫn ảnh phải bắt đầu bằng https:// hoặc http://" : "Image URL must begin with https:// or http://");
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
      toast.success(lang === "vi" ? "Đã cập nhật ảnh đại diện từ link!" : "Avatar updated from URL!");
    } catch (err) {
      console.error(err);
      toast.error(lang === "vi" ? "Không thể lưu đường dẫn ảnh." : "Failed to save avatar URL.");
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
      toast.success(lang === "vi" ? "Đã gỡ ảnh đại diện." : "Avatar removed.");
    } catch (err) {
      console.error(err);
      toast.error(lang === "vi" ? "Không thể gỡ ảnh đại diện." : "Failed to remove avatar.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <div className="space-y-6 animate-[rise-in_260ms_var(--ease-out-expo)_both] pb-16">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-shinme-line pb-5">
        <div>
          <h1 className="text-2xl font-black text-shinme-ink sm:text-3xl">
            {lang === "vi" ? "Hồ sơ cá nhân & Tài khoản" : "Personal Profile & Account"}
          </h1>
          <p className="mt-1 text-sm font-semibold text-shinme-muted">
            {lang === "vi"
              ? "Quản lý thông tin học viên, mục tiêu JLPT và lớp học đang theo học"
              : "Manage personal information, JLPT target, and class enrollment"}
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={handleLogout} className="text-shinme-danger hover:bg-rose-50 border-rose-200">
          <LogOut className="size-4" /> {lang === "vi" ? "Đăng xuất" : "Sign Out"}
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
                title={lang === "vi" ? "Tải ảnh đại diện từ máy tính / điện thoại" : "Upload avatar from device"}
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
                <Camera className="size-3" /> {lang === "vi" ? "Tải ảnh mới" : "Upload Avatar"}
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
                <Link2 className="size-3" /> {lang === "vi" ? "Link ảnh" : "Image URL"}
              </button>
              {user.avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={isUploadingAvatar}
                  className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-100"
                  title={lang === "vi" ? "Gỡ ảnh đại diện" : "Remove avatar"}
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
                ? (lang === "vi" ? "Quản trị viên (Admin)" : "Administrator (Admin)")
                : role === "sensei"
                  ? (lang === "vi" ? "Giảng viên (Sensei)" : "Instructor (Sensei)")
                  : role === "guest"
                    ? (lang === "vi" ? "Khách (Chưa xếp lớp)" : "Guest (Unassigned)")
                    : (lang === "vi" ? "Học viên (Student)" : "Student")}
            </span>
          </div>

          <div className="border-t border-shinme-line pt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between text-xs">
              <span className="text-shinme-muted flex items-center gap-1.5 font-bold">
                <Mail className="size-3.5" /> Email:
              </span>
              <strong className="text-shinme-ink font-mono">{user.email || (firebaseUser?.email ?? (lang === "vi" ? "Chưa liên kết" : "Unlinked"))}</strong>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-shinme-muted flex items-center gap-1.5 font-bold">
                <GraduationCap className="size-3.5" /> {lang === "vi" ? "Lớp học:" : "Class:"}
              </span>
              <strong className="text-shinme-primary">{user.className || (lang === "vi" ? "Chưa xếp lớp" : "Unassigned")}</strong>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-shinme-muted flex items-center gap-1.5 font-bold">
                <BookOpen className="size-3.5" /> {lang === "vi" ? "Mục tiêu JLPT:" : "JLPT Target:"}
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
              <Edit3 className="size-5 text-shinme-primary" /> {lang === "vi" ? "Cập nhật thông tin cá nhân" : "Update Profile Information"}
            </h3>
            <p className="text-xs text-shinme-muted mb-5">
              {lang === "vi"
                ? "Học viên có thể tự đổi họ tên hiển thị và mục tiêu học tập JLPT của mình"
                : "Update your display name and target JLPT certification level"}
            </p>

            <form onSubmit={handleUpdateSelfProfile} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    {lang === "vi" ? "Họ và tên hiển thị *" : "Display Full Name *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={fullNameInput}
                    onChange={(e) => setFullNameInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-[#135E36] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    {lang === "vi" ? "Mục tiêu kỳ thi JLPT" : "JLPT Exam Target"}
                  </label>
                  <select
                    value={targetJLPTInput}
                    onChange={(e) => setTargetJLPTInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-[#135E36] focus:outline-none"
                  >
                    <option value="N5">JLPT N5 {lang === "vi" ? "(Sơ cấp 1)" : "(Beginner 1)"}</option>
                    <option value="N4">JLPT N4 {lang === "vi" ? "(Sơ cấp 2)" : "(Beginner 2)"}</option>
                    <option value="N3">JLPT N3 {lang === "vi" ? "(Trung cấp)" : "(Intermediate)"}</option>
                    <option value="N2">JLPT N2 {lang === "vi" ? "(Trung thượng cấp)" : "(Upper-Intermediate)"}</option>
                    <option value="N1">JLPT N1 {lang === "vi" ? "(Cao cấp)" : "(Advanced)"}</option>
                    <option value="KAIWA">{lang === "vi" ? "Giao tiếp Kaiwa" : "Kaiwa Conversation"}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  {lang === "vi" ? "Lớp học hiện tại" : "Current Class"}
                </label>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600 flex items-center justify-between">
                  <span>{user.className || (lang === "vi" ? "Chưa xếp lớp" : "Unassigned")}</span>
                  <span className="text-xs text-slate-400 font-semibold">
                    {lang === "vi" ? "(Chỉ Admin mới có quyền đổi lớp)" : "(Admin placement only)"}
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button size="sm" type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  {lang === "vi" ? "Lưu thay đổi cá nhân" : "Save Changes"}
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
                  {lang === "vi"
                    ? "Phân quyền Admin: Sắp xếp / Chuyển lớp cho Người dùng"
                    : "Admin Controls: Assign / Transfer Student Class"}
                </h3>
              </div>
              <p className="text-xs text-amber-800 mb-5">
                {lang === "vi"
                  ? "Chức năng dành riêng cho Quản trị viên: chọn học viên trong hệ thống và phân bổ vào lớp học phù hợp."
                  : "Administrator feature: select any user in the system and place them into an appropriate class."}
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    {lang === "vi" ? "Chọn người dùng / Học viên *" : "Select User / Student *"}
                  </label>
                  <select
                    value={adminSelectedUid}
                    onChange={(e) => setAdminSelectedUid(e.target.value)}
                    className="w-full rounded-xl border border-amber-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-[#135E36] focus:outline-none"
                  >
                    {allUsersList.map((u) => (
                      <option key={u.uid} value={u.uid}>
                        [{u.code}] {u.fullName} ({u.role}) — {u.className || (lang === "vi" ? "Chưa có lớp" : "Unassigned")}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    {lang === "vi" ? "Lớp học cần xếp vào *" : "Target Class *"}
                  </label>
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
                    <Users2 className="size-4" /> {lang === "vi" ? "Đi tới Quản trị Người dùng & Phân lớp →" : "Go to User Management & Placement →"}
                  </Link>
                </Button>
                <button
                  type="button"
                  onClick={handleAdminAssignClass}
                  disabled={isAdminUpdating}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#135E36] px-5 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#0f4a2a] disabled:opacity-50"
                >
                  {isAdminUpdating ? <Loader2 className="size-4 animate-spin text-[#6CC24A]" /> : <CheckCircle2 className="size-4 text-[#6CC24A]" />}
                  {lang === "vi" ? "Lưu xếp lớp (Admin Update)" : "Save Placement (Admin Update)"}
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
                  <Link2 className="size-5 text-shinme-primary" /> {lang === "vi" ? "Đặt ảnh đại diện bằng Link" : "Set Avatar via Link"}
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs text-shinme-muted">
                  {lang === "vi"
                    ? "Dán đường dẫn ảnh trực tiếp (URL) từ internet hoặc link ảnh công khai."
                    : "Paste a direct image link (URL) from the internet or public cloud host."}
                </DialogDescription>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-shinme-ink">
                  {lang === "vi" ? "Đường dẫn ảnh (URL):" : "Image URL:"}
                </label>
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
                  <span className="text-xs font-semibold text-shinme-muted">
                    {lang === "vi" ? "Xem trước ảnh đại diện" : "Avatar Preview"}
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2 border-t border-shinme-line">
                <Button variant="ghost" size="sm" onClick={() => setIsAvatarUrlModalOpen(false)}>
                  {lang === "vi" ? "Hủy" : "Cancel"}
                </Button>
                <Button size="sm" onClick={handleSaveAvatarUrl} disabled={isUploadingAvatar}>
                  {isUploadingAvatar ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> {lang === "vi" ? "Đang lưu..." : "Saving..."}
                    </>
                  ) : (
                    <>
                      <Save className="size-4" /> {lang === "vi" ? "Lưu ảnh đại diện" : "Save Avatar"}
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

