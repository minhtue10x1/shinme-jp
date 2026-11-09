"use client";

/**
 * Demo lead store: consultation requests submitted on the homepage are kept in
 * localStorage so the Admin view in /portal can show them. Swap for an API
 * route / database in Phase 2.
 */

export type Lead = {
  id: string;
  fullName: string;
  phone: string;
  level: string;
  goal: string;
  note?: string;
  source: "Form tư vấn" | "Thi thử Mini";
  testScore?: number;
  createdAt: string;
};

const KEY = "shinme:leads";

export function readLeads(): Lead[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as Lead[];
  } catch {
    return [];
  }
}

export function saveLead(lead: Omit<Lead, "id" | "createdAt">): Lead {
  const full: Lead = {
    ...lead,
    id: `LD-${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
  };
  const next = [full, ...readLeads()].slice(0, 50);
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT));
  return full;
}

/* useSyncExternalStore helpers (stable snapshot per raw value) */
const EVENT = "shinme:leads-changed";
const EMPTY: Lead[] = [];
let cacheRaw: string | null = null;
let cacheVal: Lead[] = EMPTY;

export function subscribeLeads(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENT, cb);
  };
}

export function getLeadsSnapshot(): Lead[] {
  const raw = window.localStorage.getItem(KEY);
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    cacheVal = readLeads();
  }
  return cacheVal;
}

export function getLeadsServerSnapshot(): Lead[] {
  return EMPTY;
}
