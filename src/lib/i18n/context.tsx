"use client";

import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import type { Language, I18nDictionary } from "./types";
import { vi } from "./translations/vi";
import { en } from "./translations/en";
import { ja } from "./translations/ja";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: I18nDictionary;
  interpolate: (text: string, vars?: Record<string, string | number>) => string;
  tr: (vi: string, en: string, ja: string) => string;
}

export function pickLang(lang: Language, vi: string, en: string, ja: string): string {
  if (lang === "en") return en;
  if (lang === "ja") return ja;
  return vi;
}

const dictionaries: Record<Language, I18nDictionary> = { vi, en, ja };

const STORAGE_KEY = "shinme_language";

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("vi");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
      if (saved === "vi" || saved === "en" || saved === "ja") {
        setLangState(saved);
        document.documentElement.lang = saved;
      } else {
        // Default to vi
        document.documentElement.lang = "vi";
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const setLang = (nextLang: Language) => {
    setLangState(nextLang);
    try {
      localStorage.setItem(STORAGE_KEY, nextLang);
      document.documentElement.lang = nextLang;
    } catch {
      // Ignore localStorage errors
    }
  };

  const toggleLang = () => {
    const order: Language[] = ["vi", "en", "ja"];
    const next = order[(order.indexOf(lang) + 1) % order.length];
    setLang(next);
  };

  const interpolate = (text: string, vars?: Record<string, string | number>): string => {
    if (!vars) return text;
    return Object.entries(vars).reduce((acc, [key, value]) => {
      return acc.replaceAll(`{${key}}`, String(value));
    }, text);
  };

  const value = useMemo(() => ({
    lang,
    setLang,
    toggleLang,
    t: dictionaries[lang],
    interpolate,
    tr: (viText: string, enText: string, jaText: string) => pickLang(lang, viText, enText, jaText),
  }), [lang]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

export function useTranslation() {
  return useLanguage();
}
