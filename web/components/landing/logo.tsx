import Link from "next/link";
import { cn } from "@/lib/utils";

type LogoProps = {
  size?: "sm" | "md";
  className?: string;
};

export function Logo({ size = "md", className }: LogoProps) {
  const iconSize = size === "sm" ? "size-[34px] rounded-[10px] p-2" : "size-[38px] rounded-[11px] p-[9px]";
  const textSize = size === "sm" ? "text-base" : "text-lg";

  return (
    <Link
      href="/#top"
      className={cn("flex items-center gap-2.5 font-extrabold text-foreground", className)}
    >
      <span
        className={cn(
          "flex items-end justify-center gap-[2.5px] bg-brand-gradient shadow-[0_6px_16px_-6px_rgba(46,91,240,0.7)]",
          iconSize
        )}
      >
        <i className="h-2 w-1 rounded-sm bg-white/55" />
        <i className="h-[13px] w-1 rounded-sm bg-white/80" />
        <i className="h-[18px] w-1 rounded-sm bg-white" />
      </span>
      <span className={cn("tracking-tight", textSize)}>
        Role<span className="text-brand-blue">Ready</span>
      </span>
    </Link>
  );
}