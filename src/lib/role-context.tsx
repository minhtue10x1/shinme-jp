"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "sonner";
import { auth, db } from "@/lib/firebase";
import { logoutUser } from "@/lib/auth-service";
import { isSessionExpired, touchSession, setupSessionActivityListeners } from "@/lib/session-manager";
import type { UserProfileDoc } from "@/lib/db/schema";

export type RoleId = "guest" | "student" | "sensei" | "admin";

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
  guest: {
    id: "kh-guest",
    code: "KH-GUEST",
    role: "guest",
    name: "Khách Shinme",
    avatarText: "KH",
    tagline: "Thành viên mới · Chưa xếp lớp",
    className: "Chưa vào lớp học nào",
    email: "guest@shinme.edu.vn",
  },
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

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<RoleId>("guest");
  const [customUser, setCustomUser] = useState<RoleUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Lắng nghe trạng thái đăng nhập Firebase Auth & Kiểm tra chính sách phiên trượt 7 ngày (Rolling Session)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      if (fUser) {
        // Kiểm tra xem đã quá 7 ngày không truy cập hệ thống chưa
        if (isSessionExpired()) {
          console.info("Session expired after 7 days of inactivity. Auto logging out.");
          await logoutUser();
          setFirebaseUser(null);
          setCustomUser(null);
          setRoleState("guest");
          setIsLoadingAuth(false);
          toast.error("Phiên đăng nhập đã hết hạn do bạn không hoạt động trong hơn 7 ngày.", {
            description: "Hệ thống tự động đăng xuất để bảo mật. Vui lòng đăng nhập lại để tiếp tục học tập.",
            duration: 8000,
          });
          return;
        }

        // Gia hạn phiên trượt thêm 7 ngày (Rolling Session)
        touchSession(true);
        setFirebaseUser(fUser);

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
              tagline:
                data.role === "sensei"
                  ? "Giảng viên Shinme"
                  : data.role === "admin"
                    ? "Quản trị viên Shinme"
                    : data.role === "guest"
                      ? "Khách · Chưa vào lớp"
                      : "Học viên Shinme",
              classId: data.classId,
              className: data.className || (data.role === "guest" || !data.classId ? "Chưa vào lớp học nào" : undefined),
              email: data.email,
            });
          }
        } catch (e) {
          console.warn("Could not fetch user profile from Firestore:", e);
        }
      } else {
        setFirebaseUser(null);
        setCustomUser(null);
        setRoleState("guest");
      }
      setIsLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // Lắng nghe tương tác của người dùng để liên tục gia hạn phiên trượt khi còn đang học
  useEffect(() => {
    if (!firebaseUser) return;

    const cleanup = setupSessionActivityListeners(async () => {
      toast.error("Phiên đăng nhập đã hết hạn do bạn không hoạt động trong hơn 7 ngày.", {
        description: "Hệ thống tự động đăng xuất để bảo mật. Vui lòng đăng nhập lại.",
        duration: 8000,
      });
      await logoutUser();
      setFirebaseUser(null);
      setCustomUser(null);
      setRoleState("guest");
    });

    return () => cleanup();
  }, [firebaseUser]);

  const setRole = (next: RoleId) => {
    setRoleState(next);
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
      tagline:
        profile.role === "sensei"
          ? "Giảng viên Shinme"
          : profile.role === "admin"
            ? "Quản trị viên Shinme"
            : profile.role === "guest"
              ? "Khách · Chưa vào lớp"
              : "Học viên Shinme",
      classId: profile.classId,
      className: profile.className || (profile.role === "guest" || !profile.classId ? "Chưa vào lớp học nào" : undefined),
      email: profile.email,
    });
  };

  const logout = async () => {
    await logoutUser();
    setFirebaseUser(null);
    setCustomUser(null);
    setRole("guest");
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
