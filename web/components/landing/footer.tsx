import Link from "next/link";
import { Logo } from "./logo";

const footerColumns = [
  {
    title: "Product",
    links: [
      { href: "#features", label: "Features" },
      { href: "#how", label: "How It Works" },
      { href: "#pricing", label: "Pricing" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "#resources", label: "Career Guides" },
      { href: "#resources", label: "Interview Preparation" },
      { href: "#resources", label: "CV Guidance" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/#top", label: "About Us" },
      { href: "/#top", label: "Contact" },
      { href: "/#top", label: "Careers" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/ai-use", label: "AI Use" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-border bg-[#fbfbff]">
      <div className="mx-auto flex max-w-[1220px] flex-wrap gap-10 px-6 pt-[52px] pb-7 md:px-8">
        <div className="min-w-[220px] flex-1">
          <Logo size="sm" />
          <p className="mt-3.5 max-w-[260px] text-[13px] leading-relaxed text-[#6b7288]">
            The structured way to prepare for the role you actually want.
          </p>
          <div className="mt-4 flex gap-2">
            {["𝕏", "in", "◐"].map((icon) => (
              <Link
                key={icon}
                href="/#top"
                aria-label={icon === "in" ? "LinkedIn" : icon === "◐" ? "GitHub" : "Twitter"}
                className="flex size-[34px] items-center justify-center rounded-[9px] border border-[rgba(24,30,54,0.12)] text-sm font-bold text-[#6b7288] transition-colors hover:border-[rgba(46,91,240,0.3)] hover:bg-[rgba(46,91,240,0.08)] hover:text-brand-blue"
              >
                {icon}
              </Link>
            ))}
          </div>
        </div>
        {footerColumns.map((column) => (
          <div key={column.title} className="min-w-[130px] flex-1">
            <div className="font-mono text-[11px] font-semibold tracking-wider text-[#9096a8] uppercase">
              {column.title}
            </div>
            <ul className="mt-3.5 flex flex-col gap-2.5 text-[13.5px] font-semibold">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[#4a5167] transition-colors hover:text-brand-blue"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto flex max-w-[1220px] flex-wrap justify-between gap-2.5 border-t border-[rgba(24,30,54,0.06)] px-6 py-4.5 pb-7.5 text-[12.5px] text-[#9096a8] md:px-8">
        <span>© 2026 RoleReady, Inc. All rights reserved.</span>
        <span className="font-mono">Built for candidates, not recruiters.</span>
      </div>
    </footer>
  );
}