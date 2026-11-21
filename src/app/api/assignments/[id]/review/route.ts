import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb, isFirebaseAdminConfigured } from "@/lib/firebase-admin";
import type { AssignmentDoc, AssignmentSubmissionInfo } from "@/lib/db/schema";

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

    const { id: assignmentId } = await context.params;
    if (!assignmentId) {
      return NextResponse.json({ error: "Missing assignmentId." }, { status: 400 });
    }

    const [userSnap, asgSnap, keySnap, subSnap] = await Promise.all([
      adminDb.collection("users").doc(uid).get(),
      adminDb.collection("assignments").doc(assignmentId).get(),
      adminDb.collection("assignment_answer_keys").doc(assignmentId).get(),
      adminDb.collection("assignments").doc(assignmentId).collection("submissions").doc(uid).get(),
    ]);

    if (!asgSnap.exists) {
      return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
    }

    const role = userSnap.exists ? (userSnap.data()?.role as string | undefined) : "guest";
    const isTeacher = role === "sensei" || role === "admin";
    const asgDoc = asgSnap.data() as AssignmentDoc;

    const submission: AssignmentSubmissionInfo | null = subSnap.exists
      ? (subSnap.data() as AssignmentSubmissionInfo)
      : asgDoc.submissions?.[uid] || null;

    // Students can ONLY view the answer key AFTER submitting
    if (!isTeacher && !submission) {
      return NextResponse.json(
        { error: "Bạn cần nộp bài tập trước khi xem lại đáp án." },
        { status: 403 }
      );
    }

    const answerKey: Record<string, number> = {};
    if (keySnap.exists) {
      const keyData = keySnap.data() as { answers?: Record<string, { correctIndex: number }> };
      for (const [qId, entry] of Object.entries(keyData.answers || {})) {
        answerKey[qId] = entry.correctIndex;
      }
    } else {
      for (const q of asgDoc.questions || []) {
        answerKey[q.id] = q.correctIndex;
      }
    }

    return NextResponse.json({
      submission,
      answerKey,
    });
  } catch (err) {
    console.error("[api/assignments/review] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected server error." },
      { status: 500 }
    );
  }
}
