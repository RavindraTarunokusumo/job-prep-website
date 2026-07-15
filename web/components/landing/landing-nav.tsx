"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { useTrialModal } from "./trial-modal-context";

const navLinks = [
  { href: "#how", label: "How It Works" },
  { href: "#features", label: "Features" },
  { href: "#resources", label: "Resources" },
  { href: "#pricing", label: "Pricing" },
] as const;

export function LandingNav() {
  const { openTrial } = useTrialModal();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-[rgba(24,30,54,0.06)] backdrop-blur-[14px] transition-[box-shadow,background] duration-250",
        scrolled
          ? "bg-white/90 shadow-[0_6px_26px_-10px_rgba(24,30,60,0.22)]"
          : "bg-white/65 shadow-none"
      )}
    >
      <nav className="mx-auto flex max-w-[1220px] flex-wrap items-center gap-4 px-6 py-[15px] md:gap-7 md:px-8">
        <Logo />
        <ul className="hidden flex-wrap items-center gap-1 text-[14.5px] font-semibold text-[#4a5167] md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="block rounded-[9px] px-[13px] py-2 transition-colors hover:bg-[rgba(46,91,240,0.08)] hover:text-brand-blue"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-[10px] px-4 py-2.5 text-[14.5px] font-bold text-[#3a4159] transition-colors hover:bg-[rgba(24,30,54,0.05)] hover:text-foreground"
          >
            Sign In
          </Link>
          <button
            type="button"
            onClick={openTrial}
            className="cursor-pointer rounded-[11px] bg-brand-gradient px-5 py-[11px] text-[14.5px] font-bold text-white shadow-[0_8px_20px_-8px_rgba(70,63,228,0.75)] transition-[transform,box-shadow] hover:-translate-y-px hover:shadow-[0_12px_26px_-8px_rgba(70,63,228,0.85)] active:translate-y-0 active:scale-[0.98]"
          >
            Start Free
          </button>
        </div>
      </nav>
    </header>
  );
}