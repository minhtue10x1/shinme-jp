import { NextResponse } from "next/server";
import { getAdminDb, isFirebaseAdminConfigured } from "@/lib/firebase-admin";
import type { LeadDoc } from "@/lib/db/schema";

export const runtime = "nodejs";

// Lightweight sliding-window IP rate limiter (per serverless instance)
const RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 5;
const ipHits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (ipHits.get(ip) || []).filter((ts) => now - ts < RATE_WINDOW_MS);
  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    ipHits.set(ip, timestamps);
    return true;
  }
  timestamps.push(now);
  ipHits.set(ip, timestamps);
  return false;
}

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please try again in a few minutes.", code: "RATE_LIMITED" },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  // Honeypot anti-bot field: bots fill hidden `website` field, humans leave it blank
  if (typeof body.website === "string" && body.website.trim().length > 0) {
    // Pretend success so bots don't retry
    return NextResponse.json({ ok: true, id: `lead-ignored-${Date.now()}` });
  }

  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const currentLevel = typeof body.currentLevel === "string" ? body.currentLevel.trim() : "";
  const targetGoal = typeof body.targetGoal === "string" ? body.targetGoal.trim() : "";
  const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 1000) : "";

  if (fullName.length < 2 || fullName.length > 100) {
    return NextResponse.json({ error: "Invalid full name." }, { status: 400 });
  }
  if (phone.length < 8 || phone.length > 30) {
    return NextResponse.json({ error: "Invalid phone number." }, { status: 400 });
  }

  const lead: LeadDoc = {
    id: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    fullName,
    phone,
    ...(email ? { email: email.slice(0, 120) } : {}),
    currentLevel: currentLevel.slice(0, 60) || "Chưa xác định",
    targetGoal: targetGoal.slice(0, 100) || "Tư vấn lộ trình",
    status: "Chưa liên hệ",
    ...(notes ? { notes } : {}),
    createdAt: new Date().toISOString(),
  };

  if (!isFirebaseAdminConfigured()) {
    return NextResponse.json(
      { error: "Server storage not configured.", code: "ADMIN_NOT_CONFIGURED" },
      { status: 503 }
    );
  }

  const adminDb = getAdminDb();
  if (!adminDb) {
    return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  }

  await adminDb.collection("leads").doc(lead.id).set(lead);
  return NextResponse.json({ ok: true, id: lead.id });
}
