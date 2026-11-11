"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GraduationCap, Menu, X } from "lucide-react";
import { ShinmeLogo } from "@/components/brand/logo";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRole } from "@/lib/role-context";

const NAV_LINKS = [
  { href: "#ve-shinme", label: "Về Shinme" },
  { href: "#lo-trinh", label: "Lộ trình khóa học" },
  { href: "#sensei", label: "Đội ngũ Sensei" },
  { href: "#thi-thu", label: "Thi thử Mini" },
  { href: "#blog", label: "Blog" },
];

export function Navbar() {
  const { firebaseUser, user, isLoadingAuth } = useRole();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-shinme-bg transition-shadow duration-300",
        scrolled && "shadow-[0_1px_0_var(--color-shinme-line),0_10px_24px_-20px_rgb(19_94_54/0.5)]",
      )}
    >
      <nav
        aria-label="Điều hướng chính"
        className="mx-auto flex h-[var(--navbar-h)] max-w-7xl items-center gap-6 px-5 lg:px-8"
      >
        <Link href="/" aria-label="Shinme — Trang chủ" className="shrink-0 rounded-lg">
          <ShinmeLogo priority />
        </Link>

        <ul className="ml-auto hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="rounded-full px-3.5 py-2 text-sm font-bold text-shinme-ink-soft transition-colors hover:bg-shinme-leaf hover:text-shinme-primary"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="ml-auto hidden items-center gap-3 sm:inline-flex lg:ml-2">
          {isLoadingAuth ? (
            <div className="h-11 w-28 rounded-full bg-shinme-leaf/50 animate-pulse" />
          ) : firebaseUser ? (
            <div className="flex items-center gap-2.5">
              <div className="hidden items-center gap-2 text-xs font-bold text-shinme-ink-soft md:flex">
                <UserAvatar
                  src={user.avatarUrl}
                  fallbackText={user.avatarText}
                  alt={user.name}
                  size="xs"
                  className="border border-shinme-border shadow-xs"
                  fallbackClassName="bg-shinme-leaf text-shinme-primary"
                />
                <span className="font-jp text-shinme-primary font-bold">こんにちは,</span>
                <span className="max-w-[130px] truncate font-black text-shinme-ink" title={user.name}>
                  {user.name}
                </span>
              </div>
              <Button asChild size="md">
                <Link href="/portal">
                  <GraduationCap />
                  Cổng LMS
                  <span className="rounded-full bg-white/15 px-1.5 py-px text-xs font-extrabold tracking-wide">
                    Portal
                  </span>
                </Link>
              </Button>
            </div>
          ) : (
            <Button asChild size="md">
              <Link href="/login">Đăng nhập</Link>
            </Button>
          )}
        </div>

        <button
          type="button"
          className="ml-auto grid size-11 place-items-center rounded-full text-shinme-primary hover:bg-shinme-leaf sm:ml-0 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Đóng menu" : "Mở menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </nav>

      {open && (
        <div id="mobile-nav" className="border-t border-shinme-line bg-shinme-bg px-5 pb-6 pt-2 lg:hidden">
          <ul className="flex flex-col">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-xl px-3 py-3 text-lg font-bold text-shinme-ink hover:bg-shinme-leaf"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          {isLoadingAuth ? (
            <div className="mt-3 h-13 w-full rounded-full bg-shinme-leaf/50 animate-pulse" />
          ) : firebaseUser ? (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2.5 rounded-2xl bg-shinme-leaf px-3.5 py-2.5">
                <UserAvatar
                  src={user.avatarUrl}
                  fallbackText={user.avatarText}
                  alt={user.name}
                  size="sm"
                  className="rounded-xl"
                  fallbackClassName="rounded-xl bg-shinme-accent text-shinme-primary-deep shadow-sm"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-jp text-shinme-primary font-bold">こんにちは,</p>
                  <p className="truncate text-xs font-black text-shinme-ink">{user.name}</p>
                </div>
              </div>
              <Button asChild size="lg" className="w-full">
                <Link href="/portal" onClick={() => setOpen(false)}>
                  <GraduationCap />
                  Cổng Học Viên / Sensei (LMS)
                </Link>
              </Button>
            </div>
          ) : (
            <Button asChild size="lg" className="mt-3 w-full">
              <Link href="/login" onClick={() => setOpen(false)}>
                Đăng nhập
              </Link>
            </Button>
          )}
        </div>
      )}
    </header>
  );
}

