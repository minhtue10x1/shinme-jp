import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { PortalSidebar } from "@/components/portal/portal-sidebar";
import { PortalAuthGuard, PortalRouteGuard } from "@/components/portal/portal-auth-guard";

export const metadata: Metadata = {
  title: "Cổng học viên & Sensei (LMS)",
  description: "Hệ thống quản lý học tập, học liệu và bài tập của Trung tâm Nhật ngữ Shinme.",
};

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <PortalAuthGuard>
      <div className="flex min-h-screen flex-col bg-shinme-bg">
        <div className="flex flex-1">
          <Suspense fallback={<aside className="hidden w-[var(--sidebar-w)] bg-shinme-primary-deep lg:block" />}>
            <PortalSidebar />
          </Suspense>
          <main className="flex-1 overflow-x-hidden p-5 sm:p-8 lg:p-10">
            <PortalRouteGuard>{children}</PortalRouteGuard>
          </main>
        </div>
      </div>
    </PortalAuthGuard>
  );
}

