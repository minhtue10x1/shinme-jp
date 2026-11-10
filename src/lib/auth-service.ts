import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { UserProfileDoc } from "@/lib/db/schema";
import type { RoleId } from "@/lib/role-context";

const googleProvider = new GoogleAuthProvider();

/**
 * Đăng nhập 1-chạm qua Google (Gmail OAuth2)
 * Tự động tạo hồ sơ học viên trên Firestore nếu là tài khoản mới lần đầu đăng nhập.
 */
export async function loginWithGoogle(): Promise<{ user: User; profile: UserProfileDoc }> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  // Lấy hoặc tạo hồ sơ trong Firestore
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  let profile: UserProfileDoc;

  if (userSnap.exists()) {
    profile = userSnap.data() as UserProfileDoc;
  } else {
    // Tài khoản mới đăng nhập lần đầu -> Mặc định gán vai trò Student
    const shortCode = `HV-${Date.now().toString(36).slice(-4).toUpperCase()}`;
    profile = {
      uid: user.uid,
      email: user.email || "",
      role: "student",
      code: shortCode,
      fullName: user.displayName || "Học viên Shinme",
      avatarText: (user.displayName || "H").slice(0, 2),
      avatarUrl: user.photoURL || undefined,
      classId: "cls-n3-246",
      className: "N3-Tối 246 (Sensei Tanaka)",
      targetJLPT: "N3",
      createdAt: new Date().toISOString(),
    };
    await setDoc(userRef, profile);
  }

  return { user, profile };
}

/**
 * Đăng nhập bằng Email & Mật khẩu
 */
export async function loginWithEmail(email: string, pass: string): Promise<{ user: User; profile: UserProfileDoc }> {
  const res = await signInWithEmailAndPassword(auth, email, pass);
  const user = res.user;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  let profile: UserProfileDoc;
  if (userSnap.exists()) {
    profile = userSnap.data() as UserProfileDoc;
  } else {
    profile = {
      uid: user.uid,
      email: user.email || email,
      role: "student",
      code: `HV-${user.uid.slice(0, 4).toUpperCase()}`,
      fullName: email.split("@")[0],
      avatarText: email.slice(0, 2).toUpperCase(),
      createdAt: new Date().toISOString(),
    };
    await setDoc(userRef, profile);
  }

  return { user, profile };
}

/**
 * Đăng ký tài khoản mới bằng Email & Mật khẩu
 */
export async function registerWithEmail(
  email: string,
  pass: string,
  fullName: string,
  role: RoleId = "student"
): Promise<{ user: User; profile: UserProfileDoc }> {
  const res = await createUserWithEmailAndPassword(auth, email, pass);
  const user = res.user;

  const profile: UserProfileDoc = {
    uid: user.uid,
    email: user.email || email,
    role,
    code: role === "sensei" ? `SS-${Date.now().toString(36).slice(-4).toUpperCase()}` : `HV-${Date.now().toString(36).slice(-4).toUpperCase()}`,
    fullName,
    avatarText: fullName.slice(0, 2).toUpperCase(),
    classId: "cls-n3-246",
    className: "N3-Tối 246 (Sensei Tanaka)",
    targetJLPT: "N3",
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, "users", user.uid), profile);
  return { user, profile };
}

/**
 * Đăng xuất
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}
