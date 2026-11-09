"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { LevelId } from "@/data/courses";

export type LeadPrefill = { level?: string; goal?: string; course?: string; testScore?: number };

type HomeContextValue = {
  activeLevel: LevelId;
  setActiveLevel: (level: LevelId) => void;
  testOpen: boolean;
  /** Open the mini placement test, optionally with the first answer pre-selected. */
  openTest: (firstAnswer?: number) => void;
  closeTest: () => void;
  firstAnswer: number | null;
  leadPrefill: LeadPrefill;
  /** Prefill the consultation form and scroll to it. */
  goToConsultation: (prefill?: LeadPrefill) => void;
  /** Select a level on the roadmap and scroll to it. */
  goToCourses: (level: LevelId) => void;
};

const HomeContext = createContext<HomeContextValue | null>(null);

function scrollToId(id: string) {
  requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

export function HomeProvider({ children }: { children: ReactNode }) {
  const [activeLevel, setActiveLevel] = useState<LevelId>("N5");
  const [testOpen, setTestOpen] = useState(false);
  const [firstAnswer, setFirstAnswer] = useState<number | null>(null);
  const [leadPrefill, setLeadPrefill] = useState<LeadPrefill>({});

  const openTest = useCallback((answer?: number) => {
    setFirstAnswer(typeof answer === "number" ? answer : null);
    setTestOpen(true);
  }, []);

  const closeTest = useCallback(() => setTestOpen(false), []);

  const goToConsultation = useCallback((prefill?: LeadPrefill) => {
    if (prefill) setLeadPrefill(prefill);
    setTestOpen(false);
    scrollToId("tu-van");
  }, []);

  const goToCourses = useCallback((level: LevelId) => {
    setActiveLevel(level);
    setTestOpen(false);
    scrollToId("lo-trinh");
  }, []);

  const value = useMemo(
    () => ({
      activeLevel,
      setActiveLevel,
      testOpen,
      openTest,
      closeTest,
      firstAnswer,
      leadPrefill,
      goToConsultation,
      goToCourses,
    }),
    [activeLevel, testOpen, openTest, closeTest, firstAnswer, leadPrefill, goToConsultation, goToCourses],
  );

  return <HomeContext.Provider value={value}>{children}</HomeContext.Provider>;
}

export function useHome() {
  const ctx = useContext(HomeContext);
  if (!ctx) throw new Error("useHome must be used inside <HomeProvider>");
  return ctx;
}
