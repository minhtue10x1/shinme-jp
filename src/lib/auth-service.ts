import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { UserProfileDoc } from "@/lib/db/schema";
import type { RoleId } from "@/lib/role-context";

const googleProvider = new GoogleAuthProvider();

export type GoogleLoginCheckResult =
  | { status: "EXISTING_USER"; user: User; profile: UserProfileDoc }
  | { status: "NEW_USER_NEEDS_CONFIRMATION"; user: User; email: string; displayName: string; photoURL?: string };

/**
 * Bước 1: Mở popup Google Auth và kiểm tra xem Gmail này đã có tài khoản trong hệ thống chưa
 */
export async function checkOrLoginWithGoogle(): Promise<GoogleLoginCheckResult> {
  const result = await signInWithPopup(auth, googleProvider);
  const user = result.user;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return {
      status: "EXISTING_USER",
      user,
      profile: userSnap.data() as UserProfileDoc,
    };
  }

  // Gmail này chưa từng có trong hệ thống -> Yêu cầu xác nhận tạo mới
  return {
    status: "NEW_USER_NEEDS_CONFIRMATION",
    user,
    email: user.email || "",
    displayName: user.displayName || "",
    photoURL: user.photoURL || undefined,
  };
}

/**
 * Bước 2: Khi người dùng bấm "Đồng ý tạo tài khoản mới bằng Gmail này"
 */
export async function completeGoogleRegistration(
  user: User,
  fullName: string,
  targetJLPT: "N5" | "N4" | "N3" | "N2" | "N1" | "KAIWA" = "N3"
): Promise<UserProfileDoc> {
  const shortCode = `KH-${Date.now().toString(36).slice(-4).toUpperCase()}`;
  const profile: UserProfileDoc = {
    uid: user.uid,
    email: user.email || "",
    role: "guest",
    code: shortCode,
    fullName: fullName.trim() || user.displayName || "Thành viên Shinme",
    avatarText: (fullName.trim() || user.displayName || "KH").slice(0, 2).toUpperCase(),
    avatarUrl: user.photoURL || undefined,
    targetJLPT,
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, "users", user.uid), profile);
  return profile;
}

/**
 * Hủy tạo tài khoản mới -> Đăng xuất phiên Google để giữ hệ thống sạch sẽ
 */
export async function cancelGoogleRegistration(): Promise<void> {
  await signOut(auth);
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
      role: "guest",
      code: `KH-${user.uid.slice(0, 4).toUpperCase()}`,
      fullName: email.split("@")[0],
      avatarText: email.slice(0, 2).toUpperCase(),
      createdAt: new Date().toISOString(),
    };
    await setDoc(userRef, profile);
  }

  return { user, profile };
}

/**
 * Đăng ký tài khoản mới bằng Email & Mật khẩu (Mặc định cấp vai trò Khách để Admin phân lớp)
 */
export async function registerWithEmail(
  email: string,
  pass: string,
  fullName: string,
  role: RoleId = "guest"
): Promise<{ user: User; profile: UserProfileDoc }> {
  const res = await createUserWithEmailAndPassword(auth, email, pass);
  const user = res.user;

  const codePrefix = role === "sensei" ? "SS" : role === "student" ? "HV" : role === "admin" ? "AD" : "KH";
  const profile: UserProfileDoc = {
    uid: user.uid,
    email: user.email || email,
    role,
    code: `${codePrefix}-${Date.now().toString(36).slice(-4).toUpperCase()}`,
    fullName,
    avatarText: fullName.slice(0, 2).toUpperCase(),
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
