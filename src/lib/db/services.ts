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
import type {
  UserProfileDoc,
  ClassDoc,
  JLPTTestDoc,
  TestSubmissionDoc,
  AnnouncementDoc,
  LeadDoc,
  MaterialDoc,
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
  className: string
): Promise<void> {
  const ref = doc(db, "users", uid);
  await updateDoc(ref, {
    classId,
    className,
    updatedAt: new Date().toISOString(),
  });
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

