"use client";

import { Globe } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

interface LanguageToggleProps {
  className?: string;
  variant?: "navbar" | "sidebar" | "compact";
}

export function LanguageToggle({ className, variant = "navbar" }: LanguageToggleProps) {
  const { lang, setLang } = useLanguage();

  if (variant === "sidebar") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full bg-white/10 p-1 border border-white/15 text-xs font-bold text-white shadow-xs",
          className
        )}
      >
        <span className="pl-1.5 text-white/70" title="Language selection">
          <Globe className="size-3.5" />
        </span>
        <button
          type="button"
          onClick={() => setLang("vi")}
          className={cn(
            "rounded-full px-2.5 py-1 transition-all cursor-pointer",
            lang === "vi"
              ? "bg-white text-shinme-primary-deep font-black shadow-xs"
              : "text-white/80 hover:text-white"
          )}
          aria-pressed={lang === "vi"}
          aria-label="Chuyển sang Tiếng Việt"
        >
          VI
        </button>
        <button
          type="button"
          onClick={() => setLang("en")}
          className={cn(
            "rounded-full px-2.5 py-1 transition-all cursor-pointer",
            lang === "en"
              ? "bg-white text-shinme-primary-deep font-black shadow-xs"
              : "text-white/80 hover:text-white"
          )}
          aria-pressed={lang === "en"}
          aria-label="Switch to English"
        >
          EN
        </button>
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
      aria-label="Language selection / Chọn ngôn ngữ"
    >
      <span className="pl-1.5 pr-0.5 text-shinme-primary/70" aria-hidden="true">
        <Globe className="size-3.5" />
      </span>
      <button
        type="button"
        onClick={() => setLang("vi")}
        className={cn(
          "rounded-full px-2 py-0.5 text-xs font-black transition-all cursor-pointer select-none",
          lang === "vi"
            ? "bg-shinme-primary text-white shadow-2xs"
            : "text-shinme-ink-soft hover:bg-shinme-leaf hover:text-shinme-primary"
        )}
        aria-pressed={lang === "vi"}
        aria-label="Chọn Tiếng Việt"
      >
        VI
      </button>
      <button
        type="button"
        onClick={() => setLang("en")}
        className={cn(
          "rounded-full px-2 py-0.5 text-xs font-black transition-all cursor-pointer select-none",
          lang === "en"
            ? "bg-shinme-primary text-white shadow-2xs"
            : "text-shinme-ink-soft hover:bg-shinme-leaf hover:text-shinme-primary"
        )}
        aria-pressed={lang === "en"}
        aria-label="Select English"
      >
        EN
      </button>
    </div>
  );
}
