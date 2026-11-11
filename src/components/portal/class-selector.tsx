"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Check, School, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  getActiveClassId,
  setActiveClassId,
  subscribeActiveClass,
} from "@/lib/classroom-store";
import { useRole } from "@/lib/role-context";
import { getClasses } from "@/lib/db/services";
import type { ClassDoc } from "@/lib/db/schema";
import { cn } from "@/lib/utils";

export function ClassSelector() {
  const { role, user } = useRole();
  const [classes, setClasses] = useState<ClassDoc[]>([]);

  useEffect(() => {
    getClasses().then(setClasses).catch(console.error);
  }, []);

  const activeClassId = useSyncExternalStore(
    subscribeActiveClass,
    () => getActiveClassId(role),
    () => "cls-n3-246"
  );

  // Student view: locked to their assigned class
  if (role === "student") {
    const studentClass =
      classes.find((c) => c.id === user.classId) ||
      classes.find((c) => c.name.includes("N3")) ||
      classes[0] || {
        id: "cls-n3-246",
        level: "N3",
        name: user.className || "N3-Tối 246 (Sensei Tanaka)",
        schedule: "Thứ 2 · 4 · 6",
        time: "19:00 – 21:00",
        room: "Phòng 204",
        senseiName: "Tanaka Yuki",
      };

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
            <School className="size-3.5" /> Giảng viên: {studentClass.senseiName}
          </span>
        </div>
      </div>
    );
  }

  // Sensei & Admin: can switch between classes
  const allowedClasses =
    role === "sensei" && classes.some((c) => c.senseiName.includes(user.name) || c.senseiId === user.id)
      ? classes.filter((c) => c.senseiName.includes(user.name) || c.senseiId === user.id)
      : classes;

  const currentClass =
    classes.find((c) => c.id === activeClassId) || allowedClasses[0] || classes[0];

  if (!currentClass) return null;

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
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
