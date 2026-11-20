"use client";

import { Globe } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";
import type { Language } from "@/lib/i18n/types";
import { cn } from "@/lib/utils";

interface LanguageToggleProps {
  className?: string;
  variant?: "navbar" | "sidebar" | "compact";
}

const LANG_OPTIONS: { code: Language; label: string; ariaLabel: string }[] = [
  { code: "vi", label: "VI", ariaLabel: "Chọn Tiếng Việt" },
  { code: "en", label: "EN", ariaLabel: "Select English" },
  { code: "ja", label: "JP", ariaLabel: "日本語を選択" },
];

export function LanguageToggle({ className, variant = "navbar" }: LanguageToggleProps) {
  const { lang, setLang } = useLanguage();

  if (variant === "sidebar") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-0.5 rounded-full bg-white/10 p-0.5 border border-white/15 text-xs font-bold text-white shadow-xs",
          className
        )}
        role="group"
        aria-label="Language selection / Chọn ngôn ngữ / 言語切替"
      >
        <span className="pl-1.5 pr-0.5 text-white/70" title="Language selection">
          <Globe className="size-3.5" />
        </span>
        {LANG_OPTIONS.map((opt) => (
          <button
            key={opt.code}
            type="button"
            onClick={() => setLang(opt.code)}
            className={cn(
              "rounded-full px-2 py-0.5 transition-all cursor-pointer select-none",
              lang === opt.code
                ? "bg-white text-shinme-primary-deep font-black shadow-xs"
                : "text-white/80 hover:text-white"
            )}
            aria-pressed={lang === opt.code}
            aria-label={opt.ariaLabel}
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-shinme-border/80 bg-shinme-surface/90 p-0.5 shadow-2xs backdrop-blur-xs transition-colors",
        className
      )}
      role="group"
      aria-label="Language selection / Chọn ngôn ngữ / 言語切替"
    >
      <span className="pl-1.5 pr-0.5 text-shinme-primary/70" aria-hidden="true">
        <Globe className="size-3.5" />
      </span>
      {LANG_OPTIONS.map((opt) => (
        <button
          key={opt.code}
          type="button"
          onClick={() => setLang(opt.code)}
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-black transition-all cursor-pointer select-none",
            lang === opt.code
              ? "bg-shinme-primary text-white shadow-2xs"
              : "text-shinme-ink-soft hover:bg-shinme-leaf hover:text-shinme-primary"
          )}
          aria-pressed={lang === opt.code}
          aria-label={opt.ariaLabel}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
