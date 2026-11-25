"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
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
  Loader2,
  LogOut,
  Menu,
  Sparkles,
  UserCheck,
  Users2,
  X,
} from "lucide-react";
import { FuriganaText } from "@/components/furigana-text";
import { ShinmeWordmark } from "@/components/brand/logo";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { useRole, type RoleId } from "@/lib/role-context";
import { useTranslation } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: RoleId[];
  badge?: string;
};

export function PortalSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, user, logout } = useRole();
  const { t, lang, tr } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navItems: NavItem[] = [
    { href: "/portal", label: t.portal.sidebar.overview, icon: LayoutDashboard, roles: ["guest", "student", "sensei", "admin"] },
    { href: "/portal/profile", label: t.portal.sidebar.profile, icon: UserCheck, roles: ["guest", "student", "sensei", "admin"] },
    { href: "/portal/users", label: t.portal.sidebar.users, icon: Users2, roles: ["admin"] },
    { href: "/portal/tests", label: t.portal.sidebar.tests, icon: GraduationCap, roles: ["student", "sensei", "admin"] },
    { href: "/portal/gradebook", label: t.portal.sidebar.gradebook, icon: BarChart3, roles: ["sensei", "admin", "student"] },
    { href: "/portal/assignments", label: t.portal.sidebar.assignments, icon: FileCheck2, roles: ["student", "sensei", "admin"] },
    { href: "/portal/materials", label: t.portal.sidebar.materials, icon: BookOpen, roles: ["student", "sensei", "admin"] },
    { href: "/portal/classes", label: t.portal.sidebar.classes, icon: CalendarDays, roles: ["student", "sensei", "admin"] },
    { href: "/portal/leads", label: t.portal.sidebar.leads, icon: Users2, roles: ["admin"] },
  ];

  const handleConfirmLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      setIsLogoutOpen(false);
      toast.success(
        lang === "vi"
          ? "Đã đăng xuất tài khoản."
          : lang === "ja"
            ? "ログアウトしました。"
            : "Successfully logged out."
      );
      router.push("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      toast.error(
        lang === "vi"
          ? "Không thể đăng xuất. Vui lòng thử lại."
          : lang === "ja"
            ? "ログアウトできませんでした。もう一度お試しください。"
            : "Could not log out. Please try again."
      );
    } finally {
      setIsLoggingOut(false);
    }
  };

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, role]);

  const visible = navItems.filter((item) => item.roles.includes(role));

  const roleBadge =
    role === "admin"
      ? { label: t.portal.sidebar.roleAdmin, cls: "bg-shinme-warn-soft text-[#8a5a12]" }
      : role === "sensei"
        ? { label: t.portal.sidebar.roleSensei, cls: "bg-shinme-leaf text-shinme-primary" }
        : role === "guest"
          ? { label: t.portal.sidebar.roleGuest, cls: "bg-amber-100 text-amber-800" }
          : { label: t.portal.sidebar.roleStudent, cls: "bg-shinme-surface/15 text-white" };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-shinme-primary-deep text-white">
      <div className="border-b border-white/10 p-5">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.scrollTo({ top: 0, left: 0, behavior: "instant" });
              }
            }}
            className="inline-block"
          >
            <ShinmeWordmark subtitle={t.portal.sidebar.brandSub} />
          </Link>
          <LanguageToggle variant="sidebar" />
        </div>

        {/* Current user tile */}
        <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white/5 p-3">
          <UserAvatar
            src={user.avatarUrl}
            fallbackText={user.avatarText}
            alt={user.name}
            size="md"
            className="rounded-xl"
            fallbackClassName="rounded-xl bg-shinme-accent text-shinme-primary-deep"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-black">{user.name}</p>
              <span className={cn("rounded px-1.5 py-px text-xs font-black uppercase", roleBadge.cls)}>
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

      <nav aria-label={tr("Menu chức năng LMS", "LMS Navigation Menu", "LMS機能メニュー")} className="flex-1 overflow-y-auto p-4">
        <p className="px-3 text-xs font-bold uppercase tracking-wider text-white/40">{t.common.actions}</p>
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
          href="/portal/profile"
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-shinme-accent transition-colors hover:bg-white/10 hover:text-white"
        >
          <UserCheck className="size-3.5" />
          {t.portal.sidebar.profile}
        </Link>
        <Link
          href="/"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.scrollTo({ top: 0, left: 0, behavior: "instant" });
            }
          }}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-white/60 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ArrowLeft className="size-3.5" />
          {t.common.backToHome}
        </Link>
        <button
          type="button"
          onClick={() => {
            setMobileOpen(false);
            setIsLogoutOpen(true);
          }}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-rose-300/90 transition-colors hover:bg-rose-500/15 hover:text-rose-200"
        >
          <LogOut className="size-3.5" />
          {t.portal.sidebar.logoutBtn}
        </button>
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
          aria-label={tr("Mở menu LMS", "Open LMS menu", "LMSメニューを開く")}
          className="grid size-10 place-items-center rounded-xl border border-shinme-border text-shinme-primary hover:bg-shinme-leaf"
        >
          <Menu className="size-5" />
        </button>
        <Link href="/" className="text-base font-black text-shinme-primary">
          Shinme LMS
        </Link>
        <div className="flex items-center gap-2">
          <LanguageToggle variant="compact" />
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", roleBadge.cls)}>{roleBadge.label}</span>
        </div>
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
              aria-label={tr("Đóng menu", "Close menu", "メニューを閉じる")}
              className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
            >
              <X className="size-4" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside aria-label={tr("Thanh điều hướng LMS", "LMS Sidebar", "LMSサイドバー")} className="hidden w-[var(--sidebar-w)] shrink-0 lg:block">
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {/* Logout Confirmation Dialog */}
      {isLogoutOpen && (
        <Dialog open={true} onOpenChange={(open) => !open && !isLoggingOut && setIsLogoutOpen(false)}>
          <DialogContent className="max-w-sm">
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600">
                  <LogOut className="size-5" />
                </span>
                <div>
                  <DialogTitle className="text-lg font-black text-shinme-ink">
                    {t.portal.sidebar.logoutModalTitle}
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-xs text-shinme-muted leading-relaxed">
                    {lang === "vi" ? (
                      <>Bạn có chắc chắn muốn đăng xuất khỏi tài khoản <strong className="text-shinme-ink">{user.name}</strong> ({user.code}) không?</>
                    ) : lang === "ja" ? (
                      <>アカウント <strong className="text-shinme-ink">{user.name}</strong>（{user.code}）からログアウトしてもよろしいですか？</>
                    ) : (
                      <>Are you sure you want to log out of account <strong className="text-shinme-ink">{user.name}</strong> ({user.code})?</>
                    )}
                  </DialogDescription>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-shinme-line">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsLogoutOpen(false)}
                  disabled={isLoggingOut}
                >
                  {t.portal.sidebar.logoutCancel}
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmLogout}
                  disabled={isLoggingOut}
                  className="bg-rose-600 text-white hover:bg-rose-700"
                >
                  {isLoggingOut ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> {t.common.loading}
                    </>
                  ) : (
                    <>
                      <LogOut className="size-4" /> {t.portal.sidebar.logoutConfirm}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

