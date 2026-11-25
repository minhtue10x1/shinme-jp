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
import { getClasses, getClassById } from "@/lib/db/services";
import type { ClassDoc } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/context";

export function ClassSelector() {
  const { role, user } = useRole();
  const { tr } = useTranslation();
  const [classes, setClasses] = useState<ClassDoc[]>([]);

  useEffect(() => {
    if (role === "student") {
      if (user.classId) {
        getClassById(user.classId)
          .then((cls) => setClasses(cls ? [cls] : []))
          .catch(console.error);
      } else {
        setClasses([]);
      }
      return;
    }
    if (role === "sensei" || role === "admin") {
      getClasses().then(setClasses).catch(console.error);
    }
  }, [role, user.classId]);

  const activeClassId = useSyncExternalStore(
    subscribeActiveClass,
    () => getActiveClassId(role),
    () => "cls-n3-246"
  );

  // Student view: strictly locked to their assigned class (never show other classes)
  if (role === "student") {
    const studentClass =
      (user.classId ? classes.find((c) => c.id === user.classId) : undefined) || {
        id: user.classId || "",
        level: "JLPT",
        name: user.className || tr("Chưa được xếp lớp", "Not assigned to a class yet", "クラス未配属"),
        schedule: "—",
        time: "—",
        room: "—",
        senseiName: "—",
      };

    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-shinme-border bg-shinme-surface px-4 py-3 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-shinme-leaf text-shinme-primary font-black">
            {studentClass.level}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-shinme-muted">
                {tr("Lớp học của bạn:", "Your class:", "受講中のクラス：")}
              </span>
              <Badge tone="leaf">{tr("Chính khóa", "Enrolled", "正規クラス")}</Badge>
            </div>
            <p className="text-base font-black text-shinme-ink">{studentClass.name}</p>
            <p className="text-xs text-shinme-muted">
              {studentClass.schedule} · {studentClass.time} · {studentClass.room}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-shinme-muted">
          <span className="inline-flex items-center gap-1 text-shinme-primary font-bold">
            <School className="size-3.5" /> {tr("Giảng viên:", "Instructor:", "担当講師：")} {studentClass.senseiName}
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
              {role === "sensei"
                ? tr("Lớp đang quản lý & giảng dạy", "Assigned & Active Class", "担当クラス")
                : tr("Xem dữ liệu theo lớp học", "Viewing data by class", "クラス別データ表示")}
            </p>
            <p className="text-base font-black text-shinme-ink">{currentClass.name}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-shinme-muted">
            {tr("Chuyển lớp:", "Switch class:", "クラス切替：")}
          </span>
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
