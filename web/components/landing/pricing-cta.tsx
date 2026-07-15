"use client";

import { useTrialModal } from "./trial-modal-context";

export function PricingCta() {
  const { openTrial } = useTrialModal();
  return (
    <section
      id="pricing"
      className="mx-auto max-w-[1000px] px-6 pt-[84px] pb-7.5 text-center md:px-8"
    >
      <span className="font-mono text-xs font-semibold tracking-widest text-brand-purple uppercase">
        Get Started
      </span>
      <h2 className="mt-3.5 text-[clamp(32px,4.6vw,52px)] leading-[1.05] font-extrabold tracking-tight">
        Prepare for the role—
        <br />
        not just the interview.
      </h2>
      <p className="mx-auto mt-4.5 max-w-[560px] text-lg leading-relaxed text-muted-foreground">
        Start free for 7 days. Build your first personalized preparation plan in
        minutes.
      </p>
      <div className="mt-7.5 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={openTrial}
          className="cursor-pointer rounded-[14px] bg-brand-gradient px-[30px] py-4 text-[17px] font-bold text-white shadow-[0_16px_34px_-12px_rgba(70,63,228,0.8)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_20px_40px_-12px_rgba(70,63,228,0.9)] active:translate-y-0 active:scale-[0.985]"
        >
          Build My Preparation Plan
        </button>
        <a
          href="#how"
          className="inline-flex rounded-[14px] border border-[rgba(24,30,54,0.12)] bg-white px-7 py-4 text-[17px] font-bold text-[#28304a] shadow-[0_2px_8px_rgba(24,30,60,0.05)] transition-transform hover:-translate-y-0.5"
        >
          See how it works
        </a>
      </div>
      <p className="mt-4.5 text-[12.5px] font-semibold text-[#8a90a3]">
        No credit card required · Cancel anytime · Your documents stay private
      </p>
    </section>
  );
}