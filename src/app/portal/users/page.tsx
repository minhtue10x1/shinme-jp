"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Mail,
  Phone,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  UserCheck,
  UserCog,
  UserPlus,
  Users,
  Users2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRole, type RoleId } from "@/lib/role-context";
import { useTranslation } from "@/lib/i18n/context";
import {
  getAllUsers,
  getClasses,
  updateUserClassByAdmin,
  assignTeacherAndClasses,
  updateUserRole,
} from "@/lib/db/services";
import type { UserProfileDoc, ClassDoc } from "@/lib/db/schema";

export default function UsersManagementPage() {
  const { role, user: currentUser } = useRole();
  const { tr } = useTranslation();

  const [users, setUsers] = useState<UserProfileDoc[]>([]);
  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [classFilter, setClassFilter] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  // Assign Class Dialog
  const [assignUser, setAssignUser] = useState<UserProfileDoc | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [autoPromoteToStudent, setAutoPromoteToStudent] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);

  // Assign Teacher Dialog
  const [teacherUser, setTeacherUser] = useState<UserProfileDoc | null>(null);
  const [teacherSelectedClassIds, setTeacherSelectedClassIds] = useState<string[]>([]);
  const [isAssigningTeacher, setIsAssigningTeacher] = useState(false);

  // Role Change Dialog
  const [roleChangeUser, setRoleChangeUser] = useState<UserProfileDoc | null>(null);
  const [newTargetRole, setNewTargetRole] = useState<RoleId>("student");
  const [isChangingRole, setIsChangingRole] = useState(false);

  // Load real data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [uList, cList] = await Promise.all([getAllUsers(), getClasses()]);
      setUsers(uList);
      setClasses(cList);
      if (cList.length > 0) {
        setSelectedClassId(cList[0].id);
      }
    } catch (err) {
      console.error("Error loading users:", err);
      toast.error(tr("Không thể tải danh sách người dùng.", "Failed to load user list.", "ユーザー一覧を読み込めませんでした。"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (role === "admin") {
      loadData();
    }
  }, [role]);

  // Counts
  const guestCount = useMemo(() => users.filter((u) => u.role === "guest").length, [users]);
  const studentCount = useMemo(() => users.filter((u) => u.role === "student").length, [users]);
  const senseiCount = useMemo(() => users.filter((u) => u.role === "sensei").length, [users]);
  const adminCount = useMemo(() => users.filter((u) => u.role === "admin").length, [users]);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Role filter
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;

      // Class filter
      if (classFilter !== "ALL") {
        if (classFilter === "UNASSIGNED") {
          if (u.classId) return false;
        } else if (u.classId !== classFilter) {
          return false;
        }
      }

      // Search query (email, name, code, phone)
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = (u.fullName || "").toLowerCase().includes(q);
        const matchEmail = (u.email || "").toLowerCase().includes(q);
        const matchCode = (u.code || "").toLowerCase().includes(q);
        const matchPhone = (u.phone || "").toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchCode && !matchPhone) return false;
      }

      return true;
    });
  }, [users, roleFilter, classFilter, search]);

  // Access check
  if (role !== "admin") {
    return (
      <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-8 text-center space-y-4">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-shinme-warn-soft text-[#8a5a12]">
          <ShieldAlert className="size-6" />
        </div>
        <h2 className="text-xl font-bold text-shinme-ink">
          {tr("Quyền truy cập hạn chế", "Restricted Access", "アクセス制限")}
        </h2>
        <p className="text-sm text-shinme-muted max-w-md mx-auto">
          {tr(
            "Chức năng Quản lý Người dùng & Phân lớp chỉ dành cho vai trò Quản trị viên (Admin).",
            "User Management & Class Placement is reserved for Administrator (Admin) roles.",
            "ユーザー管理・クラス配属は管理者（Admin）専用機能です。"
          )}
        </p>
        <Button asChild size="sm">
          <Link href="/portal">{tr("Quay về Tổng quan", "Back to Overview", "ダッシュボードへ戻る")}</Link>
        </Button>
      </div>
    );
  }

  // Handle open Assign Class modal
  const handleOpenAssignClass = (targetUser: UserProfileDoc) => {
    setAssignUser(targetUser);
    setSelectedClassId(targetUser.classId || (classes[0]?.id ?? ""));
    setAutoPromoteToStudent(targetUser.role === "guest");
  };

  // Submit Assign Class
  const handleSaveClassAssignment = async () => {
    if (!assignUser || !selectedClassId) return;
    const targetCls = classes.find((c) => c.id === selectedClassId);
    if (!targetCls) return;

    setIsAssigning(true);
    try {
      await updateUserClassByAdmin(
        assignUser.uid,
        targetCls.id,
        targetCls.name,
        autoPromoteToStudent
      );

      const nextRole: RoleId = autoPromoteToStudent && assignUser.role === "guest" ? "student" : assignUser.role;
      const nextCode =
        autoPromoteToStudent && assignUser.role === "guest" && assignUser.code?.startsWith("KH-")
          ? assignUser.code.replace("KH-", "HV-")
          : assignUser.code;

      setUsers((prev) =>
        prev.map((u) =>
          u.uid === assignUser.uid
            ? { ...u, classId: targetCls.id, className: targetCls.name, role: nextRole, code: nextCode }
            : u
        )
      );

      toast.success(
        tr(
          `Đã xếp ${assignUser.fullName} vào lớp ${targetCls.name}!`,
          `Assigned ${assignUser.fullName} to class ${targetCls.name}!`,
          `${assignUser.fullName} をクラス ${targetCls.name} に配属しました！`
        ),
        {
          description:
            autoPromoteToStudent && assignUser.role === "guest"
              ? tr("Vai trò đã được nâng cấp thành Học viên chính thức.", "Role upgraded to Official Student.", "正規受講生にアップグレードされました。")
              : undefined,
        }
      );
      setAssignUser(null);
    } catch (err) {
      console.error(err);
      toast.error(tr("Không thể cập nhật lớp học cho người dùng này.", "Failed to update class assignment.", "クラス配属を更新できませんでした。"));
    } finally {
      setIsAssigning(false);
    }
  };

  // Handle open Assign Teacher modal
  const handleOpenAssignTeacher = (targetUser: UserProfileDoc) => {
    setTeacherUser(targetUser);
    // Preselect classes where this user is already sensei, or empty
    const currentTaught = classes.filter((c) => c.senseiId === targetUser.uid).map((c) => c.id);
    setTeacherSelectedClassIds(currentTaught.length > 0 ? currentTaught : [classes[0]?.id || "cls-n3-246"]);
  };

  // Toggle class selection for teacher
  const toggleTeacherClass = (classId: string) => {
    setTeacherSelectedClassIds((prev) =>
      prev.includes(classId) ? prev.filter((id) => id !== classId) : [...prev, classId]
    );
  };

  // Submit Assign Teacher
  const handleSaveTeacherAssignment = async () => {
    if (!teacherUser) return;
    if (teacherSelectedClassIds.length === 0) {
      toast.error(tr("Vui lòng chọn ít nhất 1 lớp học để phân công cho Sensei!", "Please select at least 1 class for Sensei!", "講師に割り当てるクラスを1つ以上選択してください！"));
      return;
    }

    setIsAssigningTeacher(true);
    try {
      await assignTeacherAndClasses(
        teacherUser.uid,
        teacherUser.fullName,
        teacherSelectedClassIds,
        classes
      );

      const newCode = teacherUser.code?.startsWith("SS-")
        ? teacherUser.code
        : `SS-${Date.now().toString(36).slice(-4).toUpperCase()}`;

      // Update in local users state
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === teacherUser.uid
            ? {
                ...u,
                role: "sensei",
                code: newCode,
                classId: teacherSelectedClassIds[0],
                className: tr(
                  `Phụ trách ${teacherSelectedClassIds.length} lớp học`,
                  `In charge of ${teacherSelectedClassIds.length} classes`,
                  `担当 ${teacherSelectedClassIds.length}クラス`
                ),
              }
            : u
        )
      );

      // Update in local classes state
      setClasses((prev) =>
        prev.map((c) =>
          teacherSelectedClassIds.includes(c.id)
            ? { ...c, senseiId: teacherUser.uid, senseiName: teacherUser.fullName }
            : c
        )
      );

      toast.success(
        tr(
          `Đã bổ nhiệm ${teacherUser.fullName} làm Giáo viên (Sensei)!`,
          `Appointed ${teacherUser.fullName} as Instructor (Sensei)!`,
          `${teacherUser.fullName} を講師（Sensei）に任命しました！`
        ),
        {
          description: tr(
            `Phân công phụ trách ${teacherSelectedClassIds.length} lớp học thành công.`,
            `Assigned ${teacherSelectedClassIds.length} classes successfully.`,
            `${teacherSelectedClassIds.length}クラスの担当割り当てが完了しました。`
          ),
        }
      );
      setTeacherUser(null);
    } catch (err) {
      console.error(err);
      toast.error(tr("Không thể hoàn tất bổ nhiệm giáo viên.", "Failed to appoint teacher.", "講師の任命を完了できませんでした。"));
    } finally {
      setIsAssigningTeacher(false);
    }
  };

  // Handle open Role Change modal
  const handleOpenRoleChange = (targetUser: UserProfileDoc) => {
    setRoleChangeUser(targetUser);
    setNewTargetRole(targetUser.role);
  };

  // Submit Role Change
  const handleSaveRoleChange = async () => {
    if (!roleChangeUser) return;

    setIsChangingRole(true);
    try {
      await updateUserRole(roleChangeUser.uid, newTargetRole);

      setUsers((prev) =>
        prev.map((u) =>
          u.uid === roleChangeUser.uid ? { ...u, role: newTargetRole } : u
        )
      );

      toast.success(
        tr(
          `Đã đổi vai trò của ${roleChangeUser.fullName} thành ${newTargetRole.toUpperCase()}!`,
          `Changed role of ${roleChangeUser.fullName} to ${newTargetRole.toUpperCase()}!`,
          `${roleChangeUser.fullName} の権限を ${newTargetRole.toUpperCase()} に変更しました！`
        )
      );
      setRoleChangeUser(null);
    } catch (err) {
      console.error(err);
      toast.error(tr("Không thể thay đổi vai trò người dùng.", "Failed to change user role.", "ユーザー権限を変更できませんでした。"));
    } finally {
      setIsChangingRole(false);
    }
  };

  return (
    <div className="space-y-6 animate-[rise-in_260ms_var(--ease-out-expo)_both]">
      {/* Header */}
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-shinme-line pb-5">
        <div>
          <h1 className="text-2xl font-black text-shinme-ink sm:text-3xl">
            {tr("Quản trị Người dùng & Phân lớp", "User Management & Class Assignment", "ユーザー管理・クラス配属")}
          </h1>
          <p className="mt-1 text-sm font-semibold text-shinme-muted">
            {tr(
              "Tìm kiếm thành viên, xếp lớp cho học viên mới và bổ nhiệm / phân công giảng dạy cho Giáo viên (Sensei)",
              "Search members, assign classes to new students, and appoint/assign teaching responsibilities to Sensei",
              "メンバー検索・新規受講生のクラス配属・講師の任命および担当クラス割り当て"
            )}
          </p>
        </div>
        <Badge tone="warn">
          {tr("Chế độ Quản trị viên", "Administrator Mode", "管理者モード")}
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-4 shadow-[var(--shadow-card)]">
          <p className="text-xs font-bold uppercase tracking-wider text-shinme-muted">
            {tr("Tổng số tài khoản", "Total Accounts", "総アカウント数")}
          </p>
          <p className="tabular mt-1 text-2xl font-black text-shinme-ink">{users.length}</p>
          <p className="mt-0.5 text-xs text-shinme-muted">
            {tr("Đã đăng ký hệ thống", "Registered in system", "システム登録済み")}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-[var(--shadow-card)]">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
            {tr("Khách chưa xếp lớp", "Unassigned Guests", "未配属ゲスト")}
          </p>
          <p className="tabular mt-1 text-2xl font-black text-amber-700">{guestCount}</p>
          <p className="mt-0.5 text-xs text-amber-600 font-semibold">
            {tr("Cần Admin xếp lớp học", "Requires Admin class placement", "管理者による配属待ち")}
          </p>
        </div>

        <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-4 shadow-[var(--shadow-card)]">
          <p className="text-xs font-bold uppercase tracking-wider text-shinme-muted">
            {tr("Học viên chính thức", "Enrolled Students", "正規受講生")}
          </p>
          <p className="tabular mt-1 text-2xl font-black text-shinme-primary">{studentCount}</p>
          <p className="mt-0.5 text-xs text-shinme-muted">
            {tr("Đang theo học tại các lớp", "Currently studying in classes", "各クラスで受講中")}
          </p>
        </div>

        <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-4 shadow-[var(--shadow-card)]">
          <p className="text-xs font-bold uppercase tracking-wider text-shinme-muted">
            {tr("Giáo viên (Sensei)", "Instructors (Sensei)", "講師（Sensei）")}
          </p>
          <p className="tabular mt-1 text-2xl font-black text-shinme-primary">{senseiCount}</p>
          <p className="mt-0.5 text-xs text-shinme-muted">
            {tr("Phụ trách giảng dạy", "In charge of teaching", "授業担当")}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "ALL", label: tr(`Tất cả (${users.length})`, `All (${users.length})`, `すべて (${users.length})`) },
            { id: "guest", label: tr(`Khách (${guestCount})`, `Guests (${guestCount})`, `ゲスト (${guestCount})`) },
            { id: "student", label: tr(`Học viên (${studentCount})`, `Students (${studentCount})`, `受講生 (${studentCount})`) },
            { id: "sensei", label: tr(`Giáo viên (${senseiCount})`, `Sensei (${senseiCount})`, `講師 (${senseiCount})`) },
            { id: "admin", label: `Admin (${adminCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
                roleFilter === tab.id
                  ? "bg-shinme-primary text-white"
                  : "bg-shinme-surface text-shinme-ink-soft border border-shinme-border hover:bg-shinme-leaf"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Class Filter */}
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="h-9 rounded-full border border-shinme-border bg-shinme-surface px-3 text-xs font-bold text-shinme-ink focus:border-shinme-primary focus:outline-none"
          >
            <option value="ALL">{tr("Tất cả lớp học", "All Classes", "すべてのクラス")}</option>
            <option value="UNASSIGNED">{tr("Chưa vào lớp nào", "Unassigned (No Class)", "クラス未配属")}</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.code} — {cls.shortName || cls.name}
              </option>
            ))}
          </select>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-shinme-muted" />
            <input
              type="text"
              placeholder={tr("Tìm theo tên, email, mã HV...", "Search by name, email, code...", "氏名・メール・IDで検索...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-full border border-shinme-border bg-shinme-surface pl-9 pr-4 text-xs font-medium text-shinme-ink placeholder:text-shinme-muted focus:border-shinme-primary focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Users List / Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-shinme-muted space-y-3">
          <Loader2 className="size-8 animate-spin text-shinme-primary" />
          <p className="text-sm font-semibold">
            {tr("Đang tải danh sách người dùng...", "Loading user directory...", "ユーザー一覧を読み込み中...")}
          </p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-shinme-border bg-shinme-surface p-12 text-center">
          <Users className="mx-auto size-12 text-shinme-muted/60" />
          <h3 className="mt-3 text-base font-bold text-shinme-ink">
            {tr("Không tìm thấy người dùng phù hợp", "No matching users found", "該当するユーザーが見つかりません")}
          </h3>
          <p className="mt-1 text-xs text-shinme-muted">
            {tr(
              "Thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc vai trò khác.",
              "Try adjusting your search keywords or selecting a different role filter.",
              "検索キーワードや権限フィルターを変更してお試しください。"
            )}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-shinme-border bg-shinme-surface shadow-[var(--shadow-card)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-shinme-line bg-shinme-bg/60 text-shinme-muted font-black uppercase tracking-wider">
                  <th className="py-3 px-4">{tr("Thành viên", "Member", "メンバー")}</th>
                  <th className="py-3 px-4">{tr("Vai trò", "Role", "権限")}</th>
                  <th className="py-3 px-4">{tr("Lớp học hiện tại", "Current Class", "現在のクラス")}</th>
                  <th className="py-3 px-4">{tr("Mục tiêu JLPT", "JLPT Target", "目標JLPT")}</th>
                  <th className="py-3 px-4 text-right">{tr("Thao tác Admin", "Admin Actions", "管理者操作")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-shinme-line">
                {filteredUsers.map((u) => {
                  const isGuest = u.role === "guest";
                  const isSensei = u.role === "sensei";
                  const isStudent = u.role === "student";
                  const isAdmin = u.role === "admin";

                  return (
                    <tr
                      key={u.uid}
                      className="transition-colors hover:bg-shinme-leaf-faint/50"
                    >
                      {/* User Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            src={u.avatarUrl}
                            fallbackText={u.avatarText || u.fullName.slice(0, 2)}
                            alt={u.fullName}
                            size="sm"
                            className="rounded-xl"
                            fallbackClassName="rounded-xl"
                          />
                          <div>
                            <p className="font-black text-shinme-ink text-sm leading-tight">{u.fullName}</p>
                            <p className="font-mono text-xs text-shinme-muted">{u.email}</p>
                            <span className="font-mono text-xs font-bold text-shinme-primary bg-shinme-leaf/60 px-1.5 py-0.5 rounded">
                              {u.code || u.uid.slice(0, 8)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        {isGuest && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 border border-amber-300/80 px-2.5 py-1 text-xs font-black text-amber-800">
                            {tr("Khách (Chưa xếp lớp)", "Guest (Unassigned)", "ゲスト（未配属）")}
                          </span>
                        )}
                        {isStudent && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-shinme-bg border border-shinme-border px-2.5 py-1 text-xs font-black text-shinme-ink">
                            {tr("Học viên", "Student", "受講生")}
                          </span>
                        )}
                        {isSensei && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-shinme-leaf border border-shinme-primary/20 px-2.5 py-1 text-xs font-black text-shinme-primary">
                            {tr("Giáo viên (Sensei)", "Teacher (Sensei)", "講師（Sensei）")}
                          </span>
                        )}
                        {isAdmin && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-shinme-warn-soft border border-[#8a5a12]/20 px-2.5 py-1 text-xs font-black text-[#8a5a12]">
                            {tr("Quản trị viên", "Administrator", "管理者")}
                          </span>
                        )}
                      </td>

                      {/* Class */}
                      <td className="py-3.5 px-4">
                        {u.classId ? (
                          <div className="space-y-0.5">
                            <p className="font-bold text-shinme-ink text-xs">{u.className || u.classId}</p>
                            <span className="font-mono text-xs text-shinme-muted">{u.classId}</span>
                          </div>
                        ) : (
                          <span className="italic text-xs text-shinme-muted font-medium">
                            {tr("— Chưa vào lớp —", "— Unassigned —", "— 未配属 —")}
                          </span>
                        )}
                      </td>

                      {/* JLPT Target / Phone */}
                      <td className="py-3.5 px-4">
                        {u.targetJLPT ? (
                          <Badge tone="leaf">{u.targetJLPT}</Badge>
                        ) : (
                          <span className="text-xs text-shinme-muted">
                            {tr("Tự do", "None / Free", "未設定")}
                          </span>
                        )}
                        {u.phone && <p className="text-xs text-shinme-muted mt-1">{u.phone}</p>}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                          {/* Assign Class Button */}
                          <Button
                            size="sm"
                            variant={isGuest ? "primary" : "outline"}
                            onClick={() => handleOpenAssignClass(u)}
                            className="text-xs font-bold"
                          >
                            <GraduationCap className="size-3.5" />
                            {isGuest
                              ? tr("Xếp vào lớp", "Assign Class", "クラス配属")
                              : tr("Chuyển lớp", "Transfer Class", "クラス変更")}
                          </Button>

                          {/* Assign Teacher Button */}
                          {!isAdmin && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenAssignTeacher(u)}
                              className="text-xs font-bold text-shinme-primary hover:bg-shinme-leaf"
                              title={tr("Bổ nhiệm làm Giáo viên và phân lớp phụ trách", "Appoint as Sensei and assign teaching classes", "講師に任命して担当クラスを割り当て")}
                            >
                              <UserCheck className="size-3.5" />
                              {isSensei
                                ? tr("Phân lớp dạy", "Assign Classes", "担当クラス")
                                : tr("Gán làm Giáo viên", "Appoint Sensei", "講師に任命")}
                            </Button>
                          )}

                          {/* Change Role Button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenRoleChange(u)}
                            className="text-xs font-medium text-shinme-muted hover:text-shinme-ink"
                            title={tr("Thay đổi vai trò", "Change User Role", "権限を変更")}
                          >
                            <UserCog className="size-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Assign Class to User */}
      {assignUser && (
        <Dialog open={true} onOpenChange={(open) => !open && setAssignUser(null)}>
          <DialogContent className="max-w-md">
            <div className="p-6 space-y-4">
              <div>
                <DialogTitle className="text-lg font-black text-shinme-ink flex items-center gap-2">
                  <GraduationCap className="size-5 text-shinme-primary" />
                  {tr("Xếp lớp cho người dùng", "Assign User to Class", "ユーザーのクラス配属")}
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs text-shinme-muted">
                  {tr("Thành viên:", "Member:", "メンバー：")}{" "}
                  <strong className="text-shinme-ink font-bold">{assignUser.fullName}</strong> ({assignUser.email})
                </DialogDescription>
              </div>

              <div className="rounded-xl bg-shinme-bg p-3.5 border border-shinme-line text-xs space-y-1">
                <p>
                  {tr("Vai trò hiện tại:", "Current Role:", "現在の権限：")}{" "}
                  <strong className="uppercase text-shinme-primary">{assignUser.role}</strong>
                </p>
                <p>
                  {tr("Lớp hiện tại:", "Current Class:", "現在のクラス：")}{" "}
                  <strong>{assignUser.className || tr("Chưa vào lớp", "Unassigned", "未配属")}</strong>
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-shinme-ink">
                  {tr("Chọn lớp học tiếp nhận:", "Select target class:", "配属先クラスを選択：")}
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="h-10 w-full rounded-xl border border-shinme-border bg-shinme-surface px-3 text-xs font-bold text-shinme-ink focus:border-shinme-primary focus:outline-none"
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.code} — {cls.name} ({cls.level})
                    </option>
                  ))}
                </select>
              </div>

              {assignUser.role === "guest" && (
                <label className="flex items-start gap-2.5 rounded-xl bg-shinme-leaf-faint p-3 border border-shinme-accent-soft/40 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoPromoteToStudent}
                    onChange={(e) => setAutoPromoteToStudent(e.target.checked)}
                    className="mt-0.5 rounded border-shinme-border text-shinme-primary focus:ring-shinme-primary"
                  />
                  <span className="text-xs text-shinme-ink font-medium leading-relaxed">
                    {tr(
                      "Tự động nâng cấp vai trò từ Khách thành Học viên chính thức (cấp mã HV-...)",
                      "Automatically promote role from Guest to Enrolled Student (assign HV-... student code)",
                      "ゲストから正規受講生へ自動的に権限を昇格し、受講生ID（HV-...）を付与する"
                    )}
                  </span>
                </label>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-shinme-line">
                <Button variant="ghost" size="sm" onClick={() => setAssignUser(null)}>
                  {tr("Hủy", "Cancel", "キャンセル")}
                </Button>
                <Button size="sm" onClick={handleSaveClassAssignment} disabled={isAssigning}>
                  {isAssigning ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> {tr("Đang xếp lớp...", "Assigning...", "配属中...")}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4" /> {tr("Xác nhận xếp lớp", "Confirm Assignment", "配属を確定")}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal 2: Assign Teacher & Classes */}
      {teacherUser && (
        <Dialog open={true} onOpenChange={(open) => !open && setTeacherUser(null)}>
          <DialogContent className="max-w-lg">
            <div className="p-6 space-y-4">
              <div>
                <DialogTitle className="text-lg font-black text-shinme-ink flex items-center gap-2">
                  <UserCheck className="size-5 text-shinme-primary" />
                  {tr("Bổ nhiệm Giáo viên (Sensei) & Phân lớp", "Appoint Teacher (Sensei) & Assign Classes", "講師（Sensei）任命・担当クラス割り当て")}
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs text-shinme-muted">
                  {tr("Giáo viên:", "Instructor:", "講師：")}{" "}
                  <strong className="text-shinme-ink font-bold">{teacherUser.fullName}</strong> ({teacherUser.email})
                </DialogDescription>
              </div>

              <div className="rounded-xl bg-shinme-leaf-faint p-3 border border-shinme-accent-soft/40 text-xs text-shinme-ink-soft leading-relaxed">
                {tr(
                  "Khi xác nhận, người dùng này sẽ nhận vai trò Giáo viên (Sensei), cấp mã định danh Sensei (SS-...), và hệ thống sẽ cập nhật tên giáo viên phụ trách vào các lớp học được tích chọn bên dưới.",
                  "Upon confirmation, this user will receive the Teacher (Sensei) role, be assigned a Sensei identifier (SS-...), and the system will update the assigned instructor for all selected classes below.",
                  "確定するとこのユーザーに講師（Sensei）権限と講師ID（SS-...）が付与され、選択したクラスの担当講師が更新されます。"
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-shinme-ink">
                  {tr("Chọn các lớp học phân công cho Sensei giảng dạy:", "Select classes assigned to Sensei for teaching:", "担当するクラスを選択：")}
                </label>
                <div className="space-y-2 max-h-56 overflow-y-auto p-1 border border-shinme-border rounded-xl">
                  {classes.map((cls) => {
                    const isChecked = teacherSelectedClassIds.includes(cls.id);
                    return (
                      <label
                        key={cls.id}
                        className={`flex items-center justify-between gap-3 p-3 rounded-lg border text-xs cursor-pointer transition-colors ${
                          isChecked
                            ? "bg-shinme-leaf border-shinme-primary text-shinme-primary"
                            : "bg-shinme-surface border-shinme-border text-shinme-ink hover:bg-shinme-bg"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleTeacherClass(cls.id)}
                            className="rounded border-shinme-border text-shinme-primary focus:ring-shinme-primary"
                          />
                          <div>
                            <span className="font-black">{cls.code}</span> — {cls.shortName || cls.name}
                            <p className="text-xs opacity-75 font-medium">
                              {tr(`Lịch học: ${cls.schedule} (${cls.time})`, `Schedule: ${cls.schedule} (${cls.time})`, `授業日程：${cls.schedule}（${cls.time}）`)}
                            </p>
                          </div>
                        </div>
                        <Badge tone="neutral">{cls.level}</Badge>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-shinme-line">
                <Button variant="ghost" size="sm" onClick={() => setTeacherUser(null)}>
                  {tr("Hủy", "Cancel", "キャンセル")}
                </Button>
                <Button size="sm" onClick={handleSaveTeacherAssignment} disabled={isAssigningTeacher}>
                  {isAssigningTeacher ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> {tr("Đang xử lý...", "Processing...", "処理中...")}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4" /> {tr("Bổ nhiệm & Lưu phân công", "Appoint & Save Assignments", "任命して保存")}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal 3: Change User Role */}
      {roleChangeUser && (
        <Dialog open={true} onOpenChange={(open) => !open && setRoleChangeUser(null)}>
          <DialogContent className="max-w-md">
            <div className="p-6 space-y-4">
              <div>
                <DialogTitle className="text-lg font-black text-shinme-ink flex items-center gap-2">
                  <UserCog className="size-5 text-shinme-primary" />
                  {tr("Thay đổi vai trò người dùng", "Change User Role", "ユーザー権限を変更")}
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs text-shinme-muted">
                  {tr("Thành viên:", "Member:", "メンバー：")}{" "}
                  <strong className="text-shinme-ink font-bold">{roleChangeUser.fullName}</strong> ({roleChangeUser.email})
                </DialogDescription>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-shinme-ink">
                  {tr("Chọn vai trò mới:", "Select new role:", "新しい権限を選択：")}
                </label>
                <select
                  value={newTargetRole}
                  onChange={(e) => setNewTargetRole(e.target.value as RoleId)}
                  className="h-10 w-full rounded-xl border border-shinme-border bg-shinme-surface px-3 text-xs font-bold text-shinme-ink focus:border-shinme-primary focus:outline-none"
                >
                  <option value="guest">{tr("Khách (Chưa xếp lớp)", "Guest (Unassigned)", "ゲスト（未配属）")}</option>
                  <option value="student">{tr("Học viên chính thức", "Enrolled Student", "正規受講生")}</option>
                  <option value="sensei">{tr("Giáo viên (Sensei)", "Teacher (Sensei)", "講師（Sensei）")}</option>
                  <option value="admin">{tr("Quản trị viên (Admin)", "Administrator (Admin)", "管理者（Admin）")}</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-shinme-line">
                <Button variant="ghost" size="sm" onClick={() => setRoleChangeUser(null)}>
                  {tr("Hủy", "Cancel", "キャンセル")}
                </Button>
                <Button size="sm" onClick={handleSaveRoleChange} disabled={isChangingRole}>
                  {isChangingRole ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> {tr("Đang cập nhật...", "Updating...", "更新中...")}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4" /> {tr("Lưu vai trò", "Save Role", "権限を保存")}
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
