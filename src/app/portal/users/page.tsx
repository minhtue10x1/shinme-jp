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
      toast.error("Không thể tải danh sách người dùng.");
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
        <h2 className="text-xl font-bold text-shinme-ink">Quyền truy cập hạn chế</h2>
        <p className="text-sm text-shinme-muted max-w-md mx-auto">
          Chức năng Quản lý Người dùng & Phân lớp chỉ dành cho vai trò <strong>Quản trị viên (Admin)</strong>.
        </p>
        <Button asChild size="sm">
          <Link href="/portal">Quay về Tổng quan</Link>
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

      toast.success(`Đã xếp ${assignUser.fullName} vào lớp ${targetCls.name}!`, {
        description: autoPromoteToStudent && assignUser.role === "guest"
          ? "Vai trò đã được nâng cấp thành Học viên chính thức."
          : undefined,
      });
      setAssignUser(null);
    } catch (err) {
      console.error(err);
      toast.error("Không thể cập nhật lớp học cho người dùng này.");
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
      toast.error("Vui lòng chọn ít nhất 1 lớp học để phân công cho Sensei!");
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
                className: `Phụ trách ${teacherSelectedClassIds.length} lớp học`,
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

      toast.success(`Đã bổ nhiệm ${teacherUser.fullName} làm Giáo viên (Sensei)!`, {
        description: `Phân công phụ trách ${teacherSelectedClassIds.length} lớp học thành công.`,
      });
      setTeacherUser(null);
    } catch (err) {
      console.error(err);
      toast.error("Không thể hoàn tất bổ nhiệm giáo viên.");
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

      toast.success(`Đã đổi vai trò của ${roleChangeUser.fullName} thành ${newTargetRole.toUpperCase()}!`);
      setRoleChangeUser(null);
    } catch (err) {
      console.error(err);
      toast.error("Không thể thay đổi vai trò người dùng.");
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
            Quản trị Người dùng & Phân lớp
          </h1>
          <p className="mt-1 text-sm font-semibold text-shinme-muted">
            Tìm kiếm thành viên, xếp lớp cho học viên mới và bổ nhiệm / phân công giảng dạy cho Giáo viên (Sensei)
          </p>
        </div>
        <Badge tone="warn">Chế độ Quản trị viên</Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-4 shadow-[var(--shadow-card)]">
          <p className="text-xs font-bold uppercase tracking-wider text-shinme-muted">Tổng số tài khoản</p>
          <p className="tabular mt-1 text-2xl font-black text-shinme-ink">{users.length}</p>
          <p className="mt-0.5 text-xs text-shinme-muted">Đã đăng ký hệ thống</p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-[var(--shadow-card)]">
          <p className="text-xs font-bold uppercase tracking-wider text-amber-800">Khách chưa xếp lớp</p>
          <p className="tabular mt-1 text-2xl font-black text-amber-700">{guestCount}</p>
          <p className="mt-0.5 text-xs text-amber-600 font-semibold">Cần Admin xếp lớp học</p>
        </div>

        <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-4 shadow-[var(--shadow-card)]">
          <p className="text-xs font-bold uppercase tracking-wider text-shinme-muted">Học viên chính thức</p>
          <p className="tabular mt-1 text-2xl font-black text-shinme-primary">{studentCount}</p>
          <p className="mt-0.5 text-xs text-shinme-muted">Đang theo học tại các lớp</p>
        </div>

        <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-4 shadow-[var(--shadow-card)]">
          <p className="text-xs font-bold uppercase tracking-wider text-shinme-muted">Giáo viên (Sensei)</p>
          <p className="tabular mt-1 text-2xl font-black text-shinme-primary">{senseiCount}</p>
          <p className="mt-0.5 text-xs text-shinme-muted">Phụ trách giảng dạy</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "ALL", label: `Tất cả (${users.length})` },
            { id: "guest", label: `Khách (${guestCount})` },
            { id: "student", label: `Học viên (${studentCount})` },
            { id: "sensei", label: `Giáo viên (${senseiCount})` },
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
            <option value="ALL">Tất cả lớp học</option>
            <option value="UNASSIGNED">Chưa vào lớp nào</option>
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
              placeholder="Tìm theo tên, email, mã HV..."
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
          <p className="text-sm font-semibold">Đang tải danh sách người dùng từ Firestore...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-shinme-border bg-shinme-surface p-12 text-center">
          <Users className="mx-auto size-12 text-shinme-muted/60" />
          <h3 className="mt-3 text-base font-bold text-shinme-ink">Không tìm thấy người dùng phù hợp</h3>
          <p className="mt-1 text-xs text-shinme-muted">
            Thử thay đổi từ khóa tìm kiếm hoặc chọn bộ lọc vai trò khác.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-shinme-border bg-shinme-surface shadow-[var(--shadow-card)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-shinme-line bg-shinme-bg/60 text-shinme-muted font-black uppercase tracking-wider">
                  <th className="py-3 px-4">Thành viên</th>
                  <th className="py-3 px-4">Vai trò</th>
                  <th className="py-3 px-4">Lớp học hiện tại</th>
                  <th className="py-3 px-4">Mục tiêu JLPT</th>
                  <th className="py-3 px-4 text-right">Thao tác Admin</th>
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
                            Khách (Chưa xếp lớp)
                          </span>
                        )}
                        {isStudent && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-shinme-bg border border-shinme-border px-2.5 py-1 text-xs font-black text-shinme-ink">
                            Học viên
                          </span>
                        )}
                        {isSensei && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-shinme-leaf border border-shinme-primary/20 px-2.5 py-1 text-xs font-black text-shinme-primary">
                            Giáo viên (Sensei)
                          </span>
                        )}
                        {isAdmin && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-shinme-warn-soft border border-[#8a5a12]/20 px-2.5 py-1 text-xs font-black text-[#8a5a12]">
                            Quản trị viên
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
                            — Chưa vào lớp —
                          </span>
                        )}
                      </td>

                      {/* JLPT Target / Phone */}
                      <td className="py-3.5 px-4">
                        {u.targetJLPT ? (
                          <Badge tone="leaf">{u.targetJLPT}</Badge>
                        ) : (
                          <span className="text-xs text-shinme-muted">Tự do</span>
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
                            {isGuest ? "Xếp vào lớp" : "Chuyển lớp"}
                          </Button>

                          {/* Assign Teacher Button */}
                          {!isAdmin && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenAssignTeacher(u)}
                              className="text-xs font-bold text-shinme-primary hover:bg-shinme-leaf"
                              title="Bổ nhiệm làm Giáo viên và phân lớp phụ trách"
                            >
                              <UserCheck className="size-3.5" />
                              {isSensei ? "Phân lớp dạy" : "Gán làm Giáo viên"}
                            </Button>
                          )}

                          {/* Change Role Button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleOpenRoleChange(u)}
                            className="text-xs font-medium text-shinme-muted hover:text-shinme-ink"
                            title="Thay đổi vai trò"
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
                  <GraduationCap className="size-5 text-shinme-primary" /> Xếp lớp cho người dùng
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs text-shinme-muted">
                  Thành viên: <strong className="text-shinme-ink font-bold">{assignUser.fullName}</strong> ({assignUser.email})
                </DialogDescription>
              </div>

              <div className="rounded-xl bg-shinme-bg p-3.5 border border-shinme-line text-xs space-y-1">
                <p>Vai trò hiện tại: <strong className="uppercase text-shinme-primary">{assignUser.role}</strong></p>
                <p>Lớp hiện tại: <strong>{assignUser.className || "Chưa vào lớp"}</strong></p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-shinme-ink">
                  Chọn lớp học tiếp nhận:
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
                    Tự động nâng cấp vai trò từ <strong>Khách</strong> thành <strong>Học viên chính thức</strong> (cấp mã HV-...)
                  </span>
                </label>
              )}

              <div className="flex justify-end gap-3 pt-3 border-t border-shinme-line">
                <Button variant="ghost" size="sm" onClick={() => setAssignUser(null)}>
                  Hủy
                </Button>
                <Button size="sm" onClick={handleSaveClassAssignment} disabled={isAssigning}>
                  {isAssigning ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Đang xếp lớp...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4" /> Xác nhận xếp lớp
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
                  <UserCheck className="size-5 text-shinme-primary" /> Bổ nhiệm Giáo viên (Sensei) & Phân lớp
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs text-shinme-muted">
                  Giáo viên: <strong className="text-shinme-ink font-bold">{teacherUser.fullName}</strong> ({teacherUser.email})
                </DialogDescription>
              </div>

              <div className="rounded-xl bg-shinme-leaf-faint p-3 border border-shinme-accent-soft/40 text-xs text-shinme-ink-soft leading-relaxed">
                Khi xác nhận, người dùng này sẽ nhận vai trò <strong>Giáo viên (Sensei)</strong>, cấp mã định danh Sensei (<code>SS-...</code>), và hệ thống sẽ cập nhật tên giáo viên phụ trách vào các lớp học được tích chọn bên dưới.
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-shinme-ink">
                  Chọn các lớp học phân công cho Sensei giảng dạy:
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
                              Lịch học: {cls.schedule} ({cls.time})
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
                  Hủy
                </Button>
                <Button size="sm" onClick={handleSaveTeacherAssignment} disabled={isAssigningTeacher}>
                  {isAssigningTeacher ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Đang xử lý...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4" /> Bổ nhiệm & Lưu phân công
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
                  <UserCog className="size-5 text-shinme-primary" /> Thay đổi vai trò người dùng
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs text-shinme-muted">
                  Thành viên: <strong className="text-shinme-ink font-bold">{roleChangeUser.fullName}</strong> ({roleChangeUser.email})
                </DialogDescription>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase text-shinme-ink">
                  Chọn vai trò mới:
                </label>
                <select
                  value={newTargetRole}
                  onChange={(e) => setNewTargetRole(e.target.value as RoleId)}
                  className="h-10 w-full rounded-xl border border-shinme-border bg-shinme-surface px-3 text-xs font-bold text-shinme-ink focus:border-shinme-primary focus:outline-none"
                >
                  <option value="guest">Khách (Chưa xếp lớp)</option>
                  <option value="student">Học viên chính thức</option>
                  <option value="sensei">Giáo viên (Sensei)</option>
                  <option value="admin">Quản trị viên (Admin)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-shinme-line">
                <Button variant="ghost" size="sm" onClick={() => setRoleChangeUser(null)}>
                  Hủy
                </Button>
                <Button size="sm" onClick={handleSaveRoleChange} disabled={isChangingRole}>
                  {isChangingRole ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Đang cập nhật...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4" /> Lưu vai trò
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
