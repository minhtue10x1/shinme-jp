import { NextResponse } from "next/server";
import {
  getAdminAuth,
  getAdminDb,
  getAdminStorage,
  getAdminStorageBucketName,
  isFirebaseAdminConfigured,
} from "@/lib/firebase-admin";
import type { MaterialDoc } from "@/lib/db/schema";

export const runtime = "nodejs";

const SIGNED_URL_TTL_MS = 10 * 60 * 1000; // 10 minutes

function extractStoragePathFromFirebaseUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "firebasestorage.googleapis.com") return null;
    const marker = "/o/";
    const idx = parsed.pathname.indexOf(marker);
    if (idx === -1) return null;
    const encodedPath = parsed.pathname.slice(idx + marker.length);
    return encodedPath ? decodeURIComponent(encodedPath) : null;
  } catch {
    return null;
  }
}

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
    const adminStorage = getAdminStorage();
    if (!adminAuth || !adminDb || !adminStorage) {
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

    const { id: materialId } = await context.params;
    if (!materialId) {
      return NextResponse.json({ error: "Missing materialId." }, { status: 400 });
    }

    const [userSnap, materialSnap] = await Promise.all([
      adminDb.collection("users").doc(uid).get(),
      adminDb.collection("materials").doc(materialId).get(),
    ]);

    if (!materialSnap.exists) {
      return NextResponse.json({ error: "Material not found." }, { status: 404 });
    }

    const userData = userSnap.exists ? userSnap.data() : undefined;
    const role = (userData?.role as string | undefined) || "guest";
    const userClassId = (userData?.classId as string | undefined) || "";
    const material = materialSnap.data() as MaterialDoc;

    const isTeacherOrAdmin = role === "sensei" || role === "admin";
    const isAllowedStudent =
      role === "student" &&
      (material.classId === "ALL" || (!!userClassId && material.classId === userClassId));

    if (!isTeacherOrAdmin && !isAllowedStudent) {
      return NextResponse.json(
        { error: "Bạn không có quyền truy cập tài liệu của lớp học này." },
        { status: 403 }
      );
    }

    const storagePath =
      material.storagePath ||
      (material.fileUrl ? extractStoragePathFromFirebaseUrl(material.fileUrl) : null);

    // External link (Google Drive / OneDrive / YouTube)
    if (!storagePath) {
      if (material.fileUrl && /^https?:\/\//i.test(material.fileUrl)) {
        return NextResponse.json({
          url: material.fileUrl,
          external: true,
        });
      }
      return NextResponse.json({ error: "Material file path is missing." }, { status: 404 });
    }

    const bucketName = getAdminStorageBucketName();
    const bucket = bucketName ? adminStorage.bucket(bucketName) : adminStorage.bucket();
    const file = bucket.file(storagePath);

    const safeFileName = (material.fileName || "material").replace(/[\r\n"]/g, "_");
    const [signedUrl] = await file.getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + SIGNED_URL_TTL_MS,
      responseDisposition: `inline; filename*=UTF-8''${encodeURIComponent(safeFileName)}`,
    });

    return NextResponse.json({
      url: signedUrl,
      expiresInSeconds: Math.floor(SIGNED_URL_TTL_MS / 1000),
    });
  } catch (err) {
    console.error("[api/materials/download] Error:", err);
    return NextResponse.json(
      { error: "Failed to generate temporary download link." },
      { status: 500 }
    );
  }
}
