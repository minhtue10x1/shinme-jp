import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "./slot";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-bold transition-[background-color,color,box-shadow,transform] duration-200 ease-[var(--ease-out-expo)] disabled:pointer-events-none disabled:opacity-50 active:translate-y-px [&_svg]:size-[1.1em] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-shinme-primary text-white shadow-[0_6px_16px_-8px_rgb(19_94_54/0.7)] hover:bg-shinme-primary-hover",
        accent: "bg-shinme-accent text-shinme-primary-deep hover:bg-[#7ccf5a]",
        outline:
          "border-2 border-shinme-primary/20 bg-shinme-surface text-shinme-primary hover:border-shinme-primary/50 hover:bg-shinme-leaf-faint",
        ghost: "text-shinme-primary hover:bg-shinme-leaf",
        onDark: "bg-white text-shinme-primary hover:bg-shinme-leaf",
        onDarkOutline: "border-2 border-white/30 text-white hover:border-white/70 hover:bg-white/10",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-5 text-[0.95rem]",
        lg: "h-13 px-7 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild, type, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      type={asChild ? undefined : (type ?? "button")}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

