import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { DemoRoleSwitcher } from "@/components/portal/demo-role-switcher";
import { PortalSidebar } from "@/components/portal/portal-sidebar";
import { RoleProvider } from "@/lib/role-context";

export const metadata: Metadata = {
  title: "Cổng học viên & Sensei (LMS)",
  description: "Hệ thống quản lý học tập, học liệu và bài tập của Trung tâm Nhật ngữ Shinme.",
};

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <RoleProvider>
      <div className="flex min-h-screen flex-col bg-shinme-bg">
        <DemoRoleSwitcher />
        <div className="flex flex-1">
          <Suspense fallback={<aside className="hidden w-[var(--sidebar-w)] bg-shinme-primary-deep lg:block" />}>
            <PortalSidebar />
          </Suspense>
          <main className="flex-1 overflow-x-hidden p-5 sm:p-8 lg:p-10">{children}</main>
        </div>
      </div>
    </RoleProvider>
  );
}

