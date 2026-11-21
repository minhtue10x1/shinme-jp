"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  FileUp,
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
  XCircle,
} from "lucide-react";
import { FuriganaText } from "@/components/furigana-text";
import { PdfImportDialog } from "@/components/portal/pdf-import-dialog";
import type { TestQuestion } from "@/lib/test-center-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRole } from "@/lib/role-context";
import { useTranslation } from "@/lib/i18n/context";
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

const QUICK_FEEDBACKS_VI = [
  "Phát âm và ngữ điệu rất tự nhiên!",
  "Chú ý thêm cách dùng trợ từ に và で.",
  "Phần chia thể bị động (受身形) cần ôn tập thêm một chút.",
  "Chữ Kanji viết đúng thứ tự nét và rất đẹp!",
  "Làm bài rất tốt, lập luận rõ ràng và giữ vững phong độ nhé! ♡",
  "Cần đọc kỹ lại mạch chuyển ý trong đoạn văn Đọc hiểu.",
];

const QUICK_FEEDBACKS_EN = [
  "Very natural pronunciation and intonation!",
  "Pay extra attention to particles に and で usage.",
  "Passive form (受身形) conjugation needs a bit more review.",
  "Kanji stroke order is accurate and looks wonderful!",
  "Great work, clear reasoning and keep up the momentum! ♡",
  "Review the transitions and argument flow in the Reading section.",
];

export default function AssignmentsPage() {
  const { role, user, firebaseUser } = useRole();
  const { lang, t } = useTranslation();
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
  const [isPdfImportOpen, setIsPdfImportOpen] = useState(false);
  const isCreatingRef = useRef(false);
  const draftAsgIdRef = useRef<string>(`asg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`);

  // Student submission modal (supports both text and multiple-choice quiz)
  const [submittingItem, setSubmittingItem] = useState<AssignmentDoc | null>(null);
  const [studentAnswerInput, setStudentAnswerInput] = useState("");
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<{
    score: number;
    maxScore: number;
    answerKey: Record<string, number>;
  } | null>(null);
  const [isSavingSubmission, setIsSavingSubmission] = useState(false);
  const isSubmittingQuizRef = useRef(false);

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
  const [formQuestions, setFormQuestions] = useState<TestQuestion[]>([]);

  const unansweredQuizCount = formQuestions.filter(
    (q) => q.correctIndex < 0 || q.correctIndex > 3
  ).length;

  const handleAssignmentPdfImported = (result: {
    questions: TestQuestion[];
    suggestedTitle?: string;
    suggestedTitleJa?: string;
    mode: "replace" | "append";
  }) => {
    const normalized = result.questions.map((q) => ({
      ...q,
      points: 1,
      mondaiLabel: "",
      grammarPoint: "",
      correctIndex: -1,
      explanation: "",
    }));
    const nextList = result.mode === "replace" ? normalized : [...formQuestions, ...normalized];
    setFormQuestions(nextList);
    setFormQuestionsCount(nextList.length);
    setFormMaxScore(nextList.length);
    if (!formTitle.trim() && result.suggestedTitle) setFormTitle(result.suggestedTitle);
    if (!formTitleJa.trim() && result.suggestedTitleJa) setFormTitleJa(result.suggestedTitleJa);
  };

  const handleAddManualQuizQuestion = () => {
    const idx = formQuestions.length + 1;
    const newQ: TestQuestion = {
      id: `q-asg-${Date.now().toString(36)}-${idx}`,
      type: "standard",
      mondaiLabel: "",
      points: 1,
      instruction: "",
      prompt: "",
      options: ["", "", "", ""],
      correctIndex: -1,
      explanation: "",
      grammarPoint: "",
    };
    const next = [...formQuestions, newQ];
    setFormQuestions(next);
    setFormQuestionsCount(next.length);
    setFormMaxScore(next.length);
  };

  // Initial data load
  const loadData = async () => {
    setIsLoading(true);
    try {
      const studentScopeUid = role === "student" ? (firebaseUser?.uid || user.id) : undefined;
      const [asgList, classList, userList] = await Promise.all([
        getAssignments(role === "student" ? user.classId : undefined, studentScopeUid),
        getClasses(),
        role === "student" ? Promise.resolve([]) : getAllUsers(),
      ]);
      setAssignments(asgList);
      setClasses(classList);
      setStudents(userList.filter((u) => u.role === "student"));
    } catch (error) {
      console.error("Failed to load assignments data:", error);
      toast.error(lang === "vi" ? "Không thể tải danh sách bài tập. Vui lòng thử lại!" : "Failed to load assignments. Please try again!");
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
    setQuizAnswers(existing?.answers || {});
    setQuizResult(null);
    isSubmittingQuizRef.current = false;
  };

  const handleSubmitQuizAssignment = async () => {
    if (!submittingItem || !submittingItem.questions || submittingItem.questions.length === 0) return;
    if (isSubmittingQuizRef.current) return;
    if (!firebaseUser) {
      toast.error(lang === "vi" ? "Vui lòng đăng nhập để nộp bài." : "Please sign in to submit.");
      return;
    }

    const totalQ = submittingItem.questions.length;
    const answeredCount = Object.keys(quizAnswers).length;
    if (answeredCount < totalQ) {
      toast.error(
        lang === "vi"
          ? `Bạn mới chọn ${answeredCount}/${totalQ} câu. Hãy hoàn thành đủ các câu trước khi nộp!`
          : `You answered ${answeredCount}/${totalQ} questions. Please complete all questions first!`
      );
      return;
    }

    isSubmittingQuizRef.current = true;
    setIsSavingSubmission(true);
    try {
      const idToken = await firebaseUser.getIdToken();
      const res = await fetch(`/api/assignments/${encodeURIComponent(submittingItem.id)}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ answers: quizAnswers }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data?.error || (lang === "vi" ? "Không thể chấm bài trên máy chủ." : "Failed to submit quiz."));
        isSubmittingQuizRef.current = false;
        return;
      }

      const sub = data.submission as AssignmentSubmissionInfo;
      const answerKey = (data.answerKey || {}) as Record<string, number>;
      const studentUid = firebaseUser.uid;

      setAssignments((prev) =>
        prev.map((a) =>
          a.id === submittingItem.id
            ? {
                ...a,
                submissions: {
                  ...(a.submissions || {}),
                  [studentUid]: sub,
                },
              }
            : a
        )
      );

      setQuizResult({
        score: sub.score ?? 0,
        maxScore: sub.maxScore ?? totalQ,
        answerKey,
      });

      toast.success(
        lang === "vi"
          ? `Đã nộp bài! Kết quả: ${sub.score}/${sub.maxScore} điểm`
          : `Submitted! Score: ${sub.score}/${sub.maxScore}`
      );
    } catch (err) {
      console.error("Quiz assignment submit error:", err);
      toast.error(lang === "vi" ? "Lỗi kết nối khi nộp bài." : "Network error while submitting.");
      isSubmittingQuizRef.current = false;
    } finally {
      setIsSavingSubmission(false);
    }
  };

  const handleSaveStudentSubmission = async () => {
    if (!submittingItem) return;
    if (!studentAnswerInput.trim()) {
      toast.error(lang === "vi" ? "Vui lòng nhập nội dung bài làm của bạn!" : "Please enter your submission answer!");
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

      toast.success(
        lang === "vi" ? "Đã nộp bài tập thành công!" : "Assignment submitted successfully!",
        {
          description:
            lang === "vi"
              ? "Sensei sẽ xem và chấm điểm cho bạn sớm nhất."
              : "Sensei will review and grade your work soon.",
        }
      );
      setSubmittingItem(null);
    } catch (error) {
      console.error("Error submitting assignment:", error);
      toast.error(lang === "vi" ? "Nộp bài thất bại. Vui lòng kiểm tra lại kết nối mạng!" : "Submission failed. Please check your network connection!");
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
    setFeedbackInput(
      existing?.feedback ||
        (lang === "vi"
          ? "Em hoàn thành bài rất tốt! Cần chú ý thêm một số cấu trúc phức tạp hơn."
          : "Great job completing this assignment! Pay attention to advanced sentence structures.")
    );
  };

  const handleSelectStudentToGrade = (uid: string) => {
    setSelectedStudentUid(uid);
    if (!gradingItem) return;
    const existing = gradingItem.submissions?.[uid];
    setScoreInput(existing?.score ?? (gradingItem.maxScore ? Math.floor(gradingItem.maxScore * 0.9) : 10));
    setFeedbackInput(
      existing?.feedback ||
        (lang === "vi"
          ? "Em hoàn thành bài rất tốt! Cần chú ý thêm một số cấu trúc phức tạp hơn."
          : "Great job completing this assignment! Pay attention to advanced sentence structures.")
    );
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

      toast.success(
        lang === "vi"
          ? `Đã lưu kết quả chấm điểm cho ${studentName}!`
          : `Saved grade for ${studentName}!`,
        {
          description:
            lang === "vi"
              ? `Điểm: ${scoreInput}/${gradingItem.maxScore} · Nhận xét đã cập nhật vào tài khoản học viên.`
              : `Score: ${scoreInput}/${gradingItem.maxScore} · Feedback updated to student account.`,
        }
      );
      setGradingItem(null);
    } catch (error) {
      console.error("Error saving grade:", error);
      toast.error(lang === "vi" ? "Không thể lưu kết quả chấm điểm. Vui lòng thử lại!" : "Failed to save grade. Please try again!");
    } finally {
      setIsSavingGrade(false);
    }
  };

  // Handle create new assignment
  const handleCreateAssignment = async () => {
    if (isCreatingRef.current) return;
    if (!formTitle.trim()) {
      toast.error(lang === "vi" ? "Vui lòng nhập tiêu đề bài tập!" : "Please enter assignment title!");
      return;
    }

    if (formQuestions.length > 0) {
      const missingNums = formQuestions
        .map((q, i) => (q.correctIndex < 0 || q.correctIndex > 3 ? i + 1 : -1))
        .filter((n) => n !== -1);
      if (missingNums.length > 0) {
        toast.error(
          lang === "vi"
            ? `Còn ${missingNums.length} câu chưa chọn đáp án đúng (Câu ${missingNums.slice(0, 10).join(", ")}${missingNums.length > 10 ? "..." : ""})!`
            : `${missingNums.length} questions still need a correct answer!`
        );
        return;
      }
    }

    const selectedClass = classes.find((c) => c.id === formClassId);
    const className =
      formClassId === "ALL"
        ? (lang === "vi" ? "Tất cả các lớp" : "All Classes")
        : (selectedClass?.code || selectedClass?.name || (lang === "vi" ? "Lớp học" : "Class"));
    const code = formCode.trim() || `ASG-${Date.now().toString().slice(-4)}`;

    const isQuiz = formQuestions.length > 0;
    const newDoc: AssignmentDoc = {
      id: draftAsgIdRef.current,
      code,
      title: formTitle.trim(),
      titleJa: formTitleJa.trim() || undefined,
      classId: formClassId,
      className,
      level: formLevel,
      type: formType,
      dueDate: formDueDate,
      questionsCount: isQuiz ? formQuestions.length : Number(formQuestionsCount) || 5,
      maxScore: isQuiz ? formQuestions.length : Number(formMaxScore) || 10,
      description: formDescription.trim() || undefined,
      ...(isQuiz
        ? {
            questions: formQuestions.map((q) => ({
              ...q,
              points: 1,
              mondaiLabel: "",
              grammarPoint: "",
            })),
          }
        : {}),
      createdBy: user.name || "Sensei Shinme",
      createdAt: new Date().toISOString(),
      submissions: {},
    };

    isCreatingRef.current = true;
    setIsSubmittingNew(true);
    try {
      await saveAssignment(newDoc);
      setAssignments((prev) => [newDoc, ...prev]);
      toast.success(lang === "vi" ? `Đã tạo bài tập [${code}] thành công!` : `Created assignment [${code}] successfully!`);
      // Reset form & rotate draft ID for next assignment
      draftAsgIdRef.current = `asg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      setFormQuestions([]);
      setFormTitle("");
      setFormTitleJa("");
      setFormCode("");
      setFormDescription("");
      setIsCreateOpen(false);
    } catch (error) {
      console.error("Failed to create assignment:", error);
      toast.error(lang === "vi" ? "Không thể tạo bài tập. Vui lòng thử lại!" : "Failed to create assignment.");
    } finally {
      isCreatingRef.current = false;
      setIsSubmittingNew(false);
    }
  };

  // Handle delete assignment
  const handleDeleteAssignment = async (id: string, code: string) => {
    if (!window.confirm(lang === "vi" ? `Bạn có chắc chắn muốn xóa bài tập ${code} không?` : `Are you sure you want to delete assignment ${code}?`)) return;

    try {
      await deleteAssignment(id);
      setAssignments((prev) => prev.filter((a) => a.id !== id));
      toast.success(lang === "vi" ? `Đã xóa bài tập ${code}.` : `Deleted assignment ${code}.`);
    } catch (error) {
      console.error("Error deleting assignment:", error);
      toast.error(lang === "vi" ? "Không thể xóa bài tập. Vui lòng thử lại!" : "Failed to delete assignment. Please try again!");
    }
  };

  return (
    <div className="space-y-6 animate-[rise-in_260ms_var(--ease-out-expo)_both]">
      {/* Header */}
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-shinme-line pb-5">
        <div>
          <h1 className="text-2xl font-black text-shinme-ink sm:text-3xl">
            {lang === "vi" ? "Bài tập & Mondai" : "Assignments & Mondai"}
          </h1>
          <p className="mt-1 text-sm font-semibold text-shinme-muted">
            {role === "student"
              ? (lang === "vi"
                  ? "Danh sách bài tập về nhà, Mini Test và Mondai luyện thi tiếng Nhật"
                  : "Homework, Mini Tests, and Japanese practice exercises")
              : (lang === "vi"
                  ? "Quản lý đề kiểm tra, chấm bài và giao bài tập theo lớp"
                  : "Manage exam assignments, grading, and homework per class")}
          </p>
        </div>
        {role !== "student" && (
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="size-4" /> {lang === "vi" ? "Tạo đề bài mới" : "New Assignment"}
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "ALL", vi: "Tất cả dạng bài", en: "All Types" },
            { id: "Kanji", vi: "Kanji", en: "Kanji" },
            { id: "Ngữ pháp", vi: "Ngữ pháp", en: "Grammar" },
            { id: "Đọc hiểu", vi: "Đọc hiểu", en: "Reading" },
            { id: "Kaiwa", vi: "Kaiwa", en: "Conversation" },
            { id: "Tổng hợp", vi: "Tổng hợp", en: "Comprehensive" },
          ].map((typeItem) => (
            <button
              key={typeItem.id}
              onClick={() => setFilterType(typeItem.id)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                filterType === typeItem.id
                  ? "bg-shinme-primary text-white"
                  : "bg-shinme-surface text-shinme-ink-soft border border-shinme-border hover:bg-shinme-leaf"
              }`}
            >
              {lang === "vi" ? typeItem.vi : typeItem.en}
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
              <option value="ALL">{lang === "vi" ? "Tất cả lớp học" : "All Classes"}</option>
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
              placeholder={lang === "vi" ? "Tìm theo mã hoặc tên..." : "Search by code or title..."}
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
          <p className="text-sm font-semibold">
            {lang === "vi" ? "Đang tải danh sách bài tập từ dữ liệu trung tâm..." : "Loading assignments from center database..."}
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-shinme-border bg-shinme-surface p-12 text-center">
          <BookOpen className="mx-auto size-12 text-shinme-muted/60" />
          <h3 className="mt-3 text-base font-bold text-shinme-ink">
            {lang === "vi" ? "Chưa có bài tập nào" : "No assignments found"}
          </h3>
          <p className="mt-1 text-xs text-shinme-muted">
            {search || filterType !== "ALL" || filterClass !== "ALL"
              ? (lang === "vi" ? "Không tìm thấy bài tập phù hợp với bộ lọc hiện tại." : "No assignments match your search filter.")
              : (lang === "vi" ? "Hiện tại chưa có bài tập nào được giao." : "No assignments have been given yet.")}
          </p>
          {role !== "student" && (
            <Button size="sm" onClick={() => setIsCreateOpen(true)} className="mt-4">
              <Plus className="size-4" /> {lang === "vi" ? "Tạo bài tập đầu tiên" : "Create First Assignment"}
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
                        {lang === "vi" ? "· Lớp: " : "· Class: "}
                        <strong className="text-shinme-ink">{item.className}</strong>
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
                        <Clock className="size-3.5 text-shinme-muted" /> {lang === "vi" ? "Hạn nộp: " : "Due: "}
                        <strong className="font-bold text-shinme-danger">{item.dueDate}</strong>
                      </span>
                      <span>·</span>
                      <span>
                        {lang === "vi" ? "Số câu: " : "Questions: "}
                        <strong>{item.questionsCount}</strong>
                      </span>
                      <span>·</span>
                      <span>
                        {lang === "vi" ? "Thang điểm: " : "Max Score: "}
                        <strong>{item.maxScore}đ</strong>
                      </span>
                    </div>
                  </div>

                  {/* Actions according to role */}
                  <div className="flex flex-col items-end gap-2 self-center sm:self-start">
                    {role === "student" ? (
                      isGraded ? (
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 rounded-full bg-shinme-leaf px-3 py-1 text-xs font-black text-shinme-primary">
                            <CheckCircle2 className="size-3.5" /> {lang === "vi" ? "Đã chấm điểm" : "Graded"}
                          </span>
                          <p className="mt-1 text-lg font-black text-shinme-ink">
                            {studentSub?.score} / {item.maxScore} {lang === "vi" ? "điểm" : "pts"}
                          </p>
                        </div>
                      ) : isSubmitted ? (
                        <div className="text-right">
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-black text-amber-700">
                            <Clock className="size-3.5" /> {lang === "vi" ? "Đã nộp · Đang chờ chấm" : "Submitted · Pending Grade"}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 text-xs"
                            onClick={() => handleOpenStudentSubmission(item)}
                          >
                            <Pencil className="size-3.5" /> {lang === "vi" ? "Xem / Sửa bài đã nộp" : "View / Edit Submission"}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleOpenStudentSubmission(item)}
                          className="font-bold"
                        >
                          <Send className="size-3.5" /> {lang === "vi" ? "Nộp bài làm" : "Submit Answer"}
                        </Button>
                      )
                    ) : (
                      <div className="text-right space-y-1">
                        <p className="text-xs font-bold text-shinme-muted">
                          {lang === "vi" ? "Tiến độ nộp bài" : "Submission Progress"}
                        </p>
                        <p className="text-base font-black text-shinme-primary">
                          {submissionsCount} / {totalStudentsCount} {lang === "vi" ? "học viên" : "students"}
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openGradingModal(item)}
                          >
                            <UserCheck className="size-3.5" /> {lang === "vi" ? "Chấm bài & Nhận xét" : "Grade & Feedback"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAssignment(item.id, item.code)}
                            className="text-shinme-muted hover:text-shinme-danger"
                            title={lang === "vi" ? "Xóa bài tập này" : "Delete assignment"}
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
                    <strong className="text-shinme-primary">
                      {lang === "vi" ? "Nhận xét từ Sensei: " : "Feedback from Sensei: "}
                    </strong>
                    {studentSub.feedback}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Student Submission Modal (Supports both Multiple-Choice Quiz & Freeform Text) */}
      {submittingItem && (
        <Dialog open={true} onOpenChange={(open) => !open && setSubmittingItem(null)}>
          <DialogContent
            className={
              submittingItem.questions && submittingItem.questions.length > 0
                ? "max-w-3xl max-h-[90vh] overflow-y-auto"
                : "max-w-xl"
            }
          >
            <div className="p-6 sm:p-8 space-y-5">
              <div>
                <DialogTitle className="text-xl font-black text-shinme-ink flex items-center gap-2">
                  <Send className="size-5 text-shinme-primary" />{" "}
                  {submittingItem.questions && submittingItem.questions.length > 0
                    ? (lang === "vi" ? "Làm bài tập trắc nghiệm" : "Multiple-Choice Assignment")
                    : (lang === "vi" ? "Nộp bài tập" : "Submit Assignment")}
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs text-shinme-muted">
                  {lang === "vi" ? "Học viên: " : "Student: "}
                  <strong className="text-shinme-ink font-bold">{user.name} ({user.code})</strong> · {lang === "vi" ? "Hạn nộp: " : "Due: "}
                  {submittingItem.dueDate}
                </DialogDescription>
              </div>

              <div className="rounded-xl bg-shinme-bg p-4 border border-shinme-line space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-xs font-black text-shinme-primary">{submittingItem.code}</span>
                  <span className="rounded-full bg-shinme-leaf px-2.5 py-0.5 text-xs font-bold text-shinme-primary">
                    {submittingItem.type} · {submittingItem.maxScore}đ
                  </span>
                </div>
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

              {submittingItem.questions && submittingItem.questions.length > 0 ? (
                <div className="space-y-4">
                  {quizResult && (
                    <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="size-6 text-shinme-primary" />
                        <div>
                          <p className="text-sm font-black text-shinme-primary">
                            {lang === "vi"
                              ? `Kết quả: ${quizResult.score} / ${quizResult.maxScore} điểm`
                              : `Score: ${quizResult.score} / ${quizResult.maxScore}`}
                          </p>
                          <p className="text-xs text-shinme-ink-soft">
                            {lang === "vi"
                              ? "Mỗi câu đúng được 1 điểm. Đáp án đã được lưu vào bảng điểm."
                              : "1 point per correct answer. Result saved to your profile."}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {submittingItem.questions.map((q, qIdx) => {
                    const chosen = quizAnswers[q.id];
                    const correctIdx = quizResult?.answerKey?.[q.id];
                    const letters = ["A", "B", "C", "D"];

                    return (
                      <div
                        key={q.id}
                        className="rounded-2xl border border-shinme-border bg-white p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-shinme-primary px-2.5 py-0.5 font-mono text-xs font-bold text-white">
                            {lang === "vi" ? `Câu ${qIdx + 1}` : `Q${qIdx + 1}`}
                          </span>
                          <span className="text-xs font-bold text-shinme-muted">1đ</span>
                        </div>

                        {q.passageText && (
                          <div className="rounded-xl border border-sky-200 bg-sky-50/40 p-3 font-jp text-xs leading-relaxed text-slate-800 whitespace-pre-line">
                            <FuriganaText text={q.passageText} />
                          </div>
                        )}

                        <div className="font-jp text-sm font-bold leading-relaxed text-shinme-ink">
                          <FuriganaText text={q.prompt} />
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2">
                          {q.options.map((opt, optIdx) => {
                            const isSelected = chosen === optIdx;
                            const isCorrect = quizResult && correctIdx === optIdx;
                            const isWrongSelected = quizResult && isSelected && correctIdx !== optIdx;

                            let cls =
                              "border-shinme-border bg-shinme-surface text-shinme-ink hover:border-shinme-primary/60";
                            if (isCorrect) {
                              cls = "border-emerald-600 bg-emerald-50 text-emerald-900 font-bold";
                            } else if (isWrongSelected) {
                              cls = "border-rose-500 bg-rose-50 text-rose-900 font-bold";
                            } else if (isSelected) {
                              cls = "border-shinme-primary bg-shinme-leaf/60 text-shinme-primary font-bold";
                            }

                            return (
                              <button
                                key={optIdx}
                                type="button"
                                disabled={Boolean(quizResult)}
                                onClick={() =>
                                  setQuizAnswers((prev) => ({ ...prev, [q.id]: optIdx }))
                                }
                                className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left font-jp text-xs transition ${cls}`}
                              >
                                <span className="flex items-center gap-2">
                                  <span className="grid size-6 shrink-0 place-items-center rounded-md bg-white font-mono text-xs font-black text-shinme-primary shadow-2xs">
                                    {letters[optIdx]}
                                  </span>
                                  <FuriganaText text={opt} />
                                </span>
                                {isCorrect && <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />}
                                {isWrongSelected && <XCircle className="size-4 shrink-0 text-rose-600" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  <div className="flex items-center justify-between gap-3 pt-2 border-t border-shinme-line">
                    <span className="text-xs font-bold text-shinme-muted">
                      {lang === "vi"
                        ? `Đã chọn: ${Object.keys(quizAnswers).length}/${submittingItem.questions.length} câu`
                        : `Answered: ${Object.keys(quizAnswers).length}/${submittingItem.questions.length}`}
                    </span>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setSubmittingItem(null)}>
                        {quizResult ? (lang === "vi" ? "Đóng" : "Close") : (lang === "vi" ? "Hủy" : "Cancel")}
                      </Button>
                      {!quizResult && (
                        <Button size="sm" onClick={handleSubmitQuizAssignment} disabled={isSavingSubmission}>
                          {isSavingSubmission ? (
                            <>
                              <Loader2 className="size-4 animate-spin" /> {lang === "vi" ? "Đang chấm..." : "Grading..."}
                            </>
                          ) : (
                            <>
                              <Send className="size-4" /> {lang === "vi" ? "Nộp bài & Chấm điểm" : "Submit & Grade"}
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-shinme-ink">
                      {lang === "vi" ? "Nội dung câu trả lời / Bài làm của bạn:" : "Your answers / submission content:"}
                    </label>
                    <textarea
                      rows={6}
                      value={studentAnswerInput}
                      onChange={(e) => setStudentAnswerInput(e.target.value)}
                      placeholder={
                        lang === "vi"
                          ? "Gõ trực tiếp đáp án các câu, đoạn văn câu hỏi hoặc chèn link file drive bài làm..."
                          : "Type your answers, essays or paste links to your assignment drive files..."
                      }
                      className="w-full rounded-xl border-2 border-shinme-border p-3 text-sm text-shinme-ink focus:border-shinme-primary focus:outline-none leading-relaxed"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2 border-t border-shinme-line">
                    <Button variant="ghost" size="sm" onClick={() => setSubmittingItem(null)}>
                      {lang === "vi" ? "Hủy" : "Cancel"}
                    </Button>
                    <Button size="sm" onClick={handleSaveStudentSubmission} disabled={isSavingSubmission}>
                      {isSavingSubmission ? (
                        <>
                          <Loader2 className="size-4 animate-spin" /> {lang === "vi" ? "Đang lưu..." : "Saving..."}
                        </>
                      ) : (
                        <>
                          <Send className="size-4" /> {lang === "vi" ? "Xác nhận nộp bài" : "Confirm & Submit"}
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
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
                  <UserCheck className="size-5 text-shinme-primary" /> {lang === "vi" ? "Chấm bài & Nhận xét" : "Grade & Feedback"}
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs text-shinme-muted">
                  {lang === "vi" ? "Đề bài: " : "Assignment: "}
                  <strong className="text-shinme-ink font-bold">{gradingItem.code} - {gradingItem.title}</strong> · {lang === "vi" ? "Thang điểm: " : "Scale: "}
                  {gradingItem.maxScore}đ
                </DialogDescription>
              </div>

              {/* Student Picker */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-shinme-ink">
                  {lang === "vi" ? "Chọn học viên trong lớp để chấm:" : "Select student in class to grade:"}
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
                              {lang === "vi" ? "Đã nộp" : "Submitted"}
                            </span>
                          ) : (
                            <span className="text-xs opacity-60">{lang === "vi" ? "Chưa nộp" : "Pending"}</span>
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
                      {lang === "vi" ? "Bài làm của học viên:" : "Student's submission:"}
                    </p>
                    {curSub?.studentAnswer ? (
                      <p className="text-xs font-medium text-shinme-ink whitespace-pre-wrap leading-relaxed">
                        {curSub.studentAnswer}
                      </p>
                    ) : (
                      <p className="text-xs italic text-shinme-muted">
                        {lang === "vi"
                          ? "Học viên chưa nộp bài qua hệ thống (hoặc nộp trực tiếp tại lớp). Sensei có thể chấm điểm và gửi nhận xét trực tiếp dưới đây."
                          : "Student has not submitted through portal yet. Sensei can still award a score and leave feedback below."}
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* Score Input */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-shinme-ink">
                  {lang === "vi" ? "Điểm số đạt được:" : "Awarded Score:"}
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
                    / {gradingItem.maxScore || 10} {lang === "vi" ? "điểm" : "points"}
                  </span>
                </div>
              </div>

              {/* Quick Feedback Suggestions */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-shinme-ink">
                  {lang === "vi" ? "Mẫu nhận xét nhanh của Sensei:" : "Quick feedback templates:"}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(lang === "vi" ? QUICK_FEEDBACKS_VI : QUICK_FEEDBACKS_EN).map((fb) => (
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
                  {lang === "vi" ? "Nội dung nhận xét chi tiết:" : "Detailed Feedback:"}
                </label>
                <textarea
                  rows={3}
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder={lang === "vi" ? "Nhập lời khen hoặc dặn dò cho học viên..." : "Enter compliments or guidance for the student..."}
                  className="w-full rounded-xl border-2 border-shinme-border p-3 text-sm text-shinme-ink focus:border-shinme-primary focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-shinme-line">
                <Button variant="ghost" size="sm" onClick={() => setGradingItem(null)}>
                  {lang === "vi" ? "Hủy" : "Cancel"}
                </Button>
                <Button size="sm" onClick={handleSaveGrading} disabled={isSavingGrade}>
                  {isSavingGrade ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> {lang === "vi" ? "Đang lưu..." : "Saving..."}
                    </>
                  ) : (
                    <>
                      <Save className="size-4" /> {lang === "vi" ? "Lưu kết quả chấm" : "Save Grade"}
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
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 sm:p-8 space-y-4">
              <div>
                <DialogTitle className="text-xl font-black text-shinme-ink flex items-center gap-2">
                  <Plus className="size-5 text-shinme-primary" /> {lang === "vi" ? "Tạo đề bài tập mới" : "Create New Assignment"}
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs text-shinme-muted">
                  {lang === "vi"
                    ? "Giao bài tập về nhà, Mini Test hoặc bài luyện Dokkai/Kaiwa trực tiếp cho các lớp học."
                    : "Assign homework, Mini Tests, or Dokkai/Kaiwa exercises directly to classes."}
                </DialogDescription>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-shinme-ink">
                    {lang === "vi" ? "Mã bài tập *" : "Assignment Code *"}
                  </label>
                  <input
                    type="text"
                    placeholder={lang === "vi" ? "VD: BTVN-27, TEST-04..." : "e.g. HW-27, TEST-04..."}
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="h-10 w-full rounded-xl border border-shinme-border bg-shinme-surface px-3 text-xs font-semibold text-shinme-ink focus:border-shinme-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-shinme-ink">
                    {lang === "vi" ? "Lớp học giao bài *" : "Target Class *"}
                  </label>
                  <select
                    value={formClassId}
                    onChange={(e) => setFormClassId(e.target.value)}
                    className="h-10 w-full rounded-xl border border-shinme-border bg-shinme-surface px-3 text-xs font-semibold text-shinme-ink focus:border-shinme-primary focus:outline-none"
                  >
                    <option value="ALL">{lang === "vi" ? "Tất cả các lớp" : "All Classes"}</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.shortName || c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-shinme-ink">
                    {lang === "vi" ? "Tiêu đề bài tập *" : "Assignment Title *"}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      lang === "vi"
                        ? "VD: Soumatome N3 Bài 27: Đặt 5 câu với cấu trúc ～わりに"
                        : "e.g. Soumatome N3 Lesson 27: Write 5 sentences with ～わりに"
                    }
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="h-10 w-full rounded-xl border border-shinme-border bg-shinme-surface px-3 text-xs font-semibold text-shinme-ink focus:border-shinme-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-bold text-shinme-ink">
                    {lang === "vi"
                      ? "Tiêu đề tiếng Nhật (tùy chọn, kèm Furigana dạng Kanji[furigana])"
                      : "Japanese Title (optional, Furigana format Kanji[furigana])"}
                  </label>
                  <input
                    type="text"
                    placeholder="VD: 総まとめ文法[そうまとめぶんぽう] 作文[さくぶん]"
                    value={formTitleJa}
                    onChange={(e) => setFormTitleJa(e.target.value)}
                    className="h-10 w-full rounded-xl border border-shinme-border bg-shinme-surface px-3 text-xs font-semibold text-shinme-ink focus:border-shinme-primary focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-shinme-ink">
                    {lang === "vi" ? "Trình độ JLPT" : "JLPT Level"}
                  </label>
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
                  <label className="text-xs font-bold text-shinme-ink">
                    {lang === "vi" ? "Thể loại bài" : "Category"}
                  </label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="h-10 w-full rounded-xl border border-shinme-border bg-shinme-surface px-3 text-xs font-semibold text-shinme-ink focus:border-shinme-primary focus:outline-none"
                  >
                    <option value="Kanji">Kanji</option>
                    <option value="Ngữ pháp">{lang === "vi" ? "Ngữ pháp" : "Grammar"}</option>
                    <option value="Đọc hiểu">{lang === "vi" ? "Đọc hiểu" : "Reading"}</option>
                    <option value="Kaiwa">{lang === "vi" ? "Kaiwa" : "Conversation"}</option>
                    <option value="Tổng hợp">{lang === "vi" ? "Tổng hợp" : "Comprehensive"}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-shinme-ink">
                    {lang === "vi" ? "Hạn nộp bài" : "Due Date"}
                  </label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    className="h-10 w-full rounded-xl border border-shinme-border bg-shinme-surface px-3 text-xs font-semibold text-shinme-ink focus:border-shinme-primary focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-shinme-ink">
                      {lang === "vi" ? "Số câu" : "Questions Count"}
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formQuestionsCount}
                      onChange={(e) => setFormQuestionsCount(Number(e.target.value))}
                      className="h-10 w-full rounded-xl border border-shinme-border bg-shinme-surface px-3 text-xs font-semibold text-shinme-ink focus:border-shinme-primary focus:outline-none tabular"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-shinme-ink">
                      {lang === "vi" ? "Thang điểm" : "Max Score"}
                    </label>
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
                  <label className="text-xs font-bold text-shinme-ink">
                    {lang === "vi" ? "Mô tả / Hướng dẫn làm bài" : "Instructions / Description"}
                  </label>
                  <textarea
                    rows={2}
                    placeholder={
                      lang === "vi"
                        ? "Ghi chú chi tiết yêu cầu nộp bài, số từ hoặc quy định nộp..."
                        : "Detailed notes on requirements, length, or submission guidelines..."
                    }
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full rounded-xl border border-shinme-border bg-shinme-surface p-3 text-xs font-medium text-shinme-ink focus:border-shinme-primary focus:outline-none"
                  />
                </div>

                {/* QUIZ / PDF IMPORT SECTION FOR ASSIGNMENTS (1 PT PER QUESTION, NO MONDAI/SKILL) */}
                <div className="sm:col-span-2 space-y-3 rounded-2xl border border-shinme-border bg-shinme-bg/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-black text-shinme-ink">
                        {lang === "vi"
                          ? "Bộ câu hỏi trắc nghiệm (Tuỳ chọn · 1 điểm / câu)"
                          : "Multiple-Choice Quiz Questions (Optional · 1 pt / question)"}
                      </p>
                      <p className="text-xs text-shinme-muted">
                        {lang === "vi"
                          ? "Nhập từ file PDF hoặc thêm tay — không chia Mondai/kỹ năng, Sensei tự chọn đáp án đúng trước khi xuất bản."
                          : "Import from PDF or add manually — 1 point each, Sensei picks answer keys before publishing."}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsPdfImportOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-shinme-primary/40 bg-white px-3 py-1.5 text-xs font-extrabold text-shinme-primary shadow-2xs hover:bg-shinme-leaf/40"
                      >
                        <FileUp className="size-3.5" />
                        {lang === "vi" ? "Nhập đề từ PDF (AI)" : "Import PDF (AI)"}
                      </button>
                      <button
                        type="button"
                        onClick={handleAddManualQuizQuestion}
                        className="inline-flex items-center gap-1 rounded-xl border border-shinme-border bg-white px-3 py-1.5 text-xs font-bold text-shinme-ink hover:bg-slate-50"
                      >
                        <Plus className="size-3.5" />
                        {lang === "vi" ? "Thêm câu tay" : "Add Question"}
                      </button>
                    </div>
                  </div>

                  {formQuestions.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs font-bold text-amber-900">
                        <span className="inline-flex items-center gap-1.5">
                          <AlertTriangle className="size-3.5 text-amber-600" />
                          {lang === "vi"
                            ? `Tổng: ${formQuestions.length} câu (${formQuestions.length} điểm) · Chưa chọn đáp án: ${unansweredQuizCount} câu`
                            : `Total: ${formQuestions.length} questions (${formQuestions.length} pts) · Unanswered: ${unansweredQuizCount}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => setFormQuestions([])}
                          className="text-rose-700 hover:underline"
                        >
                          {lang === "vi" ? "Xóa tất cả câu hỏi" : "Clear all"}
                        </button>
                      </div>

                      <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                        {formQuestions.map((q, qIdx) => {
                          const missing = q.correctIndex < 0 || q.correctIndex > 3;
                          const letters = ["A", "B", "C", "D"];
                          return (
                            <div
                              key={q.id}
                              className={`rounded-xl border p-3 space-y-2.5 bg-white ${
                                missing ? "border-amber-300" : "border-shinme-border"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <span className="rounded-md bg-shinme-primary px-2 py-0.5 font-mono text-xs font-bold text-white">
                                    {lang === "vi" ? `Câu ${qIdx + 1}` : `Q${qIdx + 1}`}
                                  </span>
                                  <span className="text-xs font-bold text-shinme-muted">1đ</span>
                                  {missing && (
                                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">
                                      {lang === "vi" ? "Chưa chọn đáp án" : "Pick answer"}
                                    </span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = formQuestions.filter((item) => item.id !== q.id);
                                    setFormQuestions(next);
                                    setFormQuestionsCount(next.length || 5);
                                    setFormMaxScore(next.length || 10);
                                  }}
                                  className="text-xs font-bold text-rose-600 hover:underline"
                                >
                                  {lang === "vi" ? "Xóa" : "Delete"}
                                </button>
                              </div>

                              <input
                                type="text"
                                value={q.prompt}
                                onChange={(e) =>
                                  setFormQuestions((prev) =>
                                    prev.map((item) =>
                                      item.id === q.id ? { ...item, prompt: e.target.value } : item
                                    )
                                  )
                                }
                                placeholder={lang === "vi" ? "Nội dung câu hỏi (hỗ trợ 漢字[かんじ])" : "Question prompt..."}
                                className="w-full rounded-lg border border-shinme-border px-2.5 py-1.5 font-jp text-xs font-bold text-shinme-ink"
                              />
                              {q.prompt && (
                                <div className="rounded-lg bg-shinme-bg px-2.5 py-1 font-jp text-xs text-shinme-primary">
                                  <FuriganaText text={q.prompt} />
                                </div>
                              )}

                              <div className="grid gap-2 sm:grid-cols-2">
                                {q.options.map((opt, optIdx) => {
                                  const isRight = q.correctIndex === optIdx;
                                  return (
                                    <div
                                      key={optIdx}
                                      className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${
                                        isRight
                                          ? "border-shinme-primary bg-emerald-50"
                                          : "border-shinme-border bg-white"
                                      }`}
                                    >
                                      <input
                                        type="radio"
                                        name={`asg-correct-${q.id}`}
                                        checked={isRight}
                                        onChange={() =>
                                          setFormQuestions((prev) =>
                                            prev.map((item) =>
                                              item.id === q.id
                                                ? { ...item, correctIndex: optIdx }
                                                : item
                                            )
                                          )
                                        }
                                        className="accent-shinme-primary"
                                      />
                                      <span className="font-mono text-xs font-black text-shinme-primary">
                                        {letters[optIdx]}
                                      </span>
                                      <input
                                        type="text"
                                        value={opt}
                                        onChange={(e) =>
                                          setFormQuestions((prev) =>
                                            prev.map((item) => {
                                              if (item.id !== q.id) return item;
                                              const nextOpts = [...item.options] as [
                                                string,
                                                string,
                                                string,
                                                string,
                                              ];
                                              nextOpts[optIdx] = e.target.value;
                                              return { ...item, options: nextOpts };
                                            })
                                          )
                                        }
                                        className="min-w-0 flex-1 bg-transparent font-jp text-xs text-shinme-ink focus:outline-none"
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-shinme-line">
                <Button variant="ghost" size="sm" onClick={() => setIsCreateOpen(false)}>
                  {lang === "vi" ? "Hủy" : "Cancel"}
                </Button>
                <Button size="sm" onClick={handleCreateAssignment} disabled={isSubmittingNew}>
                  {isSubmittingNew ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> {lang === "vi" ? "Đang tạo..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      <Save className="size-4" />{" "}
                      {formQuestions.length > 0
                        ? (lang === "vi"
                            ? `Xuất bản bài tập (${formQuestions.length} câu · ${formQuestions.length}đ)`
                            : `Publish Quiz (${formQuestions.length} Qs)`)
                        : (lang === "vi" ? "Tạo bài tập" : "Create Assignment")}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      <PdfImportDialog
        open={isPdfImportOpen}
        onOpenChange={setIsPdfImportOpen}
        defaultLevel={formLevel === "KAIWA" ? "N3" : formLevel}
        modeType="assignment"
        onImported={handleAssignmentPdfImported}
      />
    </div>
  );
}
