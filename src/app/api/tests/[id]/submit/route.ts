import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb, getAdminInitError, isFirebaseAdminConfigured } from "@/lib/firebase-admin";
import type { JLPTTestDoc, TestAnswerKeyDoc, TestAnswerKeyEntry, TestSubmissionDoc } from "@/lib/db/schema";

export const runtime = "nodejs";

type SubmitPayload = {
  answers?: Record<string, number>;
  durationSeconds?: number;
  studentCode?: string;
  studentName?: string;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json(
        {
          error: getAdminInitError() || "Server-side grading is not configured yet (missing Firebase Admin env vars).",
          code: "ADMIN_NOT_CONFIGURED",
        },
        { status: 503 }
      );
    }

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    if (!adminAuth || !adminDb) {
      return NextResponse.json(
        {
          error: getAdminInitError() || "Firebase Admin initialization failed (check FIREBASE_PRIVATE_KEY format).",
          code: "ADMIN_INIT_FAILED",
        },
        { status: 503 }
      );
    }

  // 1. Verify Bearer ID token
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    return NextResponse.json({ error: "Missing Authorization token." }, { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Invalid or expired authentication token." }, { status: 401 });
  }

  // 2. Verify user role & class access
  const userSnap = await adminDb.collection("users").doc(uid).get();
  if (!userSnap.exists) {
    return NextResponse.json({ error: "User profile not found." }, { status: 403 });
  }
  const userData = userSnap.data() as {
    role?: string;
    classId?: string;
    code?: string;
    fullName?: string;
  };
  const role = userData.role || "guest";
  if (!["student", "sensei", "admin"].includes(role)) {
    return NextResponse.json({ error: "Guest accounts cannot submit exams." }, { status: 403 });
  }

  const { id: testId } = await context.params;
  if (!testId) {
    return NextResponse.json({ error: "Missing testId." }, { status: 400 });
  }

  let body: SubmitPayload;
  try {
    body = (await request.json()) as SubmitPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const answers = body.answers && typeof body.answers === "object" ? body.answers : {};
  const durationSeconds = Math.max(0, Math.min(24 * 3600, Math.floor(Number(body.durationSeconds) || 0)));

  // 3. Load test & answer key from Firestore (Admin SDK bypasses client rules)
  const [testSnap, keySnap] = await Promise.all([
    adminDb.collection("tests").doc(testId).get(),
    adminDb.collection("test_answer_keys").doc(testId).get(),
  ]);

  if (!testSnap.exists) {
    return NextResponse.json({ error: "Test not found." }, { status: 404 });
  }

  const testDoc = testSnap.data() as JLPTTestDoc;

  // Enforce class-level access for students
  if (
    role === "student" &&
    testDoc.classId !== "ALL" &&
    testDoc.classId !== userData.classId
  ) {
    return NextResponse.json({ error: "You do not have access to this class exam." }, { status: 403 });
  }

  // Resolve answer key: prefer `test_answer_keys/{testId}`, fallback to legacy inline questions
  const answerKeyMap: Record<string, TestAnswerKeyEntry> = {};
  if (keySnap.exists) {
    const keyDoc = keySnap.data() as TestAnswerKeyDoc;
    Object.assign(answerKeyMap, keyDoc.answers || {});
  } else {
    for (const q of testDoc.questions || []) {
      answerKeyMap[q.id] = {
        correctIndex: q.correctIndex,
        explanation: q.explanation || "",
        ...(q.starCorrectOrder ? { starCorrectOrder: q.starCorrectOrder } : {}),
        ...(q.audioScript ? { audioScript: q.audioScript } : {}),
      };
    }
  }

  // 4. Grade strictly on the server
  let score = 0;
  let totalPoints = 0;
  let correctCount = 0;
  const sanitizedAnswers: Record<string, number> = {};

  for (const q of testDoc.questions || []) {
    const pts = Number(q.points) || 0;
    totalPoints += pts;

    const chosen = answers[q.id];
    if (typeof chosen === "number" && Number.isInteger(chosen) && chosen >= 0 && chosen <= 3) {
      sanitizedAnswers[q.id] = chosen;
      const key = answerKeyMap[q.id];
      if (key && chosen === key.correctIndex) {
        score += pts;
        correctCount += 1;
      }
    }
  }

  const passed = score >= (Number(testDoc.passScore) || 0);
  const subId = `sub-${testId}-${uid}-${Date.now()}`;

  const submission: TestSubmissionDoc = {
    id: subId,
    testId,
    studentId: uid,
    studentCode: userData.code || body.studentCode || "HV",
    studentName: userData.fullName || body.studentName || "Học viên",
    score,
    totalPoints,
    passed,
    durationSeconds,
    answers: sanitizedAnswers,
    submittedAt: new Date().toISOString(),
  };

  await adminDb.collection("test_submissions").doc(subId).set(submission);

  return NextResponse.json({
    submission,
    correctCount,
    answerKey: answerKeyMap,
  });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected server error";
    console.error("[api/tests/submit] Unhandled error:", err);
    return NextResponse.json({ error: message, code: "SERVER_ERROR" }, { status: 500 });
  }
}
