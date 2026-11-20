import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let adminApp: App | null = null;
let lastInitError: string | null = null;

function normalizePrivateKey(raw: string): string {
  let key = raw.trim();
  // Strip accidental surrounding quotes from .env or Vercel UI paste
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }
  return key.replace(/\\n/g, "\n").replace(/\r\n/g, "\n");
}

function resolveServiceAccount(): {
  projectId: string;
  clientEmail: string;
  privateKey: string;
} | null {
  const jsonRaw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY?.trim();
  if (jsonRaw) {
    try {
      const cleaned =
        (jsonRaw.startsWith("'") && jsonRaw.endsWith("'")) ||
        (jsonRaw.startsWith('"') && jsonRaw.endsWith('"') && !jsonRaw.startsWith('{"'))
          ? jsonRaw.slice(1, -1)
          : jsonRaw;
      const parsed = JSON.parse(cleaned);
      if (parsed.project_id && parsed.client_email && parsed.private_key) {
        return {
          projectId: String(parsed.project_id).trim(),
          clientEmail: String(parsed.client_email).trim(),
          privateKey: normalizePrivateKey(String(parsed.private_key)),
        };
      }
    } catch (err) {
      lastInitError = `Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON: ${err instanceof Error ? err.message : String(err)}`;
      console.error("[firebase-admin]", lastInitError);
    }
  }

  const projectId = (process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "").trim();
  const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || "").trim();
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY || "";

  if (projectId && clientEmail && privateKeyRaw) {
    return {
      projectId,
      clientEmail,
      privateKey: normalizePrivateKey(privateKeyRaw),
    };
  }

  return null;
}

export function isFirebaseAdminConfigured(): boolean {
  return resolveServiceAccount() !== null;
}

export function getAdminInitError(): string | null {
  return lastInitError;
}

function getAdminApp(): App | null {
  if (adminApp) return adminApp;
  const existing = getApps();
  if (existing.length > 0) {
    adminApp = existing[0];
    return adminApp;
  }

  const serviceAccount = resolveServiceAccount();
  if (!serviceAccount) {
    return null;
  }

  try {
    adminApp = initializeApp({
      credential: cert(serviceAccount),
    });
    lastInitError = null;
    return adminApp;
  } catch (err) {
    lastInitError = err instanceof Error ? err.message : String(err);
    console.error("[firebase-admin] initializeApp failed:", lastInitError);
    return null;
  }
}

export function getAdminAuth(): Auth | null {
  const app = getAdminApp();
  return app ? getAuth(app) : null;
}

export function getAdminDb(): Firestore | null {
  const app = getAdminApp();
  return app ? getFirestore(app) : null;
}
