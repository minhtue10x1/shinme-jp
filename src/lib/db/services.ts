import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import type { RoleId } from "@/lib/role-context";
import type {
  UserProfileDoc,
  ClassDoc,
  JLPTTestDoc,
  TestSubmissionDoc,
  AnnouncementDoc,
  LeadDoc,
  MaterialDoc,
  AssignmentDoc,
  AssignmentSubmissionInfo,
} from "@/lib/db/schema";

/* =====================================================================
 * USERS SERVICE
 * ===================================================================== */
export async function getUserProfile(uid: string): Promise<UserProfileDoc | null> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as UserProfileDoc) : null;
}

export async function getAllUsers(): Promise<UserProfileDoc[]> {
  const ref = collection(db, "users");
  const snap = await getDocs(ref);
  return snap.docs.map((d) => d.data() as UserProfileDoc);
}

export async function getUsersByClass(classId: string): Promise<UserProfileDoc[]> {
  const ref = collection(db, "users");
  const q = query(ref, where("classId", "==", classId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as UserProfileDoc);
}

export async function updateUserClassByAdmin(
  uid: string,
  classId: string,
  className: string,
  promoteGuestToStudent: boolean = true
): Promise<void> {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  const data = snap.data() as UserProfileDoc | undefined;

  const updates: Record<string, any> = {
    classId,
    className,
    updatedAt: new Date().toISOString(),
  };

  if (promoteGuestToStudent && data?.role === "guest") {
    updates.role = "student";
    if (data.code?.startsWith("KH-")) {
      updates.code = data.code.replace("KH-", "HV-");
    }
  }

  await updateDoc(ref, updates);
}

export async function assignTeacherAndClasses(
  uid: string,
  teacherName: string,
  classIds: string[],
  classes: ClassDoc[]
): Promise<void> {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  const data = snap.data() as UserProfileDoc | undefined;

  const primaryClass = classes.find((c) => c.id === classIds[0]);
  const classNames = classIds
    .map((id) => classes.find((c) => c.id === id)?.shortName || id)
    .join(", ");

  const userUpdates: Record<string, any> = {
    role: "sensei",
    classId: primaryClass ? primaryClass.id : "ALL",
    className: classNames ? `Phụ trách: ${classNames}` : "Giảng viên Shinme",
    updatedAt: new Date().toISOString(),
  };

  if (!data?.code || data.code.startsWith("KH-") || data.code.startsWith("HV-")) {
    userUpdates.code = `SS-${Date.now().toString(36).slice(-4).toUpperCase()}`;
  }

  await updateDoc(userRef, userUpdates);

  // Update selected classes in Firestore
  for (const cid of classIds) {
    const classRef = doc(db, "classes", cid);
    await updateDoc(classRef, {
      senseiId: uid,
      senseiName: teacherName,
    });
  }
}

export async function updateUserRole(uid: string, newRole: RoleId): Promise<void> {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  const data = snap.data() as UserProfileDoc | undefined;

  const updates: Record<string, any> = {
    role: newRole,
    updatedAt: new Date().toISOString(),
  };

  if (data?.code) {
    const rawNumber = data.code.replace(/^(KH|HV|SS|ADMIN)-?/, "");
    if (newRole === "sensei") updates.code = `SS-${rawNumber}`;
    else if (newRole === "student") updates.code = `HV-${rawNumber}`;
    else if (newRole === "guest") updates.code = `KH-${rawNumber}`;
  }

  await updateDoc(userRef, updates);
}

/* =====================================================================
 * CLASSES SERVICE
 * ===================================================================== */
export async function getClasses(): Promise<ClassDoc[]> {
  const ref = collection(db, "classes");
  const snap = await getDocs(ref);
  return snap.docs.map((d) => d.data() as ClassDoc);
}

export async function saveClass(cls: ClassDoc): Promise<void> {
  const ref = doc(db, "classes", cls.id);
  await setDoc(ref, cls, { merge: true });
}

export async function deleteClass(classId: string): Promise<void> {
  const ref = doc(db, "classes", classId);
  await deleteDoc(ref);
}

/* =====================================================================
 * TESTS & EXAMS SERVICE
 * ===================================================================== */
export async function getAllTests(): Promise<JLPTTestDoc[]> {
  const ref = collection(db, "tests");
  const snap = await getDocs(ref);
  return snap.docs.map((d) => d.data() as JLPTTestDoc);
}

export async function getTestsByClass(classId: string): Promise<JLPTTestDoc[]> {
  const ref = collection(db, "tests");
  const q = classId === "ALL" 
    ? ref 
    : query(ref, where("classId", "==", classId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as JLPTTestDoc);
}

export async function getTestById(testId: string): Promise<JLPTTestDoc | null> {
  const ref = doc(db, "tests", testId);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as JLPTTestDoc) : null;
}

export async function saveTestDoc(test: JLPTTestDoc): Promise<void> {
  const ref = doc(db, "tests", test.id);
  await setDoc(ref, test, { merge: true });
}

export async function deleteTestDoc(testId: string): Promise<void> {
  const ref = doc(db, "tests", testId);
  await deleteDoc(ref);
}

/* =====================================================================
 * TEST SUBMISSIONS SERVICE
 * ===================================================================== */
export async function saveTestSubmission(sub: TestSubmissionDoc): Promise<void> {
  const ref = doc(db, "test_submissions", sub.id);
  await setDoc(ref, sub, { merge: true });
}

export async function getSubmissionsByTest(testId: string): Promise<TestSubmissionDoc[]> {
  const ref = collection(db, "test_submissions");
  const q = query(ref, where("testId", "==", testId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as TestSubmissionDoc);
}

export async function getSubmissionsByStudent(studentId: string): Promise<TestSubmissionDoc[]> {
  const ref = collection(db, "test_submissions");
  const q = query(ref, where("studentId", "==", studentId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as TestSubmissionDoc);
}

export async function getAllSubmissions(): Promise<TestSubmissionDoc[]> {
  const ref = collection(db, "test_submissions");
  const snap = await getDocs(ref);
  return snap.docs.map((d) => d.data() as TestSubmissionDoc);
}

/* =====================================================================
 * ANNOUNCEMENTS SERVICE
 * ===================================================================== */
export async function getAnnouncements(classId?: string): Promise<AnnouncementDoc[]> {
  const ref = collection(db, "announcements");
  const snap = await getDocs(ref);
  const all = snap.docs.map((d) => d.data() as AnnouncementDoc);
  if (!classId || classId === "ALL") return all;
  return all.filter((a) => a.classId === classId || a.classId === "ALL");
}

export async function saveAnnouncementDoc(ann: AnnouncementDoc): Promise<void> {
  const ref = doc(db, "announcements", ann.id);
  await setDoc(ref, ann, { merge: true });
}

export async function deleteAnnouncementDoc(annId: string): Promise<void> {
  const ref = doc(db, "announcements", annId);
  await deleteDoc(ref);
}

export async function togglePinAnnouncementDoc(annId: string, currentPinned: boolean): Promise<void> {
  const ref = doc(db, "announcements", annId);
  await updateDoc(ref, {
    isPinned: !currentPinned,
  });
}

/* =====================================================================
 * LEADS SERVICE
 * ===================================================================== */
export async function saveLeadDoc(lead: LeadDoc): Promise<void> {
  const ref = doc(db, "leads", lead.id);
  await setDoc(ref, lead, { merge: true });
}

export async function getLeads(): Promise<LeadDoc[]> {
  const ref = collection(db, "leads");
  const snap = await getDocs(ref);
  return snap.docs.map((d) => d.data() as LeadDoc);
}

/* =====================================================================
 * MATERIALS SERVICE
 * ===================================================================== */
export async function getMaterials(classId?: string): Promise<MaterialDoc[]> {
  const ref = collection(db, "materials");
  const snap = await getDocs(ref);
  const list = snap.docs.map((d) => d.data() as MaterialDoc);
  if (!classId || classId === "ALL") return list;
  return list.filter((m) => m.classId === classId || m.classId === "ALL");
}

export async function saveMaterialDoc(material: MaterialDoc): Promise<void> {
  const ref = doc(db, "materials", material.id);
  await setDoc(ref, material, { merge: true });
}

export async function deleteMaterialDoc(materialId: string, fileUrl?: string): Promise<void> {
  const ref = doc(db, "materials", materialId);
  await deleteDoc(ref);
  if (fileUrl && fileUrl.includes("firebasestorage.googleapis.com")) {
    try {
      const storageFileRef = storageRef(storage, fileUrl);
      await deleteObject(storageFileRef);
    } catch {
      /* ignore file deletion errors if file was already removed */
    }
  }
}

export async function uploadMaterialFile(
  file: File,
  folder = "materials",
  onProgress?: (percent: number) => void
): Promise<{ url: string; sizeFormatted: string }> {
  // Format size: KB / MB
  const sizeKb = file.size / 1024;
  const sizeFormatted = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${Math.round(sizeKb)} KB`;

  // Clean filename and make unique
  const timestamp = Date.now();
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${folder}/${timestamp}_${cleanName}`;
  const fileStorageRef = storageRef(storage, path);

  const uploadTask = uploadBytesResumable(fileStorageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const percent = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        if (onProgress) onProgress(percent);
      },
      (error) => {
        reject(error);
      },
      async () => {
        const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
        resolve({ url: downloadUrl, sizeFormatted });
      }
    );
  });
}

/* =====================================================================
 * ASSIGNMENTS SERVICE (`assignments`)
 * ===================================================================== */
export async function getAssignments(classId?: string): Promise<AssignmentDoc[]> {
  const colRef = collection(db, "assignments");
  const snap = await getDocs(colRef);
  let list = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AssignmentDoc));
  if (classId && classId !== "ALL") {
    list = list.filter((a) => a.classId === "ALL" || a.classId === classId);
  }
  // Sort by createdAt desc or dueDate
  return list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

export async function saveAssignment(assignment: AssignmentDoc): Promise<void> {
  const ref = doc(db, "assignments", assignment.id);
  await setDoc(ref, assignment, { merge: true });
}

export async function deleteAssignment(id: string): Promise<void> {
  const ref = doc(db, "assignments", id);
  await deleteDoc(ref);
}

export async function submitAssignmentAnswer(
  assignmentId: string,
  studentId: string,
  submission: Partial<AssignmentSubmissionInfo>
): Promise<void> {
  const ref = doc(db, "assignments", assignmentId);
  await updateDoc(ref, {
    [`submissions.${studentId}`]: {
      ...submission,
      status: submission.status || "submitted",
      submittedAt: submission.submittedAt || new Date().toISOString(),
    },
  });
}

export async function gradeAssignmentSubmission(
  assignmentId: string,
  studentId: string,
  grading: Partial<AssignmentSubmissionInfo>
): Promise<void> {
  const ref = doc(db, "assignments", assignmentId);
  await updateDoc(ref, {
    [`submissions.${studentId}.score`]: grading.score,
    [`submissions.${studentId}.maxScore`]: grading.maxScore,
    [`submissions.${studentId}.feedback`]: grading.feedback,
    [`submissions.${studentId}.status`]: "graded",
    [`submissions.${studentId}.gradedAt`]: new Date().toISOString(),
  });
}


