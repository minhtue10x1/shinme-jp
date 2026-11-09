import Image from "next/image";
import { cn } from "@/lib/utils";

/** Two-leaf sprout mark, drawn to match the Shinme logo. */
export function SproutMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8", className)}>
      <path d="M16 30V17" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <path
        d="M15.4 17.6C9.2 18.4 4.6 15 3.6 8.4c6.6-.9 11.4 2.4 11.8 9.2Z"
        fill="var(--sprout-500)"
      />
      <path
        d="M16.6 16.4c.2-7.6 5-12.4 12.6-12.8-.1 7.8-4.6 12.6-12.6 12.8Z"
        fill="currentColor"
      />
    </svg>
  );
}

/** Official PNG logo for light surfaces (multiply blend drops its off-white ground). */
export function ShinmeLogo({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/brand/shinme-logo.png"
      alt="Shinme — 日本語で未来をひらく"
      width={152}
      height={83}
      priority={priority}
      className={cn("h-11 w-auto mix-blend-multiply", className)}
    />
  );
}

/** Wordmark for dark surfaces (sidebar, footer). */
export function ShinmeWordmark({ className, subtitle }: { className?: string; subtitle?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <SproutMark className="size-8 text-white" />
      <span className="flex flex-col leading-none">
        <span className="text-xl font-black tracking-tight">Shinme</span>
        {subtitle && <span className="mt-1 text-[0.7rem] font-semibold opacity-75">{subtitle}</span>}
      </span>
    </span>
  );
}

