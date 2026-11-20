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
  limit,
} from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytes,
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
  TestAnswerKeyDoc,
  TestAnswerKeyEntry,
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
  const snap = await getDocs(query(ref, limit(500)));
  return snap.docs.map((d) => d.data() as UserProfileDoc);
}

export async function getUsersByClass(classId: string): Promise<UserProfileDoc[]> {
  const ref = collection(db, "users");
  const q = query(ref, where("classId", "==", classId), limit(200));
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

  const updates: Record<string, unknown> = {
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

  const userUpdates: Record<string, unknown> = {
    role: "sensei",
    classId: primaryClass ? primaryClass.id : "ALL",
    className: classNames ? `Phụ trách: ${classNames}` : "Giảng viên Shinme",
    updatedAt: new Date().toISOString(),
  };

  if (!data?.code || data.code.startsWith("KH-") || data.code.startsWith("HV-")) {
    userUpdates.code = `SS-${Date.now().toString(36).slice(-4).toUpperCase()}`;
  }

  await updateDoc(userRef, userUpdates);

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

  const updates: Record<string, unknown> = {
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

export async function updateUserAvatar(uid: string, avatarUrl: string): Promise<void> {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    avatarUrl: avatarUrl || "",
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Upload compressed avatar Blob to Firebase Storage (`avatars/{uid}/avatar.webp`).
 * Returns public download URL so Firestore `users/{uid}.avatarUrl` stays lightweight.
 */
export async function uploadUserAvatarToStorage(uid: string, blob: Blob): Promise<string> {
  const ext = blob.type === "image/webp" ? "webp" : "jpg";
  const path = `avatars/${uid}/avatar_${Date.now()}.${ext}`;
  const avatarStorageRef = storageRef(storage, path);
  await uploadBytes(avatarStorageRef, blob, {
    contentType: blob.type || "image/webp",
    cacheControl: "public, max-age=604800",
  });
  return getDownloadURL(avatarStorageRef);
}

/* =====================================================================
 * CLASSES SERVICE
 * ===================================================================== */
export async function getClasses(): Promise<ClassDoc[]> {
  const ref = collection(db, "classes");
  const snap = await getDocs(query(ref, limit(100)));
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
 * TESTS & EXAMS SERVICE (with secure answer-key separation)
 * ===================================================================== */
export async function getAllTests(): Promise<JLPTTestDoc[]> {
  const ref = collection(db, "tests");
  const snap = await getDocs(query(ref, limit(200)));
  return snap.docs.map((d) => d.data() as JLPTTestDoc);
}

export async function getTestsByClass(classId: string): Promise<JLPTTestDoc[]> {
  const ref = collection(db, "tests");
  const q =
    !classId || classId === "ALL"
      ? query(ref, limit(200))
      : query(ref, where("classId", "in", [classId, "ALL"]), limit(100));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as JLPTTestDoc);
}

export async function getTestById(testId: string): Promise<JLPTTestDoc | null> {
  const ref = doc(db, "tests", testId);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as JLPTTestDoc) : null;
}

export async function getTestAnswerKey(testId: string): Promise<TestAnswerKeyDoc | null> {
  const ref = doc(db, "test_answer_keys", testId);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as TestAnswerKeyDoc) : null;
}

/**
 * Saves a JLPT test securely:
 * - Strips answer keys (`correctIndex`, `explanation`, `starCorrectOrder`, `audioScript`)
 *   from `tests/{testId}` so students cannot read answers from browser DevTools.
 * - Stores the answer key in `test_answer_keys/{testId}` (readable only by Sensei/Admin/Server).
 */
export async function saveTestDoc(test: JLPTTestDoc): Promise<void> {
  const hasRealAnswers = (test.questions || []).some(
    (q) => typeof q.correctIndex === "number" && q.correctIndex >= 0
  );

  if (hasRealAnswers) {
    const answers: Record<string, TestAnswerKeyEntry> = {};
    for (const q of test.questions) {
      answers[q.id] = {
        correctIndex: q.correctIndex,
        explanation: q.explanation || "",
        ...(q.starCorrectOrder ? { starCorrectOrder: q.starCorrectOrder } : {}),
        ...(q.audioScript ? { audioScript: q.audioScript } : {}),
      };
    }

    const answerKeyDoc: TestAnswerKeyDoc = {
      testId: test.id,
      passScore: test.passScore,
      totalPoints: test.totalPoints,
      answers,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, "test_answer_keys", test.id), answerKeyDoc, { merge: true });
  }

  const sanitizedTest: JLPTTestDoc = {
    ...test,
    questions: (test.questions || []).map((q) => {
      const { starCorrectOrder: _star, audioScript: _script, ...rest } = q;
      void _star;
      void _script;
      return {
        ...rest,
        correctIndex: -1,
        explanation: "",
      };
    }),
  };

  await setDoc(doc(db, "tests", test.id), sanitizedTest, { merge: true });
}

export async function duplicateTestDoc(sourceTestId: string, copy: JLPTTestDoc): Promise<void> {
  const sourceKey = await getTestAnswerKey(sourceTestId);
  await setDoc(doc(db, "tests", copy.id), copy, { merge: true });

  if (sourceKey) {
    await setDoc(doc(db, "test_answer_keys", copy.id), {
      ...sourceKey,
      testId: copy.id,
      updatedAt: new Date().toISOString(),
    });
  }
}

export async function deleteTestDoc(testId: string): Promise<void> {
  await Promise.all([
    deleteDoc(doc(db, "tests", testId)),
    deleteDoc(doc(db, "test_answer_keys", testId)).catch(() => undefined),
  ]);
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
  const q = query(ref, where("testId", "==", testId), limit(300));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as TestSubmissionDoc);
}

export async function getSubmissionsByStudent(studentId: string): Promise<TestSubmissionDoc[]> {
  const ref = collection(db, "test_submissions");
  const q = query(ref, where("studentId", "==", studentId), limit(200));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as TestSubmissionDoc);
}

export async function getAllSubmissions(): Promise<TestSubmissionDoc[]> {
  const ref = collection(db, "test_submissions");
  const snap = await getDocs(query(ref, limit(500)));
  return snap.docs.map((d) => d.data() as TestSubmissionDoc);
}

/* =====================================================================
 * ANNOUNCEMENTS SERVICE
 * ===================================================================== */
export async function getAnnouncements(classId?: string): Promise<AnnouncementDoc[]> {
  const ref = collection(db, "announcements");
  const q =
    classId && classId !== "ALL"
      ? query(ref, where("classId", "in", [classId, "ALL"]), limit(60))
      : query(ref, limit(100));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => d.data() as AnnouncementDoc)
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
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
  const snap = await getDocs(query(ref, limit(300)));
  return snap.docs
    .map((d) => d.data() as LeadDoc)
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

/* =====================================================================
 * MATERIALS SERVICE
 * ===================================================================== */
export async function getMaterials(classId?: string): Promise<MaterialDoc[]> {
  const ref = collection(db, "materials");
  const q =
    classId && classId !== "ALL"
      ? query(ref, where("classId", "in", [classId, "ALL"]), limit(100))
      : query(ref, limit(200));
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => d.data() as MaterialDoc)
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
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
  const sizeKb = file.size / 1024;
  const sizeFormatted = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${Math.round(sizeKb)} KB`;

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
 * ASSIGNMENTS SERVICE (`assignments` + `submissions` subcollection)
 * ===================================================================== */
export async function getAssignments(
  classId?: string,
  studentUidForScope?: string
): Promise<AssignmentDoc[]> {
  const colRef = collection(db, "assignments");
  const q =
    classId && classId !== "ALL"
      ? query(colRef, where("classId", "in", [classId, "ALL"]), limit(100))
      : query(colRef, limit(150));

  const snap = await getDocs(q);
  const rawList = snap.docs.map((d) => ({ id: d.id, ...d.data() } as AssignmentDoc));

  // Hydrate subcollection `assignments/{asgId}/submissions` and merge with legacy map
  const hydrated = await Promise.all(
    rawList.map(async (asg) => {
      const mergedSubmissions: Record<string, AssignmentSubmissionInfo> = {
        ...(asg.submissions || {}),
      };

      try {
        if (studentUidForScope) {
          const subSnap = await getDoc(doc(db, "assignments", asg.id, "submissions", studentUidForScope));
          if (subSnap.exists()) {
            mergedSubmissions[studentUidForScope] = subSnap.data() as AssignmentSubmissionInfo;
          }
        } else {
          const subsSnap = await getDocs(collection(db, "assignments", asg.id, "submissions"));
          for (const sDoc of subsSnap.docs) {
            mergedSubmissions[sDoc.id] = sDoc.data() as AssignmentSubmissionInfo;
          }
        }
      } catch {
        // Gracefully keep legacy map if subcollection read is unavailable
      }

      return {
        ...asg,
        submissions: mergedSubmissions,
      };
    })
  );

  return hydrated.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

export async function saveAssignment(assignment: AssignmentDoc): Promise<void> {
  const ref = doc(db, "assignments", assignment.id);
  await setDoc(ref, assignment, { merge: true });
}

export async function deleteAssignment(id: string): Promise<void> {
  const ref = doc(db, "assignments", id);
  await deleteDoc(ref);
}

/**
 * Writes student assignment submission to scalable subcollection
 * `assignments/{assignmentId}/submissions/{studentId}` (avoids 1MB doc limit).
 */
export async function submitAssignmentAnswer(
  assignmentId: string,
  studentId: string,
  submission: Partial<AssignmentSubmissionInfo>
): Promise<void> {
  const subRef = doc(db, "assignments", assignmentId, "submissions", studentId);
  await setDoc(
    subRef,
    {
      studentAnswer: submission.studentAnswer || "",
      studentName: submission.studentName || "",
      studentCode: submission.studentCode || "",
      status: "submitted",
      submittedAt: submission.submittedAt || new Date().toISOString(),
    },
    { merge: true }
  );
}

export async function gradeAssignmentSubmission(
  assignmentId: string,
  studentId: string,
  grading: Partial<AssignmentSubmissionInfo>
): Promise<void> {
  const subRef = doc(db, "assignments", assignmentId, "submissions", studentId);
  await setDoc(
    subRef,
    {
      score: grading.score,
      maxScore: grading.maxScore,
      feedback: grading.feedback,
      status: "graded",
      gradedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}
