"use client";

import { useSyncExternalStore } from "react";
import { Check, ChevronDown, GraduationCap, School, ShieldAlert, Sparkles, Users } from "lucide-react";
import { FuriganaText } from "@/components/furigana-text";
import { Badge } from "@/components/ui/badge";
import {
  getActiveClassId,
  MOCK_CLASSES,
  setActiveClassId,
  subscribeActiveClass,
  type JapaneseClass,
} from "@/lib/classroom-store";
import { useRole } from "@/lib/role-context";
import { cn } from "@/lib/utils";

export function ClassSelector() {
  const { role } = useRole();
  const activeClassId = useSyncExternalStore(
    subscribeActiveClass,
    () => getActiveClassId(role),
    () => "cls-n3-246"
  );

  // Student is strictly locked to N3-Tối 246
  if (role === "student") {
    const studentClass = MOCK_CLASSES.find((c) => c.id === "cls-n3-246")!;
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-shinme-border bg-shinme-surface px-4 py-3 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-shinme-leaf text-shinme-primary font-black">
            {studentClass.level}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-shinme-muted">Lớp học của bạn:</span>
              <Badge tone="leaf">Chính khóa</Badge>
            </div>
            <p className="text-base font-black text-shinme-ink">{studentClass.name}</p>
            <p className="text-xs text-shinme-muted">
              {studentClass.schedule} · {studentClass.time} · {studentClass.room}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-shinme-muted">
          <span className="inline-flex items-center gap-1 text-shinme-primary font-bold">
            <School className="size-3.5" /> Giảng viên: {studentClass.sensei}
          </span>
        </div>
      </div>
    );
  }

  // Sensei: can switch between their classes (N3 and Kaiwa)
  // Admin: can switch all 3 classes
  const allowedClasses =
    role === "sensei"
      ? MOCK_CLASSES.filter((c) => c.senseiId === "ss-tanaka")
      : MOCK_CLASSES;

  const currentClass = MOCK_CLASSES.find((c) => c.id === activeClassId) || allowedClasses[0];

  return (
    <div className="rounded-2xl border border-shinme-border bg-shinme-surface p-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-shinme-leaf text-shinme-primary">
            <School className="size-4" />
          </span>
          <div>
            <p className="text-xs font-bold text-shinme-muted uppercase tracking-wider">
              {role === "sensei" ? "Lớp đang quản lý & giảng dạy" : "Xem dữ liệu theo lớp học"}
            </p>
            <p className="text-base font-black text-shinme-ink">{currentClass.name}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-shinme-muted">Chuyển lớp:</span>
          <div className="flex flex-wrap gap-1.5">
            {allowedClasses.map((cls) => {
              const active = cls.id === currentClass.id;
              return (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => setActiveClassId(cls.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black transition-all",
                    active
                      ? "bg-shinme-primary text-white shadow-xs"
                      : "bg-shinme-bg text-shinme-ink-soft hover:bg-shinme-leaf hover:text-shinme-primary border border-shinme-line"
                  )}
                >
                  {active && <Check className="size-3 stroke-[3]" />}
                  <span>{cls.shortName}</span>
                  <span className="opacity-70 text-[0.7rem]">({cls.studentsCount} HV)</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

