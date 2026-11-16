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
  const { lang, t } = useTranslation();

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
      toast.error(lang === "vi" ? "Không thể tải danh sách người dùng." : "Failed to load user list.");
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
          {lang === "vi" ? "Quyền truy cập hạn chế" : "Restricted Access"}
        </h2>
        <p className="text-sm text-shinme-muted max-w-md mx-auto">
          {lang === "vi"
            ? "Chức năng Quản lý Người dùng & Phân lớp chỉ dành cho vai trò Quản trị viên (Admin)."
            : "User Management & Class Placement is reserved for Administrator (Admin) roles."}
        </p>
        <Button asChild size="sm">
          <Link href="/portal">{lang === "vi" ? "Quay về Tổng quan" : "Back to Overview"}</Link>
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
        lang === "vi"
          ? `Đã xếp ${assignUser.fullName} vào lớp ${targetCls.name}!`
          : `Assigned ${assignUser.fullName} to class ${targetCls.name}!`,
        {
          description:
            autoPromoteToStudent && assignUser.role === "guest"
              ? (lang === "vi" ? "Vai trò đã được nâng cấp thành Học viên chính thức." : "Role upgraded to Official Student.")
              : undefined,
        }
      );
      setAssignUser(null);
    } catch (err) {
      console.error(err);
      toast.error(lang === "vi" ? "Không thể cập nhật lớp học cho người dùng này." : "Failed to update class assignment.");
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
      toast.error(lang === "vi" ? "Vui lòng chọn ít nhất 1 lớp học để phân công cho Sensei!" : "Please select at least 1 class for Sensei!");
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
                className: lang === "vi" ? `Phụ trách ${teacherSelectedClassIds.length} lớp học` : `In charge of ${teacherSelectedClassIds.length} classes`,
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
        lang === "vi"
          ? `Đã bổ nhiệm ${teacherUser.fullName} làm Giáo viên (Sensei)!`
          : `Appointed ${teacherUser.fullName} as Instructor (Sensei)!`,
        {
          description:
            lang === "vi"
              ? `Phân công phụ trách ${teacherSelectedClassIds.length} lớp học thành công.`
              : `Assigned ${teacherSelectedClassIds.length} classes successfully.`,
        }
      );
      setTeacherUser(null);
    } catch (err) {
      console.error(err);
      toast.error(lang === "vi" ? "Không thể hoàn tất bổ nhiệm giáo viên." : "Failed to appoint teacher.");
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
        lang === "vi"
          ? `Đã đổi vai trò của ${roleChangeUser.fullName} thành ${newTargetRole.toUpperCase()}!`
          : `Changed role of ${roleChangeUser.fullName} to ${newTargetRole.toUpperCase()}!`
      );
      setRoleChangeUser(null);
    } catch (err) {
      console.error(err);
      toast.error(lang === "vi" ? "Không thể thay đổi vai trò người dùng." : "Failed to change user role.");
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
            {lang === "vi" ? "Quản trị Người dùng & Phân lớp" : "User Management & Class Assignment"}
          </h1>
          <p className="mt-1 text-sm font-semibold text-shinme-muted">
            {lang === "vi"
              ? "Tìm kiếm thành viên, xếp lớp cho học viên mới và bổ nhiệm / phân công giảng dạy cho Giáo viên (Sensei)"
              : "Search members, assign classes to new students, and appoint/assign teaching responsibilities to Sensei"}
          </p>
        </div>
        <Badge tone="warn">
          {lang === "vi" ? "Chế độ Quản trị viên" : "Administrator Mode"}
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-4 shadow-[var(--shadow-card)]">
          <p className="text-xs font-bold uppercase tracking-wider text-shinme-muted">
            {lang === "vi" ? "Tổng số tài khoản" : "Total Accounts"}
          </p>
          <p className="tabular mt-1 text-2xl font-black text-shinme-ink">{users.length}</p>
          <p className="mt-0.5 text-xs text-shinme-muted">
            {lang === "vi" ? "Đã đăng ký hệ thống" : "Registered in system"}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-[var(--shadow-card)]">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
            {lang === "vi" ? "Khách chưa xếp lớp" : "Unassigned Guests"}
          </p>
          <p className="tabular mt-1 text-2xl font-black text-amber-700">{guestCount}</p>
          <p className="mt-0.5 text-xs text-amber-600 font-semibold">
            {lang === "vi" ? "Cần Admin xếp lớp học" : "Requires Admin class placement"}
          </p>
        </div>

        <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-4 shadow-[var(--shadow-card)]">
          <p className="text-xs font-bold uppercase tracking-wider text-shinme-muted">
            {lang === "vi" ? "Học viên chính thức" : "Enrolled Students"}
          </p>
          <p className="tabular mt-1 text-2xl font-black text-shinme-primary">{studentCount}</p>
          <p className="mt-0.5 text-xs text-shinme-muted">
            {lang === "vi" ? "Đang theo học tại các lớp" : "Currently studying in classes"}
          </p>
        </div>

        <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-4 shadow-[var(--shadow-card)]">
          <p className="text-xs font-bold uppercase tracking-wider text-shinme-muted">
            {lang === "vi" ? "Giáo viên (Sensei)" : "Instructors (Sensei)"}
          </p>
          <p className="tabular mt-1 text-2xl font-black text-shinme-primary">{senseiCount}</p>
          <p className="mt-0.5 text-xs text-shinme-muted">
            {lang === "vi" ? "Phụ trách giảng dạy" : "In charge of teaching"}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "ALL", label: lang === "vi" ? `Tất cả (${users.length})` : `All (${users.length})` },
            { id: "guest", label: lang === "vi" ? `Khách (${guestCount})` : `Guests (${guestCount})` },
            { id: "student", label: lang === "vi" ? `Học viên (${studentCount})` : `Students (${studentCount})` },
            { id: "sensei", label: lang === "vi" ? `Giáo viên (${senseiCount})` : `Sensei (${senseiCount})` },
            { id: "admin", label: lang === "vi" ? `Admin (${adminCount})` : `Admin (${adminCount})` },
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
            <option value="ALL">{lang === "vi" ? "Tất cả lớp học" : "All Classes"}</option>
            <option value="UNASSIGNED">{lang === "vi" ? "Chưa vào lớp nào" : "Unassigned (No Class)"}</option>
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
              placeholder={lang === "vi" ? "Tìm theo tên, email, mã HV..." : "Search by name, email, code..."}
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
            {lang === "vi" ? "Đang tải danh sách người dùng..." : "Loading user directory..."}
          </p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-shinme-border bg-shinme-surface p-12 text-center">
          <Users className="mx-auto size-12 text-shinme-muted/60" />
          <h3 className="mt-3 text-base font-bold text-shinme-ink">
            {lang === "vi" ? "Không tìm thấy người dùng phù hợp" : "No matching users found"}
          </h3>
          <p className="mt-1 text-xs text-shinme-muted">
            {lang === "vi"
              ? "Thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc vai trò khác."
              : "Try adjusting your search keywords or selecting a different role filter."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-shinme-border bg-shinme-surface shadow-[var(--shadow-card)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-shinme-line bg-shinme-bg/60 text-shinme-muted font-black uppercase tracking-wider">
                  <th className="py-3 px-4">{lang === "vi" ? "Thành viên" : "Member"}</th>
                  <th className="py-3 px-4">{lang === "vi" ? "Vai trò" : "Role"}</th>
                  <th className="py-3 px-4">{lang === "vi" ? "Lớp học hiện tại" : "Current Class"}</th>
                  <th className="py-3 px-4">{lang === "vi" ? "Mục tiêu JLPT" : "JLPT Target"}</th>
                  <th className="py-3 px-4 text-right">{lang === "vi" ? "Thao tác Admin" : "Admin Actions"}</th>
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
                            {lang === "vi" ? "Khách (Chưa xếp lớp)" : "Guest (Unassigned)"}
                          </span>
                        )}
                        {isStudent && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-shinme-bg border border-shinme-border px-2.5 py-1 text-xs font-black text-shinme-ink">
                            {lang === "vi" ? "Học viên" : "Student"}
                          </span>
                        )}
                        {isSensei && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-shinme-leaf border border-shinme-primary/20 px-2.5 py-1 text-xs font-black text-shinme-primary">
                            {lang === "vi" ? "Giáo viên (Sensei)" : "Teacher (Sensei)"}
                          </span>
                        )}
                        {isAdmin && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-shinme-warn-soft border border-[#8a5a12]/20 px-2.5 py-1 text-xs font-black text-[#8a5a12]">
                            {lang === "vi" ? "Quản trị viên" : "Administrator"}
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
                            {lang === "vi" ? "— Chưa vào lớp —" : "— Unassigned —"}
                          </span>
                        )}
                      </td>

                      {/* JLPT Target / Phone */}
                      <td className="py-3.5 px-4">
                        {u.targetJLPT ? (
                          <Badge tone="leaf">{u.targetJLPT}</Badge>
                        ) : (
                          <span className="text-xs text-shinme-muted">
                            {lang === "vi" ? "Tự do" : "None / Free"}
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
                              ? (lang === "vi" ? "Xếp vào lớp" : "Assign Class")
                              : (lang === "vi" ? "Chuyển lớp" : "Transfer Class")}
                          </Button>

                          {/* Assign Teacher Button */}
                          {!isAdmin && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenAssignTeacher(u)}
                              className="text-xs font-bold text-shinme-primary hover:bg-shinme-leaf"
                              title={lang === "vi" ? "Bổ nhiệm làm Giáo viên và phân lớp phụ trách" : "Appoint as Sensei and assign teaching classes"}
                            >
                              <UserCheck className="size-3.5" />
                              {isSensei
                                ? (lang === "vi" ? "Phân lớp dạy" : "Assign Classes")
                                : (lang === "vi" ? "Gán làm Giáo viên" : "Appoint Sensei")}
                            </Button>
                          )}

                          {/* Change Role Button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenRoleChange(u)}
                            className="text-xs font-medium text-shinme-muted hover:text-shinme-ink"
                            title={lang === "vi" ? "Thay đổi vai trò" : "Change User Role"}
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
                  {lang === "vi" ? "Xếp lớp cho người dùng" : "Assign User to Class"}
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs text-shinme-muted">
                  {lang === "vi" ? "Thành viên:" : "Member:"}{" "}
                  <strong className="text-shinme-ink font-bold">{assignUser.fullName}</strong> ({assignUser.email})
                </DialogDescription>
              </div>

              <div className="rounded-xl bg-shinme-bg p-3.5 border border-shinme-line text-xs space-y-1">
                <p>
                  {lang === "vi" ? "Vai trò hiện tại:" : "Current Role:"}{" "}
                  <strong className="uppercase text-shinme-primary">{assignUser.role}</strong>
                </p>
                <p>
                  {lang === "vi" ? "Lớp hiện tại:" : "Current Class:"}{" "}
                  <strong>{assignUser.className || (lang === "vi" ? "Chưa vào lớp" : "Unassigned")}</strong>
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-shinme-ink">
                  {lang === "vi" ? "Chọn lớp học tiếp nhận:" : "Select target class:"}
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
                    {lang === "vi" ? (
                      <>Tự động nâng cấp vai trò từ <strong>Khách</strong> thành <strong>Học viên chính thức</strong> (cấp mã HV-...)</>
                    ) : (
                      <>Automatically promote role from <strong>Guest</strong> to <strong>Enrolled Student</strong> (assign HV-... student code)</>
                    )}
                  </span>
                </label>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-shinme-line">
                <Button variant="ghost" size="sm" onClick={() => setAssignUser(null)}>
                  {lang === "vi" ? "Hủy" : "Cancel"}
                </Button>
                <Button size="sm" onClick={handleSaveClassAssignment} disabled={isAssigning}>
                  {isAssigning ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> {lang === "vi" ? "Đang xếp lớp..." : "Assigning..."}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4" /> {lang === "vi" ? "Xác nhận xếp lớp" : "Confirm Assignment"}
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
                  {lang === "vi" ? "Bổ nhiệm Giáo viên (Sensei) & Phân lớp" : "Appoint Teacher (Sensei) & Assign Classes"}
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs text-shinme-muted">
                  {lang === "vi" ? "Giáo viên:" : "Instructor:"}{" "}
                  <strong className="text-shinme-ink font-bold">{teacherUser.fullName}</strong> ({teacherUser.email})
                </DialogDescription>
              </div>

              <div className="rounded-xl bg-shinme-leaf-faint p-3 border border-shinme-accent-soft/40 text-xs text-shinme-ink-soft leading-relaxed">
                {lang === "vi" ? (
                  <>Khi xác nhận, người dùng này sẽ nhận vai trò <strong>Giáo viên (Sensei)</strong>, cấp mã định danh Sensei (<code>SS-...</code>), và hệ thống sẽ cập nhật tên giáo viên phụ trách vào các lớp học được tích chọn bên dưới.</>
                ) : (
                  <>Upon confirmation, this user will receive the <strong>Teacher (Sensei)</strong> role, be assigned a Sensei identifier (<code>SS-...</code>), and the system will update the assigned instructor for all selected classes below.</>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-shinme-ink">
                  {lang === "vi" ? "Chọn các lớp học phân công cho Sensei giảng dạy:" : "Select classes assigned to Sensei for teaching:"}
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
                              {lang === "vi" ? `Lịch học: ${cls.schedule} (${cls.time})` : `Schedule: ${cls.schedule} (${cls.time})`}
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
                  {lang === "vi" ? "Hủy" : "Cancel"}
                </Button>
                <Button size="sm" onClick={handleSaveTeacherAssignment} disabled={isAssigningTeacher}>
                  {isAssigningTeacher ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> {lang === "vi" ? "Đang xử lý..." : "Processing..."}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4" /> {lang === "vi" ? "Bổ nhiệm & Lưu phân công" : "Appoint & Save Assignments"}
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
                  {lang === "vi" ? "Thay đổi vai trò người dùng" : "Change User Role"}
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs text-shinme-muted">
                  {lang === "vi" ? "Thành viên:" : "Member:"}{" "}
                  <strong className="text-shinme-ink font-bold">{roleChangeUser.fullName}</strong> ({roleChangeUser.email})
                </DialogDescription>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-shinme-ink">
                  {lang === "vi" ? "Chọn vai trò mới:" : "Select new role:"}
                </label>
                <select
                  value={newTargetRole}
                  onChange={(e) => setNewTargetRole(e.target.value as RoleId)}
                  className="h-10 w-full rounded-xl border border-shinme-border bg-shinme-surface px-3 text-xs font-bold text-shinme-ink focus:border-shinme-primary focus:outline-none"
                >
                  <option value="guest">{lang === "vi" ? "Khách (Chưa xếp lớp)" : "Guest (Unassigned)"}</option>
                  <option value="student">{lang === "vi" ? "Học viên chính thức" : "Enrolled Student"}</option>
                  <option value="sensei">{lang === "vi" ? "Giáo viên (Sensei)" : "Teacher (Sensei)"}</option>
                  <option value="admin">{lang === "vi" ? "Quản trị viên (Admin)" : "Administrator (Admin)"}</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-shinme-line">
                <Button variant="ghost" size="sm" onClick={() => setRoleChangeUser(null)}>
                  {lang === "vi" ? "Hủy" : "Cancel"}
                </Button>
                <Button size="sm" onClick={handleSaveRoleChange} disabled={isChangingRole}>
                  {isChangingRole ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> {lang === "vi" ? "Đang cập nhật..." : "Updating..."}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4" /> {lang === "vi" ? "Lưu vai trò" : "Save Role"}
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
