import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb, getAdminInitError, isFirebaseAdminConfigured } from "@/lib/firebase-admin";
import type { AssignmentDoc, AssignmentSubmissionInfo } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    if (!isFirebaseAdminConfigured()) {
      return NextResponse.json(
        {
          error: getAdminInitError() || "Firebase Admin is not configured.",
          code: "ADMIN_NOT_CONFIGURED",
        },
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
      return NextResponse.json({ error: "Guest accounts cannot submit assignments." }, { status: 403 });
    }

    const { id: assignmentId } = await context.params;
    if (!assignmentId) {
      return NextResponse.json({ error: "Missing assignmentId." }, { status: 400 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      answers?: Record<string, number>;
    };
    const rawAnswers = body.answers && typeof body.answers === "object" ? body.answers : {};

    const [asgSnap, keySnap] = await Promise.all([
      adminDb.collection("assignments").doc(assignmentId).get(),
      adminDb.collection("assignment_answer_keys").doc(assignmentId).get(),
    ]);

    if (!asgSnap.exists) {
      return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
    }

    const asgDoc = asgSnap.data() as AssignmentDoc;
    if (role === "student" && asgDoc.classId !== "ALL" && asgDoc.classId !== userData.classId) {
      return NextResponse.json({ error: "You do not have access to this class assignment." }, { status: 403 });
    }

    const questions = Array.isArray(asgDoc.questions) ? asgDoc.questions : [];
    if (questions.length === 0) {
      return NextResponse.json({ error: "This assignment does not have quiz questions." }, { status: 400 });
    }

    const answerKeyMap: Record<string, number> = {};
    if (keySnap.exists) {
      const keyData = keySnap.data() as { answers?: Record<string, { correctIndex: number }> };
      for (const [qId, entry] of Object.entries(keyData.answers || {})) {
        answerKeyMap[qId] = entry.correctIndex;
      }
    } else {
      for (const q of questions) {
        answerKeyMap[q.id] = q.correctIndex;
      }
    }

    // 1 point per question strictly
    let score = 0;
    const sanitizedAnswers: Record<string, number> = {};
    for (const q of questions) {
      const chosen = rawAnswers[q.id];
      if (typeof chosen === "number" && Number.isInteger(chosen) && chosen >= 0 && chosen <= 3) {
        sanitizedAnswers[q.id] = chosen;
        if (answerKeyMap[q.id] === chosen) {
          score += 1;
        }
      }
    }

    const maxScore = questions.length;
    const nowIso = new Date().toISOString();
    const submission: AssignmentSubmissionInfo = {
      studentName: userData.fullName || "Học viên",
      studentCode: userData.code || "HV",
      answers: sanitizedAnswers,
      score,
      maxScore,
      status: "graded",
      submittedAt: nowIso,
      gradedAt: nowIso,
      studentAnswer: `Trắc nghiệm tự động: ${score}/${maxScore} câu đúng`,
    };

    await adminDb
      .collection("assignments")
      .doc(assignmentId)
      .collection("submissions")
      .doc(uid)
      .set(submission, { merge: true });

    return NextResponse.json({
      submission,
      answerKey: answerKeyMap,
    });
  } catch (err) {
    console.error("[api/assignments/submit] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected server error." },
      { status: 500 }
    );
  }
}
