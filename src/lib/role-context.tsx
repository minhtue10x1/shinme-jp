"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type RoleId = "student" | "sensei" | "admin";

export type RoleUser = {
  id: string;
  code: string;
  role: RoleId;
  name: string;
  nameJa?: string;
  avatarText: string;
  tagline: string;
  className?: string;
};

export const ROLES: Record<RoleId, RoleUser> = {
  student: {
    id: "hv-202601",
    code: "HV-202601",
    role: "student",
    name: "Lê Hoàng Nam",
    nameJa: "レ・ホアン・ナム",
    avatarText: "Nam",
    tagline: "Học viên · Lớp Sơ cấp N4-K12",
    className: "N4-K12 (Tối 2-4-6)",
  },
  sensei: {
    id: "ss-tanaka",
    code: "SS-TANAKA",
    role: "sensei",
    name: "Tanaka Yuki",
    nameJa: "田中[たなか] 由紀[ゆき]",
    avatarText: "田",
    tagline: "Sensei · Trưởng bộ môn Kaiwa",
    className: "Phụ trách: N4-K12, Kaiwa-K15",
  },
  admin: {
    id: "adm-shinme",
    code: "ADMIN-01",
    role: "admin",
    name: "Nguyễn Thu Hà (Admin)",
    avatarText: "Ad",
    tagline: "Quản trị viên & Giáo vụ trung tâm",
  },
};

type RoleContextValue = {
  role: RoleId;
  user: RoleUser;
  setRole: (role: RoleId) => void;
};

const RoleContext = createContext<RoleContextValue | null>(null);

const STORAGE_KEY = "shinme:demo-role";

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<RoleId>("student");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) as RoleId | null;
      if (saved && (saved === "student" || saved === "sensei" || saved === "admin")) {
        setRoleState(saved);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setRole = (next: RoleId) => {
    setRoleState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  };

  const user = ROLES[role];
  const value = useMemo(() => ({ role, user, setRole }), [role, user]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used inside <RoleProvider>");
  return ctx;
}

