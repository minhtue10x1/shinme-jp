"use client";

import { Check, ShieldAlert, Sparkles, UserCheck } from "lucide-react";
import { ROLES, useRole, type RoleId } from "@/lib/role-context";
import { cn } from "@/lib/utils";

const ROLE_ITEMS: { id: RoleId; label: string; code: string; short: string }[] = [
  { id: "student", label: "Học viên", code: ROLES.student.code, short: "Student" },
  { id: "sensei", label: "Sensei", code: ROLES.sensei.code, short: "Sensei" },
  { id: "admin", label: "Quản trị viên", code: ROLES.admin.code, short: "Admin" },
];

export function DemoRoleSwitcher() {
  const { role, user, setRole } = useRole();

  return (
    <aside
      aria-label="Thanh chuyển vai trò demo"
      className="sticky top-0 z-50 border-b border-shinme-border bg-shinme-surface/95 px-4 py-2.5 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-md bg-shinme-warn-soft px-2 py-0.5 font-black text-[#8a5a12]">
            <Sparkles className="size-3" /> DEMO ROLE SWITCHER
          </span>
          <span className="hidden text-shinme-muted sm:inline">
            Đang đóng vai: <strong className="text-shinme-ink">{user.name}</strong> ({user.code})
          </span>
        </div>

        <div role="radiogroup" aria-label="Chọn vai trò demo" className="flex items-center gap-1">
          {ROLE_ITEMS.map((item) => {
            const active = role === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setRole(item.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-3 py-1 font-extrabold transition-[background-color,color] duration-150",
                  active
                    ? "bg-shinme-primary text-white shadow-sm"
                    : "bg-shinme-bg text-shinme-ink-soft hover:bg-shinme-leaf hover:text-shinme-primary",
                )}
              >
                {active && <Check className="size-3" strokeWidth={3} />}
                <span>{item.short}</span>
                <span className="opacity-75">({item.code})</span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

