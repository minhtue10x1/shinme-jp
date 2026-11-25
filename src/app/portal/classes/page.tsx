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
import { useTranslation } from "@/lib/i18n/context";
import {
  getClasses,
  saveClass,
  deleteClass,
  getAllUsers,
  getUsersByClass,
  updateUserClassByAdmin,
} from "@/lib/db/services";
import type { ClassDoc, UserProfileDoc } from "@/lib/db/schema";
import { toast } from "sonner";

export default function ClassesPage() {
  const { role, user } = useRole();
  const { tr } = useTranslation();

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
      const [classList, userList] = await Promise.all([
        getClasses(),
        role === "student"
          ? user.classId
            ? getUsersByClass(user.classId)
            : Promise.resolve([])
          : getAllUsers(),
      ]);
      setClasses(classList);
      setUsers(userList);
    } catch (err) {
      console.error("Failed to load classes or users:", err);
      toast.error(tr("Không thể tải danh sách lớp học từ hệ thống.", "Failed to load classes from system.", "クラス一覧を読み込めませんでした。"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [role, user.classId]);

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
      currentLesson: tr("Bài 1: Nhập môn", "Lesson 1: Introduction", "第1課：入門"),
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
      toast.error(tr("Vui lòng điền đầy đủ Mã lớp và Tên lớp!", "Please fill in Class Code and Name!", "クラスコードとクラス名を入力してください！"));
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
      toast.success(
        editingClass
          ? tr("Cập nhật lớp học thành công!", "Class updated successfully!", "クラス情報を更新しました！")
          : tr("Tạo lớp học mới thành công!", "New class created successfully!", "新しいクラスを作成しました！")
      );
      setIsClassModalOpen(false);
      await loadData();
    } catch (err) {
      console.error("Save class error:", err);
      toast.error(tr("Lỗi khi lưu lớp học.", "Error saving class.", "クラスの保存中にエラーが発生しました。"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClass = async (classId: string, className: string) => {
    if (!confirm(tr(`Bạn có chắc chắn muốn xóa lớp "${className}"?`, `Are you sure you want to delete class "${className}"?`, `クラス「${className}」を削除してもよろしいですか？`))) return;
    try {
      await deleteClass(classId);
      toast.success(tr(`Đã xóa lớp ${className}`, `Deleted class ${className}`, `クラス ${className} を削除しました`));
      await loadData();
      if (selectedClass?.id === classId) setSelectedClass(null);
    } catch (err) {
      console.error("Delete class error:", err);
      toast.error(tr("Không thể xóa lớp học.", "Failed to delete class.", "クラスを削除できませんでした。"));
    }
  };

  // Reassign student to another class
  const handleReassignClass = async (studentUid: string, targetClassId: string) => {
    const targetClass = classes.find((c) => c.id === targetClassId);
    if (!targetClass) return;
    try {
      await updateUserClassByAdmin(studentUid, targetClass.id, targetClass.name);
      toast.success(tr(`Đã chuyển học viên sang lớp ${targetClass.shortName}`, `Reassigned student to ${targetClass.shortName}`, `受講生を ${targetClass.shortName} に移動しました`));
      await loadData();
    } catch (err) {
      console.error("Reassign error:", err);
      toast.error(tr("Lỗi khi chuyển lớp cho học viên.", "Error reassigning student.", "クラス移動中にエラーが発生しました。"));
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
          <h1 className="text-2xl font-black text-shinme-ink sm:text-3xl">
            {tr("Lớp học & Lịch đào tạo", "Classes & Training Schedule", "クラス・授業スケジュール")}
          </h1>
          <p className="mt-1 text-sm font-semibold text-shinme-muted">
            {tr(
              "Quản lý danh sách lớp học, lịch giảng dạy và sĩ số học viên",
              "Manage class directory, teaching schedules, and student enrollment",
              "クラス一覧・授業スケジュール・受講生人数を管理します"
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone="leaf">
            {tr(`${classes.length} Lớp đang mở`, `${classes.length} Active Classes`, `開講中 ${classes.length}クラス`)}
          </Badge>
          {role === "admin" && (
            <Button size="sm" onClick={handleOpenCreateModal}>
              <Plus className="size-4" /> {tr("Thêm lớp mới", "Add New Class", "新規クラス追加")}
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
          <h3 className="mt-4 text-lg font-black text-shinme-ink">
            {tr("Chưa có lớp học nào", "No classes found", "クラスがありません")}
          </h3>
          <p className="mt-1 text-sm text-shinme-muted">
            {tr("Hệ thống chưa có lớp học nào trong cơ sở dữ liệu.", "No classes registered in the system database.", "データベースに登録されているクラスがありません。")}
          </p>
          {role === "admin" && (
            <Button className="mt-5" onClick={handleOpenCreateModal}>
              <Plus className="size-4" /> {tr("Tạo lớp học đầu tiên", "Create First Class", "最初のクラスを作成")}
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
                          <Sparkles className="size-3" /> {tr("Lớp của bạn", "Your Class", "あなたのクラス")}
                        </span>
                      )}
                    </div>
                    <Badge tone="leaf">
                      {classStudents.length || c.studentsCount || 0} {tr("Học viên", "Students", "名")}
                    </Badge>
                  </div>

                  <h3 className="mt-3 text-lg font-black text-shinme-ink">{c.name}</h3>
                  {c.currentLessonJa && (
                    <FuriganaText text={c.currentLessonJa} className="mt-0.5 block text-xs font-bold text-shinme-primary" />
                  )}

                  {/* Progress & Current Lesson */}
                  <div className="mt-4 rounded-xl bg-shinme-bg p-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-shinme-muted">
                      <span>{tr("Tiến độ bài học:", "Lesson Progress:", "授業進捗：")}</span>
                      <span className="font-bold text-shinme-primary">
                        {c.completedSessions} / {c.totalSessions} {tr("buổi", "sessions", "回")}
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
                      <span>
                        Sensei: <strong className="text-shinme-ink">{c.senseiName}</strong>
                      </span>
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
                      {role === "student"
                        ? tr(`Bạn cùng lớp (${classStudents.length})`, `Classmates (${classStudents.length})`, `クラスメイト (${classStudents.length})`)
                        : tr(`Danh sách học viên (${classStudents.length})`, `Class Roster (${classStudents.length})`, `受講生名簿 (${classStudents.length})`)}
                    </Button>

                    {role === "admin" && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(c)}
                          className="rounded-lg p-2 text-xs font-bold text-shinme-ink-soft hover:bg-shinme-leaf hover:text-shinme-primary"
                          title={tr("Chỉnh sửa thông tin lớp", "Edit class details", "クラス情報を編集")}
                        >
                          {tr("Sửa", "Edit", "編集")}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteClass(c.id, c.name)}
                          className="rounded-lg p-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
                          title={tr("Xóa lớp học", "Delete class", "クラスを削除")}
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
            {tr(`Học viên lớp: ${selectedClass?.shortName}`, `Class Roster: ${selectedClass?.shortName}`, `受講生名簿：${selectedClass?.shortName}`)}
          </DialogTitle>
          <DialogDescription className="text-xs text-shinme-muted">
            {tr(
              `Tổng cộng: ${modalClassStudents.length} học viên đăng ký chính thức trên hệ thống`,
              `Total: ${modalClassStudents.length} students enrolled in system`,
              `合計：システム登録受講生 ${modalClassStudents.length}名`
            )}
          </DialogDescription>

          <div className="mt-4">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-shinme-muted" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder={tr("Tìm học viên theo tên, mã HV hoặc email...", "Search students by name, ID or email...", "氏名・ID・メールで検索...")}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-xs font-medium text-shinme-ink placeholder:text-shinme-muted focus:border-shinme-primary focus:outline-none"
              />
            </div>

            {filteredModalStudents.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-shinme-border py-8 text-center text-xs text-shinme-muted">
                {modalClassStudents.length === 0
                  ? tr("Chưa có học viên nào được gán vào lớp này.", "No students assigned to this class yet.", "このクラスにはまだ受講生が配属されていません。")
                  : tr("Không tìm thấy học viên phù hợp từ khóa.", "No matching students found.", "該当する受講生が見つかりません。")}
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
                              {tr(`Mục tiêu: ${st.targetJLPT}`, `Target: ${st.targetJLPT}`, `目標：${st.targetJLPT}`)}
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
            {editingClass ? tr("Chỉnh sửa lớp học", "Edit Class", "クラスを編集") : tr("Tạo lớp học mới", "Create New Class", "新規クラス作成")}
          </DialogTitle>
          <DialogDescription className="text-xs text-shinme-muted">
            {tr(
              "Thiết lập thông tin lịch học, giáo viên phụ trách và trình độ đào tạo",
              "Configure schedule, instructor, and training level",
              "授業スケジュール・担当講師・レベルを設定します"
            )}
          </DialogDescription>

          <form onSubmit={handleSaveClass} className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-shinme-ink">
                  {tr("Mã lớp *", "Class Code *", "クラスコード *")}
                </label>
                <input
                  type="text"
                  required
                  placeholder={tr("Ví dụ: N3-Tối 246", "e.g. N3-Evening 246", "例：N3-夜間246")}
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 focus:border-shinme-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-shinme-ink">
                  {tr("Cấp độ đào tạo *", "Training Level *", "レベル *")}
                </label>
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value as ClassDoc["level"] })}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 focus:border-shinme-primary focus:outline-none"
                >
                  <option value="N5">JLPT N5 {tr("(Nhập môn)", "(Beginner)", "（入門）")}</option>
                  <option value="N4">JLPT N4 {tr("(Sơ cấp)", "(Elementary)", "（初級）")}</option>
                  <option value="N3">JLPT N3 {tr("(Trung cấp)", "(Intermediate)", "（中級）")}</option>
                  <option value="N2">JLPT N2 {tr("(Thượng cấp)", "(Upper-Intermediate)", "（中上級）")}</option>
                  <option value="N1">JLPT N1 {tr("(Cao cấp)", "(Advanced)", "（上級）")}</option>
                  <option value="KAIWA">{tr("Giao tiếp Kaiwa", "Conversation Kaiwa", "会話（Kaiwa）")}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-shinme-ink">
                {tr("Tên lớp đầy đủ *", "Full Class Name *", "正式クラス名 *")}
              </label>
              <input
                type="text"
                required
                placeholder={tr("Ví dụ: N3-Tối 246 (Sensei Tanaka)", "e.g. N3-Evening 246 (Sensei Tanaka)", "例：N3-夜間246（田中先生）")}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 focus:border-shinme-primary focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-bold text-shinme-ink">
                  {tr("Sensei phụ trách *", "Assigned Sensei *", "担当講師 *")}
                </label>
                <input
                  type="text"
                  required
                  placeholder={tr("Ví dụ: Tanaka Yuki", "e.g. Tanaka Yuki", "例：田中由紀")}
                  value={formData.senseiName}
                  onChange={(e) => setFormData({ ...formData, senseiName: e.target.value })}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 focus:border-shinme-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-shinme-ink">
                  {tr("Tổng số buổi", "Total Sessions", "総授業回数")}
                </label>
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
                <label className="mb-1 block text-xs font-bold text-shinme-ink">
                  {tr("Lịch học trong tuần", "Weekly Schedule", "曜日スケジュール")}
                </label>
                <input
                  type="text"
                  placeholder={tr("Ví dụ: Thứ 2 · 4 · 6", "e.g. Mon · Wed · Fri", "例：月・水・金")}
                  value={formData.schedule}
                  onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 focus:border-shinme-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-shinme-ink">
                  {tr("Giờ học", "Class Time", "授業時間")}
                </label>
                <input
                  type="text"
                  placeholder="19:00 – 21:00"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 focus:border-shinme-primary focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-shinme-ink">
                {tr("Phòng học / Link Online", "Room / Online Link", "教室・オンラインリンク")}
              </label>
              <input
                type="text"
                placeholder={tr("Ví dụ: Phòng 204 & Zoom ID: 889-234-112", "e.g. Room 204 & Zoom ID: 889-234-112", "例：204教室 & Zoom ID: 889-234-112")}
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 focus:border-shinme-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-shinme-ink">
                {tr("Bài học hiện tại", "Current Lesson", "現在の単元")}
              </label>
              <input
                type="text"
                placeholder={tr("Ví dụ: Bài 26: Ngữ pháp Soumatome", "e.g. Lesson 26: Soumatome Grammar", "例：第26課：総まとめ文法")}
                value={formData.currentLesson}
                onChange={(e) => setFormData({ ...formData, currentLesson: e.target.value })}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900 focus:border-shinme-primary focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsClassModalOpen(false)}>
                {tr("Hủy", "Cancel", "キャンセル")}
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting
                  ? tr("Đang lưu...", "Saving...", "保存中...")
                  : editingClass
                  ? tr("Lưu thay đổi", "Save Changes", "変更を保存")
                  : tr("Tạo lớp học", "Create Class", "クラスを作成")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
