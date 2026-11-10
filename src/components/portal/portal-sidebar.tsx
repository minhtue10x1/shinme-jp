"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  CalendarDays,
  FileCheck2,
  FolderLock,
  GraduationCap,
  Home,
  LayoutDashboard,
  Menu,
  Sparkles,
  UserCheck,
  Users2,
  X,
} from "lucide-react";
import { FuriganaText } from "@/components/furigana-text";
import { ShinmeWordmark } from "@/components/brand/logo";
import { useRole, type RoleId } from "@/lib/role-context";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: RoleId[];
  badge?: string;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/portal", label: "Tổng quan & Lớp học", icon: LayoutDashboard, roles: ["student", "sensei", "admin"] },
  { href: "/portal/profile", label: "Hồ sơ cá nhân", icon: UserCheck, roles: ["student", "sensei", "admin"] },
  { href: "/portal/tests", label: "Khảo thí & Đề thi JLPT", icon: GraduationCap, roles: ["student", "sensei", "admin"] },
  { href: "/portal/gradebook", label: "Sổ điểm & Phân tích", icon: BarChart3, roles: ["sensei", "admin", "student"] },
  { href: "/portal/resources", label: "Tài liệu lớp học", icon: FolderLock, roles: ["student", "sensei", "admin"] },
  { href: "/portal/assignments", label: "Bài tập & Mondai", icon: FileCheck2, roles: ["student", "sensei", "admin"] },
  { href: "/portal/materials", label: "Kho học liệu chung", icon: BookOpen, roles: ["student", "sensei", "admin"] },
  { href: "/portal/classes", label: "Lớp học & Lịch", icon: CalendarDays, roles: ["student", "sensei", "admin"] },
  { href: "/portal/leads", label: "Khách tư vấn (Leads)", icon: Users2, roles: ["admin"] },
];

export function PortalSidebar() {
  const pathname = usePathname();
  const { role, user } = useRole();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, role]);

  const visible = NAV_ITEMS.filter((item) => item.roles.includes(role));

  const roleBadge =
    role === "admin"
      ? { label: "Admin", cls: "bg-shinme-warn-soft text-[#8a5a12]" }
      : role === "sensei"
        ? { label: "Sensei", cls: "bg-shinme-leaf text-shinme-primary" }
        : { label: "Học viên", cls: "bg-shinme-surface/15 text-white" };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-shinme-primary-deep text-white">
      <div className="border-b border-white/10 p-5">
        <Link href="/" className="inline-block">
          <ShinmeWordmark subtitle="Cổng LMS" />
        </Link>

        {/* Current user tile */}
        <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white/5 p-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-shinme-accent font-black text-shinme-primary-deep">
            {user.avatarText}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-black">{user.name}</p>
              <span className={cn("rounded px-1.5 py-px text-[0.65rem] font-black uppercase", roleBadge.cls)}>
                {roleBadge.label}
              </span>
            </div>
            {user.nameJa && (
              <FuriganaText text={user.nameJa} className="block truncate text-xs text-shinme-accent" />
            )}
            <p className="tabular text-xs text-white/55">{user.code}</p>
          </div>
        </div>
      </div>

      <nav aria-label="Menu chức năng LMS" className="flex-1 overflow-y-auto p-4">
        <p className="px-3 text-[0.7rem] font-bold uppercase tracking-wider text-white/40">Chức năng</p>
        <ul className="mt-2 space-y-1">
          {visible.map((item) => {
            const active =
              item.href === "/portal"
                ? pathname === "/portal"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-[background-color,color] duration-150",
                    active
                      ? "bg-shinme-accent text-shinme-primary-deep shadow-sm"
                      : "text-white/75 hover:bg-white/10 hover:text-white",
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-4 space-y-1">
        <Link
          href="/login"
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-shinme-accent transition-colors hover:bg-white/10 hover:text-white"
        >
          <Sparkles className="size-3.5" />
          Đăng nhập tài khoản thật
        </Link>
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-white/60 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ArrowLeft className="size-3.5" />
          Về trang chủ Shinme
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-shinme-border bg-shinme-surface px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Mở menu LMS"
          className="grid size-10 place-items-center rounded-xl border border-shinme-border text-shinme-primary hover:bg-shinme-leaf"
        >
          <Menu className="size-5" />
        </button>
        <Link href="/" className="text-base font-black text-shinme-primary">
          Shinme LMS
        </Link>
        <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", roleBadge.cls)}>{roleBadge.label}</span>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="relative z-10 w-72 max-w-[80vw]">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              aria-label="Đóng menu"
              className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <X className="size-4" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside aria-label="Thanh điều hướng LMS" className="hidden w-[var(--sidebar-w)] shrink-0 lg:block">
        <div className="sticky top-11 h-[calc(100vh-2.75rem)]">{sidebarContent}</div>
      </aside>
    </>
  );
}

