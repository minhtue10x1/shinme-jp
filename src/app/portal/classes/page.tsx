"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  UserCheck,
  Users,
  Plus,
  Trash2,
  GraduationCap,
  Sparkles,
  Search,
  BookOpen,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { FuriganaText } from "@/components/furigana-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useRole } from "@/lib/role-context";
import {
  getClasses,
  saveClass,
  deleteClass,
  getAllUsers,
  updateUserClassByAdmin,
} from "@/lib/db/services";
import type { ClassDoc, UserProfileDoc } from "@/lib/db/schema";
import { toast } from "sonner";

export default function ClassesPage() {
  const { role, user } = useRole();

  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [users, setUsers] = useState<UserProfileDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal: View Student Roster of a Class
  const [selectedClass, setSelectedClass] = useState<ClassDoc | null>(null);
  const [studentSearch, setStudentSearch] = useState("");

  // Modal: Create / Edit Class
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassDoc | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    shortName: "",
    level: "N3" as ClassDoc["level"],
    senseiName: "",
    schedule: "Thứ 2 · 4 · 6",
    time: "19:00 – 21:00",
    room: "Phòng 204 & Zoom ID: 889-234-112",
    totalSessions: 40,
    currentLesson: "Bài 1: Khởi động",
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [classList, userList] = await Promise.all([getClasses(), getAllUsers()]);
      setClasses(classList);
      setUsers(userList);
    } catch (err) {
      console.error("Failed to load classes or users:", err);
      toast.error("Không thể tải danh sách lớp học từ hệ thống.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Map students count by classId
  const studentsByClass = useMemo(() => {
    const map = new Map<string, UserProfileDoc[]>();
    for (const u of users) {
      if (u.role === "student" && u.classId) {
        const list = map.get(u.classId) || [];
        list.push(u);
        map.set(u.classId, list);
      }
    }
    return map;
  }, [users]);

  // Open modal for creating new class
  const handleOpenCreateModal = () => {
    setEditingClass(null);
    setFormData({
      code: "",
      name: "",
      shortName: "",
      level: "N3",
      senseiName: user.name || "Tanaka Yuki",
      schedule: "Thứ 2 · 4 · 6",
      time: "19:00 – 21:00",
      room: "Phòng 204 & Zoom ID: 889-234-112",
      totalSessions: 40,
      currentLesson: "Bài 1: Nhập môn",
    });
    setIsClassModalOpen(true);
  };

  // Open modal for editing existing class
  const handleOpenEditModal = (cls: ClassDoc) => {
    setEditingClass(cls);
    setFormData({
      code: cls.code,
      name: cls.name,
      shortName: cls.shortName,
      level: cls.level,
      senseiName: cls.senseiName,
      schedule: cls.schedule,
      time: cls.time,
      room: cls.room,
      totalSessions: cls.totalSessions,
      currentLesson: cls.currentLesson,
    });
    setIsClassModalOpen(true);
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      toast.error("Vui lòng điền đầy đủ Mã lớp và Tên lớp!");
      return;
    }

    try {
      setIsSubmitting(true);
      const id = editingClass ? editingClass.id : `cls-${formData.level.toLowerCase()}-${Date.now().toString(36)}`;
      const payload: ClassDoc = {
        id,
        code: formData.code.trim(),
        name: formData.name.trim(),
        shortName: formData.shortName.trim() || formData.code.trim(),
        level: formData.level,
        senseiId: editingClass ? editingClass.senseiId : "ss-general",
        senseiName: formData.senseiName.trim(),
        schedule: formData.schedule.trim(),
        time: formData.time.trim(),
        room: formData.room.trim(),
        totalSessions: Number(formData.totalSessions) || 30,
        completedSessions: editingClass ? editingClass.completedSessions : 0,
        studentsCount: studentsByClass.get(id)?.length || 0,
        currentLesson: formData.currentLesson.trim(),
        createdAt: editingClass ? editingClass.createdAt : new Date().toISOString(),
      };

      await saveClass(payload);
      toast.success(editingClass ? "Cập nhật lớp học thành công!" : "Tạo lớp học mới thành công!");
      setIsClassModalOpen(false);
      await loadData();
    } catch (err) {
      console.error("Save class error:", err);
      toast.error("Lỗi khi lưu lớp học.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClass = async (classId: string, className: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa lớp "${className}"?`)) return;
    try {
      await deleteClass(classId);
      toast.success(`Đã xóa lớp ${className}`);
      await loadData();
      if (selectedClass?.id === classId) setSelectedClass(null);
    } catch (err) {
      console.error("Delete class error:", err);
      toast.error("Không thể xóa lớp học.");
    }
  };

  // Reassign student to another class
  const handleReassignClass = async (studentUid: string, targetClassId: string) => {
    const targetClass = classes.find((c) => c.id === targetClassId);
    if (!targetClass) return;
    try {
      await updateUserClassByAdmin(studentUid, targetClass.id, targetClass.name);
      toast.success(`Đã chuyển học viên sang lớp ${targetClass.shortName}`);
      await loadData();
    } catch (err) {
      console.error("Reassign error:", err);
      toast.error("Lỗi khi chuyển lớp cho học viên.");
    }
  };

  // Filter students inside modal
  const modalClassStudents = selectedClass ? (studentsByClass.get(selectedClass.id) || []) : [];
  const filteredModalStudents = modalClassStudents.filter((s) => {
    const q = studentSearch.toLowerCase();
    return s.fullName.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 animate-[rise-in_260ms_var(--ease-out-expo)_both]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-shinme-line pb-5">
        <div>
          <h1 className="text-2xl font-black text-shinme-ink sm:text-3xl">Lớp học & Lịch đào tạo</h1>
          <p className="mt-1 text-sm font-semibold text-shinme-muted">
            Quản lý danh sách lớp học, lịch giảng dạy và sĩ số học viên
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone="leaf">{classes.length} Lớp đang mở</Badge>
          {role === "admin" && (
            <Button size="sm" onClick={handleOpenCreateModal}>
              <Plus className="size-4" /> Thêm lớp mới
            </Button>
          )}
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl border border-shinme-border bg-shinme-surface/60 p-6 animate-pulse" />
          ))}
        </div>
      ) : classes.length === 0 ? (
        /* Empty State */
        <div className="rounded-3xl border-2 border-dashed border-shinme-border bg-shinme-surface p-12 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-shinme-leaf text-shinme-primary">
            <GraduationCap className="size-8" />
          </div>
          <h3 className="mt-4 text-lg font-black text-shinme-ink">Chưa có lớp học nào</h3>
          <p className="mt-1 text-sm text-shinme-muted">Hệ thống chưa có lớp học nào trong cơ sở dữ liệu.</p>
          {role === "admin" && (
            <Button className="mt-5" onClick={handleOpenCreateModal}>
              <Plus className="size-4" /> Tạo lớp học đầu tiên
            </Button>
          )}
        </div>
      ) : (
        /* Real Classes Grid */
        <div className="grid gap-5 md:grid-cols-2">
          {classes.map((c) => {
            const classStudents = studentsByClass.get(c.id) || [];
            const isUserInThisClass =
              user.classId === c.id ||
              Boolean(user.className && c.shortName && user.className.includes(c.shortName));
            const canViewRoster = role !== "student" || isUserInThisClass;

            return (
              <div
                key={c.id}
                className="flex flex-col justify-between rounded-2xl border border-shinme-border bg-shinme-surface p-6 shadow-[var(--shadow-card)] transition-[border-color,box-shadow] hover:border-shinme-primary/40 hover:shadow-[var(--shadow-lift)]"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-shinme-primary px-3 py-0.5 text-xs font-black text-white">
                        {c.level}
                      </span>
                      <span className="font-mono text-xs font-bold text-shinme-muted">{c.code}</span>
                      {isUserInThisClass && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-shinme-accent/20 px-2 py-0.5 text-xs font-black text-shinme-primary-deep">
                          <Sparkles className="size-3" /> Lớp của bạn
                        </span>
                      )}
                    </div>
                    <Badge tone="leaf">
                      {classStudents.length} Học viên
                    </Badge>
                  </div>

                  <h3 className="mt-3 text-lg font-black text-shinme-ink">{c.name}</h3>
                  {c.currentLessonJa && (
                    <FuriganaText text={c.currentLessonJa} className="mt-0.5 block text-xs font-bold text-shinme-primary" />
                  )}

                  {/* Progress & Current Lesson */}
                  <div className="mt-4 rounded-xl bg-shinme-bg p-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-shinme-muted">
                      <span>Tiến độ bài học:</span>
                      <span className="font-bold text-shinme-primary">
                        {c.completedSessions} / {c.totalSessions} buổi
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-medium text-shinme-ink line-clamp-1">
                      {c.currentLesson}
                    </p>
                  </div>

                  {/* Details List */}
                  <div className="mt-4 space-y-2 text-sm text-shinme-ink-soft">
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4 shrink-0 text-shinme-primary" />
                      <span>{c.schedule}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="size-4 shrink-0 text-shinme-primary" />
                      <span className="tabular">{c.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="size-4 shrink-0 text-shinme-primary" />
                      <span className="truncate">{c.room}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <UserCheck className="size-4 shrink-0 text-shinme-primary" />
                      <span>Sensei: <strong className="text-shinme-ink">{c.senseiName}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                {canViewRoster && (
                  <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-shinme-line pt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedClass(c);
                        setStudentSearch("");
                      }}
                    >
                      <Users className="size-3.5" />{" "}
                      {role === "student" ? `Bạn cùng lớp (${classStudents.length})` : `Danh sách học viên (${classStudents.length})`}
                    </Button>

                    {role === "admin" && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(c)}
                          className="rounded-lg p-2 text-xs font-bold text-shinme-ink-soft hover:bg-shinme-leaf hover:text-shinme-primary"
                          title="Chỉnh sửa thông tin lớp"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClass(c.id, c.name)}
                          className="rounded-lg p-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
                          title="Xóa lớp học"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* =====================================================================
       * MODAL 1: VIEW STUDENT ROSTER OF CLASS
       * ===================================================================== */}
      <Dialog open={!!selectedClass} onOpenChange={(open) => !open && setSelectedClass(null)}>
        <DialogContent className="max-w-2xl">
          <DialogTitle className="flex items-center gap-2 text-lg font-black text-shinme-ink">
            <Users className="size-5 text-shinme-primary" />
            Học viên lớp: {selectedClass?.shortName}
          </DialogTitle>
          <DialogDescription className="text-xs text-shinme-muted">
            Tổng cộng: {modalClassStudents.length} học viên đăng ký chính thức trên hệ thống
          </DialogDescription>

          <div className="mt-4">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-shinme-muted" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Tìm học viên theo tên, mã HV hoặc email..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-xs font-medium text-shinme-ink placeholder:text-shinme-muted focus:border-shinme-primary focus:outline-none"
              />
            </div>

            {filteredModalStudents.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-shinme-border py-8 text-center text-xs text-shinme-muted">
                {modalClassStudents.length === 0
                  ? "Chưa có học viên nào được gán vào lớp này."
                  : "Không tìm thấy học viên phù hợp từ khóa."}
              </div>
            ) : (
              <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                {filteredModalStudents.map((st) => (
                  <div
                    key={st.uid}
                    className="flex items-center justify-between rounded-xl border border-shinme-border bg-shinme-surface p-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        src={st.avatarUrl}
                        fallbackText={st.avatarText || st.fullName.slice(0, 2)}
                        alt={st.fullName}
                        size="sm"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-sm font-black text-shinme-ink">{st.fullName}</strong>
                          <span className="font-mono text-xs font-bold text-shinme-muted">{st.code}</span>
                          {st.targetJLPT && (
                            <span className="rounded bg-shinme-bg px-1.5 py-0.5 font-mono text-xs font-extrabold text-shinme-primary">
                              Mục tiêu: {st.targetJLPT}
                            </span>
                          )}
                        </div>
                        {role !== "student" && <p className="text-shinme-muted">{st.email}</p>}
                      </div>
                    </div>

                    {/* Admin Reassign Class Dropdown */}
                    {role === "admin" && (
                      <div className="flex items-center gap-1.5">
                        <select
                          value={selectedClass?.id}
                          onChange={(e) => handleReassignClass(st.uid, e.target.value)}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-shinme-ink focus:border-shinme-primary focus:outline-none"
                        >
                          {classes.map((cls) => (
                            <option key={cls.id} value={cls.id}>
                              {cls.shortName}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* =====================================================================
       * MODAL 2: CREATE / EDIT CLASS (ADMIN)
       * ===================================================================== */}
      <Dialog open={isClassModalOpen} onOpenChange={setIsClassModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogTitle className="text-lg font-black text-shinme-ink">
            {editingClass ? "Chỉnh sửa lớp học" : "Tạo lớp học mới"}
          </DialogTitle>
          <DialogDescription className="text-xs text-shinme-muted">
            Thiết lập thông tin lịch học, giáo viên phụ trách và trình độ đào tạo
          </DialogDescription>

          <form onSubmit={handleSaveClass} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-shinme-ink">Mã lớp *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: N3-Tối 246"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 focus:border-shinme-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-shinme-ink">Cấp độ đào tạo *</label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value as ClassDoc["level"] })}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 focus:border-shinme-primary focus:outline-none"
                >
                  <option value="N5">JLPT N5 (Nhập môn)</option>
                  <option value="N4">JLPT N4 (Sơ cấp)</option>
                  <option value="N3">JLPT N3 (Trung cấp)</option>
                  <option value="N2">JLPT N2 (Thượng cấp)</option>
                  <option value="N1">JLPT N1 (Cao cấp)</option>
                  <option value="KAIWA">Giao tiếp Kaiwa</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-shinme-ink">Tên lớp đầy đủ *</label>
              <input
                type="text"
                required
                placeholder="Ví dụ: N3-Tối 246 (Sensei Tanaka)"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 focus:border-shinme-primary focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-shinme-ink">Sensei phụ trách *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Tanaka Yuki"
                  value={formData.senseiName}
                  onChange={(e) => setFormData({ ...formData, senseiName: e.target.value })}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 focus:border-shinme-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-shinme-ink">Tổng số buổi</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={formData.totalSessions}
                  onChange={(e) => setFormData({ ...formData, totalSessions: Number(e.target.value) })}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 focus:border-shinme-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-shinme-ink">Lịch học trong tuần</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Thứ 2 · 4 · 6"
                  value={formData.schedule}
                  onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 focus:border-shinme-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-shinme-ink">Giờ học</label>
                <input
                  type="text"
                  placeholder="Ví dụ: 19:00 – 21:00"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 focus:border-shinme-primary focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-shinme-ink">Phòng học / Link Online</label>
              <input
                type="text"
                placeholder="Ví dụ: Phòng 204 & Zoom ID: 889-234-112"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 focus:border-shinme-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-shinme-ink">Bài học hiện tại</label>
              <input
                type="text"
                placeholder="Ví dụ: Bài 26: Ngữ pháp Soumatome"
                value={formData.currentLesson}
                onChange={(e) => setFormData({ ...formData, currentLesson: e.target.value })}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 focus:border-shinme-primary focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsClassModalOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? "Đang lưu..." : editingClass ? "Lưu thay đổi" : "Tạo lớp học"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
