import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let adminApp: App | null = null;

function resolveServiceAccount(): {
  projectId: string;
  clientEmail: string;
  privateKey: string;
} | null {
  const jsonRaw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (jsonRaw) {
    try {
      const parsed = JSON.parse(jsonRaw);
      if (parsed.project_id && parsed.client_email && parsed.private_key) {
        return {
          projectId: parsed.project_id,
          clientEmail: parsed.client_email,
          privateKey: String(parsed.private_key).replace(/\\n/g, "\n"),
        };
      }
    } catch (err) {
      console.error("[firebase-admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:", err);
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey };
  }

  return null;
}

export function isFirebaseAdminConfigured(): boolean {
  return resolveServiceAccount() !== null;
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

  adminApp = initializeApp({
    credential: cert(serviceAccount),
  });
  return adminApp;
}

export function getAdminAuth(): Auth | null {
  const app = getAdminApp();
  return app ? getAuth(app) : null;
}

export function getAdminDb(): Firestore | null {
  const app = getAdminApp();
  return app ? getFirestore(app) : null;
}
