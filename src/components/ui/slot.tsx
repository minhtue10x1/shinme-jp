import { cloneElement, isValidElement, type HTMLAttributes, type ReactElement } from "react";
import { cn } from "@/lib/utils";

/** Minimal Slot: merges props/className into its single child element. */
export function Slot({ children, className, ...props }: HTMLAttributes<HTMLElement>) {
  if (!isValidElement(children)) return null;
  const child = children as ReactElement<HTMLAttributes<HTMLElement>>;
  return cloneElement(child, {
    ...props,
    ...child.props,
    className: cn(className, child.props.className),
  });
}

