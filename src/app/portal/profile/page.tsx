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
  const { tr } = useTranslation();

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
      toast.info(tr("Vui lòng đăng nhập tài khoản để cập nhật hồ sơ!", "Please log in to update your profile!", "プロフィールを更新するにはログインしてください！"));
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

      toast.success(tr("Cập nhật thông tin cá nhân thành công!", "Personal profile updated successfully!", "プロフィールを更新しました！"));
    } catch (err) {
      console.error(err);
      toast.error(tr("Không thể lưu thông tin. Vui lòng thử lại!", "Failed to save profile. Please try again!", "保存できませんでした。もう一度お試しください！"));
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

      toast.success(tr(`Đã xếp học viên vào lớp: ${targetCls.name}`, `Assigned student to: ${targetCls.name}`, `クラスに配属しました：${targetCls.name}`));
    } catch (err) {
      console.error(err);
      toast.error(tr("Không thể cập nhật lớp học cho người dùng này.", "Failed to update class assignment.", "クラス配属を更新できませんでした。"));
    } finally {
      setIsAdminUpdating(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success(tr("Đã đăng xuất tài khoản.", "Signed out successfully.", "ログアウトしました。"));
    router.push("/login");
  };

  // Upload avatar image from device -> compress to Data URL -> save to Firestore
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // reset so same file can be re-selected

    if (!firebaseUser) {
      toast.error(tr("Vui lòng đăng nhập tài khoản thật để đổi ảnh đại diện!", "Please log in to change your avatar!", "アバターを変更するにはログインしてください！"));
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

      toast.success(tr("Cập nhật ảnh đại diện thành công!", "Avatar updated successfully!", "アバター画像を更新しました！"));
    } catch (err) {
      console.error("Avatar upload failed:", err);
      toast.error(err instanceof Error ? err.message : tr("Không thể tải ảnh đại diện lên.", "Failed to upload avatar.", "アバター画像をアップロードできませんでした。"));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Save external image URL as avatar
  const handleSaveAvatarUrl = async () => {
    if (!firebaseUser) {
      toast.error(tr("Vui lòng đăng nhập tài khoản thật để đổi ảnh đại diện!", "Please log in to change your avatar!", "アバターを変更するにはログインしてください！"));
      return;
    }

    const cleanUrl = avatarUrlInput.trim();
    if (!isSafeHttpUrl(cleanUrl)) {
      toast.error(tr("Đường dẫn ảnh phải bắt đầu bằng https:// hoặc http://", "Image URL must begin with https:// or http://", "画像URLは https:// または http:// で始まる必要があります"));
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
      toast.success(tr("Đã cập nhật ảnh đại diện từ link!", "Avatar updated from URL!", "URLからアバターを更新しました！"));
    } catch (err) {
      console.error(err);
      toast.error(tr("Không thể lưu đường dẫn ảnh.", "Failed to save avatar URL.", "画像URLを保存できませんでした。"));
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
      toast.success(tr("Đã gỡ ảnh đại diện.", "Avatar removed.", "アバター画像を削除しました。"));
    } catch (err) {
      console.error(err);
      toast.error(tr("Không thể gỡ ảnh đại diện.", "Failed to remove avatar.", "アバター画像を削除できませんでした。"));
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
            {tr("Hồ sơ cá nhân & Tài khoản", "Personal Profile & Account", "個人プロフィール・アカウント")}
          </h1>
          <p className="mt-1 text-sm font-semibold text-shinme-muted">
            {tr(
              "Quản lý thông tin học viên, mục tiêu JLPT và lớp học đang theo học",
              "Manage personal information, JLPT target, and class enrollment",
              "受講生情報・JLPT目標・所属クラスを管理します"
            )}
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={handleLogout} className="text-shinme-danger hover:bg-rose-50 border-rose-200">
          <LogOut className="size-4" /> {tr("Đăng xuất", "Sign Out", "ログアウト")}
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
                title={tr("Tải ảnh đại diện từ máy tính / điện thoại", "Upload avatar from device", "端末からアバター画像をアップロード")}
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
                <Camera className="size-3" /> {tr("Tải ảnh mới", "Upload Avatar", "画像をアップロード")}
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
                <Link2 className="size-3" /> {tr("Link ảnh", "Image URL", "画像URL")}
              </button>
              {user.avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={isUploadingAvatar}
                  className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-100"
                  title={tr("Gỡ ảnh đại diện", "Remove avatar", "アバター画像を削除")}
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
                ? tr("Quản trị viên (Admin)", "Administrator (Admin)", "管理者 (Admin)")
                : role === "sensei"
                  ? tr("Giảng viên (Sensei)", "Instructor (Sensei)", "講師 (Sensei)")
                  : role === "guest"
                    ? tr("Khách (Chưa xếp lớp)", "Guest (Unassigned)", "ゲスト（未配属）")
                    : tr("Học viên (Student)", "Student", "受講生 (Student)")}
            </span>
          </div>

          <div className="border-t border-shinme-line pt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between text-xs">
              <span className="text-shinme-muted flex items-center gap-1.5 font-bold">
                <Mail className="size-3.5" /> Email:
              </span>
              <strong className="text-shinme-ink font-mono">{user.email || (firebaseUser?.email ?? tr("Chưa liên kết", "Unlinked", "未連携"))}</strong>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-shinme-muted flex items-center gap-1.5 font-bold">
                <GraduationCap className="size-3.5" /> {tr("Lớp học:", "Class:", "クラス：")}
              </span>
              <strong className="text-shinme-primary">{user.className || tr("Chưa xếp lớp", "Unassigned", "未配属")}</strong>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-shinme-muted flex items-center gap-1.5 font-bold">
                <BookOpen className="size-3.5" /> {tr("Mục tiêu JLPT:", "JLPT Target:", "目標JLPT：")}
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
              <Edit3 className="size-5 text-shinme-primary" /> {tr("Cập nhật thông tin cá nhân", "Update Profile Information", "プロフィール情報を更新")}
            </h3>
            <p className="text-xs text-shinme-muted mb-5">
              {tr(
                "Học viên có thể tự đổi họ tên hiển thị và mục tiêu học tập JLPT của mình",
                "Update your display name and target JLPT certification level",
                "表示名とJLPT受験目標レベルを変更できます"
              )}
            </p>

            <form onSubmit={handleUpdateSelfProfile} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    {tr("Họ và tên hiển thị *", "Display Full Name *", "表示氏名 *")}
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
                    {tr("Mục tiêu kỳ thi JLPT", "JLPT Exam Target", "JLPT目標レベル")}
                  </label>
                  <select
                    value={targetJLPTInput}
                    onChange={(e) => setTargetJLPTInput(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-[#135E36] focus:outline-none"
                  >
                    <option value="N5">JLPT N5 {tr("(Sơ cấp 1)", "(Beginner 1)", "（初級1）")}</option>
                    <option value="N4">JLPT N4 {tr("(Sơ cấp 2)", "(Beginner 2)", "（初級2）")}</option>
                    <option value="N3">JLPT N3 {tr("(Trung cấp)", "(Intermediate)", "（中級）")}</option>
                    <option value="N2">JLPT N2 {tr("(Trung thượng cấp)", "(Upper-Intermediate)", "（中上級）")}</option>
                    <option value="N1">JLPT N1 {tr("(Cao cấp)", "(Advanced)", "（上級）")}</option>
                    <option value="KAIWA">{tr("Giao tiếp Kaiwa", "Kaiwa Conversation", "会話（Kaiwa）")}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  {tr("Lớp học hiện tại", "Current Class", "現在のクラス")}
                </label>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600 flex items-center justify-between">
                  <span>{user.className || tr("Chưa xếp lớp", "Unassigned", "未配属")}</span>
                  <span className="text-xs text-slate-400 font-semibold">
                    {tr("(Chỉ Admin mới có quyền đổi lớp)", "(Admin placement only)", "（クラス変更は管理者のみ可能）")}
                  </span>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button size="sm" type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  {tr("Lưu thay đổi cá nhân", "Save Changes", "変更を保存")}
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
                  {tr(
                    "Phân quyền Admin: Sắp xếp / Chuyển lớp cho Người dùng",
                    "Admin Controls: Assign / Transfer Student Class",
                    "管理者機能：受講生のクラス配属・移動"
                  )}
                </h3>
              </div>
              <p className="text-xs text-amber-800 mb-5">
                {tr(
                  "Chức năng dành riêng cho Quản trị viên: chọn học viên trong hệ thống và phân bổ vào lớp học phù hợp.",
                  "Administrator feature: select any user in the system and place them into an appropriate class.",
                  "管理者専用機能：システム内のユーザーを選択し、適切なクラスに配属します。"
                )}
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    {tr("Chọn người dùng / Học viên *", "Select User / Student *", "ユーザー・受講生を選択 *")}
                  </label>
                  <select
                    value={adminSelectedUid}
                    onChange={(e) => setAdminSelectedUid(e.target.value)}
                    className="w-full rounded-xl border border-amber-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-[#135E36] focus:outline-none"
                  >
                    {allUsersList.map((u) => (
                      <option key={u.uid} value={u.uid}>
                        [{u.code}] {u.fullName} ({u.role}) — {u.className || tr("Chưa có lớp", "Unassigned", "未配属")}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-slate-700">
                    {tr("Lớp học cần xếp vào *", "Target Class *", "配属先クラス *")}
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
                    <Users2 className="size-4" /> {tr("Đi tới Quản trị Người dùng & Phân lớp →", "Go to User Management & Placement →", "ユーザー管理・クラス配属へ →")}
                  </Link>
                </Button>
                <button
                  type="button"
                  onClick={handleAdminAssignClass}
                  disabled={isAdminUpdating}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#135E36] px-5 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#0f4a2a] disabled:opacity-50"
                >
                  {isAdminUpdating ? <Loader2 className="size-4 animate-spin text-[#6CC24A]" /> : <CheckCircle2 className="size-4 text-[#6CC24A]" />}
                  {tr("Lưu xếp lớp (Admin Update)", "Save Placement (Admin Update)", "配属を保存（管理者更新）")}
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
                  <Link2 className="size-5 text-shinme-primary" /> {tr("Đặt ảnh đại diện bằng Link", "Set Avatar via Link", "URLからアバターを設定")}
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs text-shinme-muted">
                  {tr(
                    "Dán đường dẫn ảnh trực tiếp (URL) từ internet hoặc link ảnh công khai.",
                    "Paste a direct image link (URL) from the internet or public cloud host.",
                    "公開されている画像の直接URLを貼り付けてください。"
                  )}
                </DialogDescription>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-shinme-ink">
                  {tr("Đường dẫn ảnh (URL):", "Image URL:", "画像URL：")}
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
                    {tr("Xem trước ảnh đại diện", "Avatar Preview", "アバタープレビュー")}
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2 border-t border-shinme-line">
                <Button variant="ghost" size="sm" onClick={() => setIsAvatarUrlModalOpen(false)}>
                  {tr("Hủy", "Cancel", "キャンセル")}
                </Button>
                <Button size="sm" onClick={handleSaveAvatarUrl} disabled={isUploadingAvatar}>
                  {isUploadingAvatar ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> {tr("Đang lưu...", "Saving...", "保存中...")}
                    </>
                  ) : (
                    <>
                      <Save className="size-4" /> {tr("Lưu ảnh đại diện", "Save Avatar", "アバターを保存")}
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

