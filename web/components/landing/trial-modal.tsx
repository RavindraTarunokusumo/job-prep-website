"use client";

import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const trialFeatures = [
  "CV & job-description analysis",
  "Personalized preparation plan",
  "Mock interview practice",
  "Full readiness report",
] as const;

type TrialModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TrialModal({ open, onOpenChange }: TrialModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="max-w-[460px] rounded-3xl border-none p-8 shadow-[0_40px_90px_-30px_rgba(20,22,50,0.6)] sm:max-w-[460px]"
      >
        <DialogHeader className="gap-0 text-left">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[rgba(123,63,228,0.1)] px-[11px] py-[5px] font-mono text-[11px] font-semibold tracking-wider text-brand-purple uppercase">
            7-Day Free Trial
          </span>
          <DialogTitle className="mt-4 text-2xl leading-tight font-extrabold tracking-tight">
            Try the complete preparation workflow free for 7 days
          </DialogTitle>
          <DialogDescription className="mt-2.5 text-sm leading-relaxed text-[#616984]">
            Everything you need to go from CV to offer-ready — nothing locked
            behind a paywall during your trial.
          </DialogDescription>
        </DialogHeader>

        <ul className="my-5 flex flex-col gap-2.5">
          {trialFeatures.map((feature) => (
            <li
              key={feature}
              className="flex items-center gap-2.5 text-sm font-semibold text-[#28304a]"
            >
              <span className="flex size-[22px] items-center justify-center rounded-[7px] bg-[rgba(46,91,240,0.12)] text-xs text-brand-blue">
                ✓
              </span>
              {feature}
            </li>
          ))}
        </ul>

        <Link
          href="/signup"
          onClick={() => onOpenChange(false)}
          className="block w-full rounded-[13px] bg-brand-gradient py-[15px] text-center text-base font-bold text-white shadow-[0_14px_30px_-10px_rgba(70,63,228,0.8)] transition-[transform,box-shadow] hover:-translate-y-px hover:shadow-[0_18px_36px_-10px_rgba(70,63,228,0.9)] active:translate-y-0 active:scale-[0.99]"
        >
          Start 7-Day Free Trial
        </Link>
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="mt-1.5 w-full cursor-pointer rounded-xl border-none bg-transparent py-3 text-[15px] font-bold text-[#4a5167] transition-colors hover:bg-page"
        >
          Continue Exploring
        </button>

        <p className="mt-3 flex items-center justify-center gap-2 text-xs font-semibold text-[#8a90a3]">
          <span className="size-1.5 rounded-full bg-success" />
          No payment details required to start your trial
        </p>
      </DialogContent>
    </Dialog>
  );
}