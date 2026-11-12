import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatVnd(amount: number) {
  return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
}

/**
 * Validates that a URL uses http:// or https:// protocol (prevents javascript: XSS).
 */
export function isSafeHttpUrl(raw?: string | null): boolean {
  if (!raw) return false;
  try {
    const parsed = new URL(raw.trim());
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Validates avatar image sources: allows safe http(s) URLs or raster image base64 data URLs.
 */
export function isSafeAvatarSrc(raw?: string | null): boolean {
  if (!raw) return false;
  const trimmed = raw.trim();
  if (isSafeHttpUrl(trimmed)) return true;
  return /^data:image\/(webp|jpeg|jpg|png|gif);base64,[A-Za-z0-9+/=]+$/i.test(trimmed);
}

