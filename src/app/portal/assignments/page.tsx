"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  GraduationCap,
  ListTodo,
  Loader2,
  MessageSquare,
  Pencil,
  Plus,
  Save,
  Search,
  Send,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import { FuriganaText } from "@/components/furigana-text";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRole } from "@/lib/role-context";
import {
  getAssignments,
  saveAssignment,
  deleteAssignment,
  submitAssignmentAnswer,
  gradeAssignmentSubmission,
  getClasses,
  getAllUsers,
} from "@/lib/db/services";
import type {
  AssignmentDoc,
  AssignmentSubmissionInfo,
  ClassDoc,
  UserProfileDoc,
} from "@/lib/db/schema";

const QUICK_FEEDBACKS = [
  "Phát âm và ngữ điệu rất tự nhiên!",
  "Chú ý thêm cách dùng trợ từ に và で.",
  "Phần chia thể bị động (受身形) cần ôn tập thêm một chút.",
  "Chữ Kanji viết đúng thứ tự nét và rất đẹp!",
  "Làm bài rất tốt, lập luận rõ ràng và giữ vững phong độ nhé! ♡",
  "Cần đọc kỹ lại mạch chuyển ý trong đoạn văn Đọc hiểu.",
];

export default function AssignmentsPage() {
  const { role, user } = useRole();
  const [assignments, setAssignments] = useState<AssignmentDoc[]>([]);
  const [classes, setClasses] = useState<ClassDoc[]>([]);
  const [students, setStudents] = useState<UserProfileDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [filterType, setFilterType] = useState<string>("ALL");
  const [filterClass, setFilterClass] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  // Dialogs
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  // Student submission modal
  const [submittingItem, setSubmittingItem] = useState<AssignmentDoc | null>(null);
  const [studentAnswerInput, setStudentAnswerInput] = useState("");
  const [isSavingSubmission, setIsSavingSubmission] = useState(false);

  // Sensei grading modal
  const [gradingItem, setGradingItem] = useState<AssignmentDoc | null>(null);
  const [selectedStudentUid, setSelectedStudentUid] = useState<string>("");
  const [scoreInput, setScoreInput] = useState<number>(10);
  const [feedbackInput, setFeedbackInput] = useState<string>("");
  const [isSavingGrade, setIsSavingGrade] = useState(false);

  // New assignment form state
  const [formCode, setFormCode] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formTitleJa, setFormTitleJa] = useState("");
  const [formClassId, setFormClassId] = useState("cls-n3-246");
  const [formLevel, setFormLevel] = useState<"N5" | "N4" | "N3" | "N2" | "N1" | "KAIWA">("N3");
  const [formType, setFormType] = useState<"Kanji" | "Ngữ pháp" | "Đọc hiểu" | "Kaiwa" | "Tổng hợp">("Ngữ pháp");
  const [formDueDate, setFormDueDate] = useState("2026-11-30");
  const [formQuestionsCount, setFormQuestionsCount] = useState<number>(5);
  const [formMaxScore, setFormMaxScore] = useState<number>(10);
  const [formDescription, setFormDescription] = useState("");

  // Initial data load
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [asgList, classList, userList] = await Promise.all([
        getAssignments(role === "student" ? user.classId : undefined),
        getClasses(),
        role === "student" ? Promise.resolve([]) : getAllUsers(),
      ]);
      setAssignments(asgList);
      setClasses(classList);
      setStudents(userList.filter((u) => u.role === "student"));
    } catch (error) {
      console.error("Failed to load assignments data:", error);
      toast.error("Không thể tải danh sách bài tập. Vui lòng thử lại!");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [role, user.classId]);

  // Filtered assignments
  const filtered = useMemo(() => {
    return assignments.filter((a) => {
      // Type filter
      if (filterType !== "ALL" && a.type !== filterType) return false;

      // Class filter
      if (filterClass !== "ALL" && a.classId !== "ALL" && a.classId !== filterClass) {
        return false;
      }

      // If role is student, only show assignments for their class or "ALL"
      if (role === "student" && user.classId && a.classId !== "ALL" && a.classId !== user.classId) {
        return false;
      }

      // Search query
      if (search) {
        const q = search.toLowerCase();
        const matchTitle = (a.title || "").toLowerCase().includes(q);
        const matchCode = (a.code || "").toLowerCase().includes(q);
        const matchClass = (a.className || "").toLowerCase().includes(q);
        if (!matchTitle && !matchCode && !matchClass) return false;
      }

      return true;
    });
  }, [assignments, filterType, filterClass, search, role, user.classId]);

  // Handle student answer submission
  const handleOpenStudentSubmission = (item: AssignmentDoc) => {
    setSubmittingItem(item);
    const existing = getStudentSubmission(item);
    setStudentAnswerInput(existing?.studentAnswer || "");
  };

  const handleSaveStudentSubmission = async () => {
    if (!submittingItem) return;
    if (!studentAnswerInput.trim()) {
      toast.error("Vui lòng nhập nội dung bài làm của bạn!");
      return;
    }

    setIsSavingSubmission(true);
    try {
      const studentUid = user.id || "Qplmanq1aofX7kaNEW0ZYIpe3oV2";
      await submitAssignmentAnswer(submittingItem.id, studentUid, {
        studentName: user.name || "Lê Hoàng Nam",
        studentCode: user.code || "HV-202601",
        studentAnswer: studentAnswerInput,
        maxScore: submittingItem.maxScore || 10,
        status: "submitted",
      });

      // Update local state
      setAssignments((prev) =>
        prev.map((a) => {
          if (a.id !== submittingItem.id) return a;
          const updatedSubmissions = {
            ...(a.submissions || {}),
            [studentUid]: {
              ...(a.submissions?.[studentUid] || {}),
              studentName: user.name || "Lê Hoàng Nam",
              studentCode: user.code || "HV-202601",
              studentAnswer: studentAnswerInput,
              maxScore: submittingItem.maxScore || 10,
              submittedAt: new Date().toISOString(),
              status: "submitted" as const,
            },
          };
          return { ...a, submissions: updatedSubmissions };
        })
      );

      toast.success("Đã nộp bài tập thành công!", {
        description: "Sensei sẽ xem và chấm điểm cho bạn sớm nhất.",
      });
      setSubmittingItem(null);
    } catch (error) {
      console.error("Error submitting assignment:", error);
      toast.error("Nộp bài thất bại. Vui lòng kiểm tra lại kết nối mạng!");
    } finally {
      setIsSavingSubmission(false);
    }
  };

  // Helper to get student's submission from assignment
  const getStudentSubmission = (item: AssignmentDoc): AssignmentSubmissionInfo | undefined => {
    if (!item.submissions) return undefined;
    const uid = user.id;
    // Check by user.id, or fallback matches for Nam Le
    if (uid && item.submissions[uid]) return item.submissions[uid];
    if (item.submissions["Qplmanq1aofX7kaNEW0ZYIpe3oV2"]) return item.submissions["Qplmanq1aofX7kaNEW0ZYIpe3oV2"];
    if (item.submissions["hv-202601"]) return item.submissions["hv-202601"];
    // Check by studentCode
    const matchByCode = Object.values(item.submissions).find((s) => s.studentCode === user.code);
    return matchByCode;
  };

  // Open sensei grading modal
  const openGradingModal = (item: AssignmentDoc) => {
    setGradingItem(item);

    // Find class students
    const classStudents = students.filter(
      (s) => item.classId === "ALL" || s.classId === item.classId
    );

    // Pick first student with submission or first student in class
    const firstWithSub = classStudents.find((s) => item.submissions?.[s.uid]?.status === "submitted");
    const chosenUid = firstWithSub ? firstWithSub.uid : classStudents[0]?.uid || "Qplmanq1aofX7kaNEW0ZYIpe3oV2";

    setSelectedStudentUid(chosenUid);
    const existing = item.submissions?.[chosenUid];
    setScoreInput(existing?.score ?? (item.maxScore ? Math.floor(item.maxScore * 0.9) : 10));
    setFeedbackInput(existing?.feedback || "Em hoàn thành bài rất tốt! Cần chú ý thêm một số cấu trúc phức tạp hơn.");
  };

  const handleSelectStudentToGrade = (uid: string) => {
    setSelectedStudentUid(uid);
    if (!gradingItem) return;
    const existing = gradingItem.submissions?.[uid];
    setScoreInput(existing?.score ?? (gradingItem.maxScore ? Math.floor(gradingItem.maxScore * 0.9) : 10));
    setFeedbackInput(existing?.feedback || "Em hoàn thành bài rất tốt! Cần chú ý thêm một số cấu trúc phức tạp hơn.");
  };

  // Save grading
  const handleSaveGrading = async () => {
    if (!gradingItem || !selectedStudentUid) return;

    setIsSavingGrade(true);
    try {
      const studentProfile = students.find((s) => s.uid === selectedStudentUid);
      const studentName = studentProfile?.fullName || "Lê Hoàng Nam";
      const studentCode = studentProfile?.code || "HV-202601";

      await gradeAssignmentSubmission(gradingItem.id, selectedStudentUid, {
        score: scoreInput,
        maxScore: gradingItem.maxScore,
        feedback: feedbackInput,
        studentName,
        studentCode,
      });

      // Update local state
      setAssignments((prev) =>
        prev.map((a) => {
          if (a.id !== gradingItem.id) return a;
          const existing = a.submissions?.[selectedStudentUid] || { status: "graded" as const };
          return {
            ...a,
            submissions: {
              ...(a.submissions || {}),
              [selectedStudentUid]: {
                ...existing,
                score: scoreInput,
                maxScore: a.maxScore,
                feedback: feedbackInput,
                studentName,
                studentCode,
                status: "graded" as const,
                gradedAt: new Date().toISOString(),
              },
            },
          };
        })
      );

      toast.success(`Đã lưu kết quả chấm điểm cho ${studentName}!`, {
        description: `Điểm: ${scoreInput}/${gradingItem.maxScore} · Nhận xét đã cập nhật vào tài khoản học viên.`,
      });
      setGradingItem(null);
    } catch (error) {
      console.error("Error saving grade:", error);
      toast.error("Không thể lưu kết quả chấm điểm. Vui lòng thử lại!");
    } finally {
      setIsSavingGrade(false);
    }
  };

  // Handle create new assignment
  const handleCreateAssignment = async () => {
    if (!formTitle.trim()) {
      toast.error("Vui lòng nhập tiêu đề bài tập!");
      return;
    }

    const selectedClass = classes.find((c) => c.id === formClassId);
    const className = formClassId === "ALL" ? "Tất cả các lớp" : (selectedClass?.code || selectedClass?.name || "Lớp học");
    const code = formCode.trim() || `ASG-${Date.now().toString().slice(-4)}`;

    const newDoc: AssignmentDoc = {
      id: `asg-${Date.now()}`,
      code,
      title: formTitle.trim(),
      titleJa: formTitleJa.trim() || undefined,
      classId: formClassId,
      className,
      level: formLevel,
      type: formType,
      dueDate: formDueDate,
      questionsCount: Number(formQuestionsCount) || 5,
      maxScore: Number(formMaxScore) || 10,
      description: formDescription.trim() || undefined,
      createdBy: user.name || "Sensei Shinme",
      createdAt: new Date().toISOString(),
      submissions: {},
    };

    setIsSubmittingNew(true);
    try {
      await saveAssignment(newDoc);
      setAssignments((prev) => [newDoc, ...prev]);
      toast.success(`Đã tạo bài tập [${code}] thành công!`);
      setIsCreateOpen(false);
      // Reset form
      setFormTitle("");
      setFormTitleJa("");
      setFormCode("");
      setFormDescription("");
    } catch (error) {
      console.error("Error creating assignment:", error);
      toast.error("Tạo bài tập thất bại. Vui lòng thử lại!");
    } finally {
      setIsSubmittingNew(false);
    }
  };

  // Handle delete assignment
  const handleDeleteAssignment = async (id: string, code: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bài tập ${code} không?`)) return;

    try {
      await deleteAssignment(id);
      setAssignments((prev) => prev.filter((a) => a.id !== id));
      toast.success(`Đã xóa bài tập ${code}.`);
    } catch (error) {
      console.error("Error deleting assignment:", error);
      toast.error("Không thể xóa bài tập. Vui lòng thử lại!");
    }
  };

  return (
    <div className="space-y-6 animate-[rise-in_260ms_var(--ease-out-expo)_both]">
      {/* Header */}
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-shinme-line pb-5">
        <div>
          <h1 className="text-2xl font-black text-shinme-ink sm:text-3xl">Bài tập & Mondai</h1>
          <p className="mt-1 text-sm font-semibold text-shinme-muted">
            {role === "student"
              ? "Danh sách bài tập về nhà, Mini Test và Mondai luyện thi tiếng Nhật"
              : "Quản lý đề kiểm tra, chấm bài và giao bài tập theo lớp"}
          </p>
        </div>
        {role !== "student" && (
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="size-4" /> Tạo đề bài mới
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {["ALL", "Kanji", "Ngữ pháp", "Đọc hiểu", "Kaiwa", "Tổng hợp"].map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                filterType === t
                  ? "bg-shinme-primary text-white"
                  : "bg-shinme-surface text-shinme-ink-soft border border-shinme-border hover:bg-shinme-leaf"
              }`}
            >
              {t === "ALL" ? "Tất cả dạng bài" : t}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Class Filter (For Sensei / Admin) */}
          {role !== "student" && (
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="h-9 rounded-full border border-shinme-border bg-shinme-surface px-3 text-xs font-bold text-shinme-ink focus:border-shinme-primary focus:outline-none"
            >
              <option value="ALL">Tất cả lớp học</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.code} — {cls.shortName || cls.name}
                </option>
              ))}
            </select>
          )}

          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-shinme-muted" />
            <input
              type="text"
              placeholder="Tìm theo mã hoặc tên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-full border border-shinme-border bg-shinme-surface pl-9 pr-4 text-xs font-medium text-shinme-ink placeholder:text-shinme-muted focus:border-shinme-primary focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Assignment List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-shinme-muted space-y-3">
          <Loader2 className="size-8 animate-spin text-shinme-primary" />
          <p className="text-sm font-semibold">Đang tải danh sách bài tập từ dữ liệu trung tâm...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-shinme-border bg-shinme-surface p-12 text-center">
          <BookOpen className="mx-auto size-12 text-shinme-muted/60" />
          <h3 className="mt-3 text-base font-bold text-shinme-ink">Chưa có bài tập nào</h3>
          <p className="mt-1 text-xs text-shinme-muted">
            {search || filterType !== "ALL" || filterClass !== "ALL"
              ? "Không tìm thấy bài tập phù hợp với bộ lọc hiện tại."
              : "Hiện tại chưa có bài tập nào được giao."}
          </p>
          {role !== "student" && (
            <Button size="sm" onClick={() => setIsCreateOpen(true)} className="mt-4">
              <Plus className="size-4" /> Tạo bài tập đầu tiên
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((item) => {
            const studentSub = getStudentSubmission(item);
            const isGraded = studentSub?.status === "graded";
            const isSubmitted = studentSub?.status === "submitted";

            // Calculate submitted counts
            const submissionsCount = Object.values(item.submissions || {}).filter(
              (s) => s.status !== "todo"
            ).length;

            // Total students in this class
            const classStudents = students.filter(
              (s) => item.classId === "ALL" || s.classId === item.classId
            );
            const totalStudentsCount = classStudents.length || 12;

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-shinme-border bg-shinme-surface p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-lift)]"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-[280px]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black text-shinme-primary bg-shinme-leaf px-2 py-0.5 rounded">
                        {item.code}
                      </span>
                      <Badge tone="neutral">{item.level}</Badge>
                      <Badge tone="leaf">{item.type}</Badge>
                      <span className="text-xs font-semibold text-shinme-muted">
                        · Lớp: <strong className="text-shinme-ink">{item.className}</strong>
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-shinme-ink">{item.title}</h3>
                    {item.titleJa && (
                      <FuriganaText text={item.titleJa} className="block text-sm font-bold text-shinme-primary" />
                    )}

                    {item.description && (
                      <p className="text-xs text-shinme-ink-soft line-clamp-2 pt-0.5">
                        {item.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-shinme-muted pt-1">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Clock className="size-3.5 text-shinme-muted" /> Hạn nộp:{" "}
                        <strong className="font-bold text-shinme-danger">{item.dueDate}</strong>
                      </span>
                      <span>·</span>
                      <span>Số câu: <strong>{item.questionsCount}</strong></span>
                      <span>·</span>
                      <span>Thang điểm: <strong>{item.maxScore}đ</strong></span>
                    </div>
                  </div>

                  {/* Actions according to role */}
                  <div className="flex flex-col items-end gap-2 self-center sm:self-start">
                    {role === "student" ? (
                      isGraded ? (
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 rounded-full bg-shinme-leaf px-3 py-1 text-xs font-black text-shinme-primary">
                            <CheckCircle2 className="size-3.5" /> Đã chấm điểm
                          </span>
                          <p className="mt-1 text-lg font-black text-shinme-ink">
                            {studentSub?.score} / {item.maxScore} điểm
                          </p>
                        </div>
                      ) : isSubmitted ? (
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-black text-amber-700">
                            <Clock className="size-3.5" /> Đã nộp · Đang chờ chấm
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 text-xs"
                            onClick={() => handleOpenStudentSubmission(item)}
                          >
                            <Pencil className="size-3.5" /> Xem / Sửa bài đã nộp
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleOpenStudentSubmission(item)}
                          className="font-bold"
                        >
                          <Send className="size-3.5" /> Nộp bài làm
                        </Button>
                      )
                    ) : (
                      <div className="text-right space-y-1">
                        <p className="text-xs font-bold text-shinme-muted">Tiến độ nộp bài</p>
                        <p className="text-base font-black text-shinme-primary">
                          {submissionsCount} / {totalStudentsCount} học viên
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openGradingModal(item)}
                          >
                            <UserCheck className="size-3.5" /> Chấm bài & Nhận xét
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAssignment(item.id, item.code)}
                            className="text-shinme-muted hover:text-shinme-danger"
                            title="Xóa bài tập này"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Feedback banner for student */}
                {role === "student" && studentSub?.feedback && (
                  <div className="mt-4 rounded-xl bg-shinme-leaf-faint p-3.5 text-xs leading-relaxed text-shinme-ink-soft border border-shinme-accent-soft/40">
                    <strong className="text-shinme-primary">Nhận xét từ Sensei: </strong>
                    {studentSub.feedback}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Student Submission Modal */}
      {submittingItem && (
        <Dialog open={true} onOpenChange={(open) => !open && setSubmittingItem(null)}>
          <DialogContent className="max-w-xl">
            <div className="p-6 sm:p-8 space-y-5">
              <div>
                <DialogTitle className="text-xl font-black text-shinme-ink flex items-center gap-2">
                  <Send className="size-5 text-shinme-primary" /> Nộp bài tập
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs text-shinme-muted">
                  Học viên: <strong className="text-shinme-ink font-bold">{user.name} ({user.code})</strong> · Hạn nộp: {submittingItem.dueDate}
                </DialogDescription>
              </div>

              <div className="rounded-xl bg-shinme-bg p-4 border border-shinme-line space-y-1">
                <span className="font-mono text-xs font-black text-shinme-primary">{submittingItem.code}</span>
                <p className="text-sm font-black text-shinme-ink">{submittingItem.title}</p>
                {submittingItem.titleJa && (
                  <FuriganaText text={submittingItem.titleJa} className="block text-xs text-shinme-primary" />
                )}
                {submittingItem.description && (
                  <p className="text-xs text-shinme-muted pt-1 border-t border-shinme-border/40 mt-1">
                    {submittingItem.description}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-shinme-ink">
                  Nội dung câu trả lời / Bài làm của bạn:
                </label>
                <textarea
                  rows={6}
                  value={studentAnswerInput}
                  onChange={(e) => setStudentAnswerInput(e.target.value)}
                  placeholder="Gõ trực tiếp đáp án các câu, đoạn văn câu hỏi hoặc chèn link file drive bài làm..."
                  className="w-full rounded-xl border-2 border-shinme-border p-3 text-sm text-shinme-ink focus:border-shinme-primary focus:outline-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-shinme-line">
                <Button variant="ghost" size="sm" onClick={() => setSubmittingItem(null)}>
                  Hủy
                </Button>
                <Button size="sm" onClick={handleSaveStudentSubmission} disabled={isSavingSubmission}>
                  {isSavingSubmission ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Đang lưu...
                    </>
                  ) : (
                    <>
                      <Send className="size-4" /> Xác nhận nộp bài
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Sensei Grading Dialog */}
      {gradingItem && (
        <Dialog open={true} onOpenChange={(open) => !open && setGradingItem(null)}>
          <DialogContent className="max-w-2xl">
            <div className="p-6 sm:p-8 space-y-5">
              <div>
                <DialogTitle className="text-xl font-black text-shinme-ink flex items-center gap-2">
                  <UserCheck className="size-5 text-shinme-primary" /> Chấm bài & Nhận xét
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs text-shinme-muted">
                  Đề bài: <strong className="text-shinme-ink font-bold">{gradingItem.code} - {gradingItem.title}</strong> · Thang điểm: {gradingItem.maxScore}đ
                </DialogDescription>
              </div>

              {/* Student Picker */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-shinme-ink">
                  Chọn học viên trong lớp để chấm:
                </label>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1 border border-shinme-border rounded-xl">
                  {students
                    .filter((s) => gradingItem.classId === "ALL" || s.classId === gradingItem.classId)
                    .map((stu) => {
                      const sub = gradingItem.submissions?.[stu.uid];
                      const isGraded = sub?.status === "graded";
                      const isSubmitted = sub?.status === "submitted";
                      const isSelected = selectedStudentUid === stu.uid;

                      return (
                        <button
                          key={stu.uid}
                          type="button"
                          onClick={() => handleSelectStudentToGrade(stu.uid)}
                          className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                            isSelected
                              ? "bg-shinme-primary text-white"
                              : "bg-shinme-surface text-shinme-ink border border-shinme-border hover:bg-shinme-leaf"
                          }`}
                        >
                          <span>{stu.fullName} ({stu.code})</span>
                          {isGraded ? (
                            <span className={`rounded px-1.5 py-0.5 text-xs font-black ${isSelected ? "bg-white/20 text-white" : "bg-shinme-leaf text-shinme-primary"}`}>
                              {sub?.score}đ
                            </span>
                          ) : isSubmitted ? (
                            <span className={`rounded px-1.5 py-0.5 text-xs font-black ${isSelected ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"}`}>
                              Đã nộp
                            </span>
                          ) : (
                            <span className="text-xs opacity-60">Chưa nộp</span>
                          )}
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* View student answer if submitted */}
              {(() => {
                const curSub = gradingItem.submissions?.[selectedStudentUid];
                return (
                  <div className="rounded-xl bg-shinme-bg p-4 border border-shinme-line space-y-1">
                    <p className="text-xs font-bold uppercase text-shinme-muted">
                      Bài làm của học viên:
                    </p>
                    {curSub?.studentAnswer ? (
                      <p className="text-xs font-medium text-shinme-ink whitespace-pre-wrap leading-relaxed">
                        {curSub.studentAnswer}
                      </p>
                    ) : (
                      <p className="text-xs italic text-shinme-muted">
                        Học viên chưa nộp bài qua hệ thống (hoặc nộp trực tiếp tại lớp). Sensei có thể chấm điểm và gửi nhận xét trực tiếp dưới đây.
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Score Input */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-shinme-ink">
                  Điểm số đạt được:
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={0}
                    max={gradingItem.maxScore || 20}
                    value={scoreInput}
                    onChange={(e) => setScoreInput(Number(e.target.value))}
                    className="h-11 w-24 rounded-xl border-2 border-shinme-border px-3 text-center text-lg font-black text-shinme-primary focus:border-shinme-primary focus:outline-none tabular"
                  />
                  <span className="text-sm font-bold text-shinme-muted">
                    / {gradingItem.maxScore || 10} điểm
                  </span>
                </div>
              </div>

              {/* Quick Feedback Suggestions */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-shinme-ink">
                  Mẫu nhận xét nhanh của Sensei:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_FEEDBACKS.map((fb) => (
                    <button
                      key={fb}
                      type="button"
                      onClick={() => setFeedbackInput(fb)}
                      className="rounded-full bg-shinme-bg border border-shinme-border px-3 py-1 text-xs text-shinme-ink-soft hover:bg-shinme-leaf hover:text-shinme-primary transition-colors text-left"
                    >
                      + {fb}
                    </button>
                  ))}
                </div>
              </div>

              {/* Detailed Feedback Textarea */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-shinme-ink">
                  Nội dung nhận xét chi tiết:
                </label>
                <textarea
                  rows={3}
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="Nhập lời khen hoặc dặn dò cho học viên..."
                  className="w-full rounded-xl border-2 border-shinme-border p-3 text-sm text-shinme-ink focus:border-shinme-primary focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-shinme-line">
                <Button variant="ghost" size="sm" onClick={() => setGradingItem(null)}>
                  Hủy
                </Button>
                <Button size="sm" onClick={handleSaveGrading} disabled={isSavingGrade}>
                  {isSavingGrade ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="size-4" /> Lưu kết quả chấm
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Assignment Dialog */}
      {isCreateOpen && (
        <Dialog open={true} onOpenChange={(open) => !open && setIsCreateOpen(false)}>
          <DialogContent className="max-w-2xl">
            <div className="p-6 sm:p-8 space-y-4">
              <div>
                <DialogTitle className="text-xl font-black text-shinme-ink flex items-center gap-2">
                  <Plus className="size-5 text-shinme-primary" /> Tạo đề bài tập mới
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs text-shinme-muted">
                  Giao bài tập về nhà, Mini Test hoặc bài luyện Dokkai/Kaiwa trực tiếp cho các lớp học.
                </DialogDescription>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-shinme-ink">Mã bài tập *</label>
                  <input
                    type="text"
                    placeholder="VD: BTVN-27, TEST-04..."
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="h-10 w-full rounded-xl border border-shinme-border bg-shinme-surface px-3 text-xs font-semibold text-shinme-ink focus:border-shinme-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-shinme-ink">Lớp học giao bài *</label>
                  <select
                    value={formClassId}
                    onChange={(e) => setFormClassId(e.target.value)}
                    className="h-10 w-full rounded-xl border border-shinme-border bg-shinme-surface px-3 text-xs font-semibold text-shinme-ink focus:border-shinme-primary focus:outline-none"
                  >
                    <option value="ALL">Tất cả các lớp</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.shortName || c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-shinme-ink">Tiêu đề bài tập *</label>
                  <input
                    type="text"
                    placeholder="VD: Soumatome N3 Bài 27: Đặt 5 câu với cấu trúc ～わりに"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="h-10 w-full rounded-xl border border-shinme-border bg-shinme-surface px-3 text-xs font-semibold text-shinme-ink focus:border-shinme-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-shinme-ink">Tiêu đề tiếng Nhật (tùy chọn, kèm Furigana dạng Kanji[furigana])</label>
                  <input
                    type="text"
                    placeholder="VD: 総まとめ文法[そうまとめぶんぽう] 作文[さくぶん]"
                    value={formTitleJa}
                    onChange={(e) => setFormTitleJa(e.target.value)}
                    className="h-10 w-full rounded-xl border border-shinme-border bg-shinme-surface px-3 text-xs font-semibold text-shinme-ink focus:border-shinme-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-shinme-ink">Trình độ JLPT</label>
                  <select
                    value={formLevel}
                    onChange={(e) => setFormLevel(e.target.value as any)}
                    className="h-10 w-full rounded-xl border border-shinme-border bg-shinme-surface px-3 text-xs font-semibold text-shinme-ink focus:border-shinme-primary focus:outline-none"
                  >
                    <option value="N5">N5</option>
                    <option value="N4">N4</option>
                    <option value="N3">N3</option>
                    <option value="N2">N2</option>
                    <option value="N1">N1</option>
                    <option value="KAIWA">KAIWA</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-shinme-ink">Thể loại bài</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="h-10 w-full rounded-xl border border-shinme-border bg-shinme-surface px-3 text-xs font-semibold text-shinme-ink focus:border-shinme-primary focus:outline-none"
                  >
                    <option value="Kanji">Kanji</option>
                    <option value="Ngữ pháp">Ngữ pháp</option>
                    <option value="Đọc hiểu">Đọc hiểu</option>
                    <option value="Kaiwa">Kaiwa</option>
                    <option value="Tổng hợp">Tổng hợp</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-shinme-ink">Hạn nộp bài</label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="h-10 w-full rounded-xl border border-shinme-border bg-shinme-surface px-3 text-xs font-semibold text-shinme-ink focus:border-shinme-primary focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-shinme-ink">Số câu</label>
                    <input
                      type="number"
                      min={1}
                      value={formQuestionsCount}
                      onChange={(e) => setFormQuestionsCount(Number(e.target.value))}
                      className="h-10 w-full rounded-xl border border-shinme-border bg-shinme-surface px-3 text-xs font-semibold text-shinme-ink focus:border-shinme-primary focus:outline-none tabular"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-shinme-ink">Thang điểm</label>
                    <input
                      type="number"
                      min={1}
                      value={formMaxScore}
                      onChange={(e) => setFormMaxScore(Number(e.target.value))}
                      className="h-10 w-full rounded-xl border border-shinme-border bg-shinme-surface px-3 text-xs font-semibold text-shinme-ink focus:border-shinme-primary focus:outline-none tabular"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-shinme-ink">Mô tả / Hướng dẫn làm bài</label>
                  <textarea
                    rows={3}
                    placeholder="Ghi chú chi tiết yêu cầu nộp bài, số từ hoặc quy định nộp..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full rounded-xl border border-shinme-border bg-shinme-surface p-3 text-xs font-medium text-shinme-ink focus:border-shinme-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-shinme-line">
                <Button variant="ghost" size="sm" onClick={() => setIsCreateOpen(false)}>
                  Hủy
                </Button>
                <Button size="sm" onClick={handleCreateAssignment} disabled={isSubmittingNew}>
                  {isSubmittingNew ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Đang tạo...
                    </>
                  ) : (
                    <>
                      <Save className="size-4" /> Tạo bài tập
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
