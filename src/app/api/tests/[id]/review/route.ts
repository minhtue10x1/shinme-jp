import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb, isFirebaseAdminConfigured } from "@/lib/firebase-admin";
import type { JLPTTestDoc, TestAnswerKeyDoc, TestAnswerKeyEntry, TestSubmissionDoc } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json(
        { error: "Firebase Admin is not configured.", code: "ADMIN_NOT_CONFIGURED" },
        { status: 503 }
      );
    }

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: "Firebase Admin unavailable." }, { status: 503 });
    }

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
      return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
    }

    const { id: testId } = await context.params;
    if (!testId) {
      return NextResponse.json({ error: "Missing testId." }, { status: 400 });
    }

    const [userSnap, testSnap, keySnap, subsSnap] = await Promise.all([
      adminDb.collection("users").doc(uid).get(),
      adminDb.collection("tests").doc(testId).get(),
      adminDb.collection("test_answer_keys").doc(testId).get(),
      adminDb
        .collection("test_submissions")
        .where("testId", "==", testId)
        .where("studentId", "==", uid)
        .get(),
    ]);

    if (!testSnap.exists) {
      return NextResponse.json({ error: "Test not found." }, { status: 404 });
    }

    const role = userSnap.exists ? (userSnap.data()?.role as string | undefined) : "guest";
    const isTeacher = role === "sensei" || role === "admin";

    const submissions = subsSnap.docs
      .map((d) => d.data() as TestSubmissionDoc)
      .sort((a, b) => (b.submittedAt || "").localeCompare(a.submittedAt || ""));

    const latestSubmission = submissions[0] || null;

    // Students can ONLY view the answer key AFTER they have submitted at least one attempt
    if (!isTeacher && !latestSubmission) {
      return NextResponse.json(
        { error: "Bạn cần hoàn thành và nộp bài thi trước khi xem lại đáp án." },
        { status: 403 }
      );
    }

    const testDoc = testSnap.data() as JLPTTestDoc;
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

    let correctCount = 0;
    if (latestSubmission) {
      for (const q of testDoc.questions || []) {
        if (latestSubmission.answers?.[q.id] === answerKeyMap[q.id]?.correctIndex) {
          correctCount += 1;
        }
      }
    }

    return NextResponse.json({
      submission: latestSubmission,
      correctCount,
      answerKey: answerKeyMap,
    });
  } catch (err) {
    console.error("[api/tests/review] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected server error." },
      { status: 500 }
    );
  }
}
