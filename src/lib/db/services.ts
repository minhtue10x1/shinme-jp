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
import { db } from "@/lib/firebase";
import type {
  UserProfileDoc,
  ClassDoc,
  JLPTTestDoc,
  TestSubmissionDoc,
  AnnouncementDoc,
  LeadDoc,
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

/* =====================================================================
 * TESTS & EXAMS SERVICE
 * ===================================================================== */
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

