"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type UserAvatarProps = {
  src?: string | null;
  fallbackText: string;
  alt?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  fallbackClassName?: string;
};

const SIZE_MAP = {
  xs: "size-7 text-xs",
  sm: "size-9 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
  xl: "size-24 text-2xl",
};

export function UserAvatar({
  src,
  fallbackText,
  alt = "Avatar",
  size = "md",
  className,
  fallbackClassName,
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  const trimmedSrc = src?.trim();
  const showImage = Boolean(trimmedSrc) && !imgError;

  if (showImage) {
    return (
      <img
        src={trimmedSrc}
        alt={alt}
        onError={() => setImgError(true)}
        className={cn(
          "shrink-0 rounded-full object-cover bg-shinme-leaf",
          SIZE_MAP[size],
          className
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-shinme-leaf font-black text-shinme-primary select-none",
        SIZE_MAP[size],
        fallbackClassName,
        className
      )}
    >
      {(fallbackText || "HV").slice(0, 2).toUpperCase()}
    </span>
  );
}
