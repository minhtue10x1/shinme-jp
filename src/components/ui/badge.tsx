import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold whitespace-nowrap [&_svg]:size-3.5",
  {
    variants: {
      tone: {
        leaf: "bg-shinme-leaf text-shinme-primary",
        primary: "bg-shinme-primary text-white",
        warn: "bg-shinme-warn-soft text-[#8a5a12]",
        danger: "bg-shinme-danger-soft text-shinme-danger",
        neutral: "bg-shinme-bg-deep text-shinme-ink-soft",
        outline: "border border-shinme-border text-shinme-ink-soft",
      },
    },
    defaultVariants: { tone: "leaf" },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

