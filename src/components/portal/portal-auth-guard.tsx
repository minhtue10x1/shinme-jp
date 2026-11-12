"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Loader2, Lock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRole, type RoleId } from "@/lib/role-context";

function isRouteAllowed(pathname: string, role: RoleId): boolean {
  // Admin-only routes
  if (pathname.startsWith("/portal/users") || pathname.startsWith("/portal/leads")) {
    return role === "admin";
  }

  // Sensei & Admin authoring routes
  if (pathname.startsWith("/portal/tests/create") || pathname.startsWith("/portal/tests/manage")) {
    return role === "sensei" || role === "admin";
  }

  // Guest can only view Overview (/portal) and Profile (/portal/profile)
  if (role === "guest") {
    return pathname === "/portal" || pathname.startsWith("/portal/profile");
  }

  return true;
}

/**
 * Outer guard: ensures the visitor is authenticated via Firebase Auth.
 * Prevents unauthenticated users from seeing the LMS Portal shell.
 */
export function PortalAuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { firebaseUser, isLoadingAuth } = useRole();

  useEffect(() => {
    if (!isLoadingAuth && !firebaseUser) {
      router.replace("/login");
    }
  }, [isLoadingAuth, firebaseUser, router]);

  if (isLoadingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-shinme-bg p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="size-8 animate-spin text-shinme-primary" />
          <p className="text-sm font-bold text-shinme-muted">Đang xác thực phiên làm việc Shinme...</p>
        </div>
      </div>
    );
  }

  if (!firebaseUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-shinme-bg p-6">
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="grid size-14 place-items-center rounded-2xl bg-shinme-leaf text-shinme-primary">
            <Lock className="size-7" />
          </div>
          <h2 className="text-lg font-black text-shinme-ink">Yêu cầu đăng nhập</h2>
          <p className="text-xs font-medium text-shinme-muted">
            Bạn cần đăng nhập để truy cập Cổng học tập trực tuyến Shinme. Đang chuyển hướng...
          </p>
          <Button asChild size="sm">
            <Link href="/login">Đi tới trang Đăng nhập</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Inner route guard: verifies the authenticated user's role is permitted on this route.
 * Keeps the Sidebar visible so the user can easily navigate back.
 */
export function PortalRouteGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { role } = useRole();

  if (!isRouteAllowed(pathname, role)) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6">
        <div className="max-w-md rounded-3xl border border-shinme-border bg-shinme-surface p-8 text-center shadow-[var(--shadow-card)] space-y-4">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-shinme-warn-soft text-[#8a5a12]">
            <ShieldAlert className="size-7" />
          </div>
          <h2 className="text-xl font-black text-shinme-ink">Không có quyền truy cập</h2>
          <p className="text-xs font-medium leading-relaxed text-shinme-muted">
            {role === "guest"
              ? "Tài khoản Khách (chưa xếp lớp) chỉ có thể xem Tổng quan và Hồ sơ cá nhân. Vui lòng đợi Admin xếp lớp học cho bạn."
              : "Tài khoản của bạn không có quyền mở trang chức năng này."}
          </p>
          <div className="pt-2">
            <Button asChild size="sm">
              <Link href="/portal">Quay về Tổng quan Portal</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
