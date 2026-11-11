"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { logoutUser } from "@/lib/auth-service";
import type { UserProfileDoc } from "@/lib/db/schema";

export type RoleId = "student" | "sensei" | "admin";

export type RoleUser = {
  id: string;
  code: string;
  role: RoleId;
  name: string;
  nameJa?: string;
  avatarText: string;
  avatarUrl?: string;
  tagline: string;
  classId?: string;
  className?: string;
  email?: string;
};

export const ROLES: Record<RoleId, RoleUser> = {
  student: {
    id: "hv-202601",
    code: "HV-202601",
    role: "student",
    name: "Lê Hoàng Nam",
    nameJa: "レ・ホアン・ナム",
    avatarText: "Nam",
    tagline: "Học viên · Lớp N3-Tối 246",
    className: "N3-Tối 246 (Sensei Tanaka)",
    email: "nam.le@shinme.edu.vn",
  },
  sensei: {
    id: "ss-tanaka",
    code: "SS-TANAKA",
    role: "sensei",
    name: "Tanaka Yuki",
    nameJa: "田中[たなか] 由紀[ゆき]",
    avatarText: "田",
    tagline: "Sensei · Trưởng bộ môn Kaiwa & Giảng viên N3",
    className: "Phụ trách: N3-Tối 246, Kaiwa Sơ Trung Cấp",
    email: "tanaka.yuki@shinme.edu.vn",
  },
  admin: {
    id: "adm-shinme",
    code: "ADMIN-01",
    role: "admin",
    name: "Nguyễn Thu Hà (Admin)",
    avatarText: "Ad",
    tagline: "Quản trị viên & Giáo vụ trung tâm",
    className: "Toàn bộ 3 lớp học",
    email: "admin@shinme.edu.vn",
  },
};

type RoleContextValue = {
  role: RoleId;
  user: RoleUser;
  firebaseUser: User | null;
  isLoadingAuth: boolean;
  setRole: (role: RoleId) => void;
  setUserProfile: (profile: UserProfileDoc) => void;
  logout: () => Promise<void>;
};

const RoleContext = createContext<RoleContextValue | null>(null);

const STORAGE_KEY = "shinme:demo-role";

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<RoleId>("student");
  const [customUser, setCustomUser] = useState<RoleUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Lắng nghe trạng thái đăng nhập Firebase Auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);
      if (fUser) {
        try {
          const snap = await getDoc(doc(db, "users", fUser.uid));
          if (snap.exists()) {
            const data = snap.data() as UserProfileDoc;
            setRoleState(data.role);
            setCustomUser({
              id: data.uid,
              code: data.code,
              role: data.role,
              name: data.fullName,
              avatarText: data.avatarText || (data.fullName ? data.fullName.slice(0, 2) : "HV"),
              avatarUrl: data.avatarUrl,
              tagline: data.role === "sensei" ? "Giảng viên Shinme" : data.role === "admin" ? "Quản trị viên Shinme" : "Học viên Shinme",
              classId: data.classId || "cls-n3-246",
              className: data.className || "Lớp N3-Tối 246",
              email: data.email,
            });
          }
        } catch (e) {
          console.warn("Could not fetch user profile from Firestore:", e);
        }
      } else {
        // Fallback to local demo role state if not logged in
        try {
          const saved = window.localStorage.getItem(STORAGE_KEY) as RoleId | null;
          if (saved && (saved === "student" || saved === "sensei" || saved === "admin")) {
            setRoleState(saved);
          }
        } catch {
          /* ignore */
        }
      }
      setIsLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  const setRole = (next: RoleId) => {
    setRoleState(next);
    setCustomUser(null);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  };

  const setUserProfile = (profile: UserProfileDoc) => {
    setRoleState(profile.role);
    setCustomUser({
      id: profile.uid,
      code: profile.code,
      role: profile.role,
      name: profile.fullName,
      avatarText: profile.avatarText,
      avatarUrl: profile.avatarUrl,
      tagline: profile.role === "sensei" ? "Giảng viên Shinme" : profile.role === "admin" ? "Quản trị viên Shinme" : "Học viên Shinme",
      classId: profile.classId || "cls-n3-246",
      className: profile.className || "Lớp N3-Tối 246",
      email: profile.email,
    });
  };

  const logout = async () => {
    await logoutUser();
    setFirebaseUser(null);
    setCustomUser(null);
    setRole("student");
  };

  const activeUser = customUser || ROLES[role];

  const value = useMemo(
    () => ({
      role,
      user: activeUser,
      firebaseUser,
      isLoadingAuth,
      setRole,
      setUserProfile,
      logout,
    }),
    [role, activeUser, firebaseUser, isLoadingAuth]
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used inside <RoleProvider>");
  return ctx;
}
