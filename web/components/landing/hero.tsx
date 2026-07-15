"use client";

import { useTrialModal } from "./trial-modal-context";

export function Hero() {
  const { openTrial } = useTrialModal();
  return (
    <section className="mx-auto flex max-w-[1220px] flex-wrap items-center gap-10 px-6 py-[76px] pb-10 md:gap-14 md:px-8">
      <div className="min-w-[280px] flex-1 animate-rr-rise sm:min-w-[340px]">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-white/80 px-3 py-1.5 text-[12.5px] font-semibold text-[#3a4159] shadow-[0_2px_8px_rgba(24,30,60,0.05)]">
          <span className="inline-flex rounded-full bg-[rgba(123,63,228,0.1)] px-2 py-0.5 font-mono text-[10.5px] font-semibold text-brand-purple">
            NEW
          </span>
          Structured prep, not another chatbot
        </span>
        <h1 className="mt-5.5 text-[clamp(36px,5.2vw,60px)] leading-[1.04] font-extrabold tracking-tight">
          Turn every application into a{" "}
          <span className="text-brand-gradient">
            personalized preparation plan.
          </span>
        </h1>
        <p className="mt-5.5 max-w-[560px] text-[clamp(16px,1.5vw,19px)] leading-relaxed text-muted-foreground">
          Upload your CV, choose a target role, and analyze the job description.
          RoleReady turns it into a step-by-step plan — improve your materials,
          practise interviews, and get a clear readiness report before you apply.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={openTrial}
            className="cursor-pointer rounded-[13px] bg-brand-gradient px-[26px] py-[15px] text-base font-bold text-white shadow-[0_14px_30px_-10px_rgba(70,63,228,0.75)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-10px_rgba(70,63,228,0.85)] active:translate-y-0 active:scale-[0.985]"
          >
            Start Your Free Trial
          </button>
          <a
            href="#how"
            className="inline-flex items-center gap-2 rounded-[13px] border border-[rgba(24,30,54,0.12)] bg-white px-6 py-[15px] text-base font-bold text-[#28304a] shadow-[0_2px_8px_rgba(24,30,60,0.05)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_10px_22px_-10px_rgba(24,30,60,0.25)]"
          >
            See How It Works
            <span className="inline-flex size-[22px] items-center justify-center rounded-full bg-[rgba(46,91,240,0.1)] font-extrabold text-brand-blue">
              ↓
            </span>
          </a>
        </div>
        <div className="mt-8.5 flex flex-wrap gap-5.5 text-[13px] font-semibold text-[#4a5167]">
          <span className="flex items-center gap-2">
            <span className="size-[7px] rounded-full bg-success" />
            No card required to start
          </span>
          <span className="flex items-center gap-2">
            <span className="size-[7px] rounded-full bg-brand-blue" />
            Your documents stay private
          </span>
          <span className="flex items-center gap-2">
            <span className="size-[7px] rounded-full bg-brand-purple" />
            Grounded in your real CV
          </span>
        </div>
      </div>

      <div className="relative min-w-[280px] flex-1 animate-rr-rise-delayed sm:min-w-[340px]">
        <div className="absolute -inset-3.5 rounded-[32px] bg-[linear-gradient(140deg,rgba(46,91,240,0.18),rgba(123,63,228,0.16))] blur-[30px]" />
        <div className="relative rounded-3xl border border-border bg-white p-5 shadow-[0_30px_70px_-30px_rgba(24,30,60,0.4)]">
          <div className="flex items-center gap-3 border-b border-[rgba(24,30,54,0.07)] pb-4">
            <span className="flex size-11 items-center justify-center rounded-[13px] bg-brand-gradient text-base font-extrabold text-white">
              AR
            </span>
            <div className="flex-1">
              <div className="text-[15px] font-bold">Aisha Rahman</div>
              <div className="font-mono text-[12.5px] text-[#7b8196]">
                Target · Junior Product Manager
              </div>
            </div>
            <span className="rounded-full bg-[rgba(22,163,116,0.1)] px-2.5 py-1 font-mono text-[11px] font-semibold text-success">
              ON TRACK
            </span>
          </div>

          <div className="mt-4.5 flex flex-wrap items-center gap-4">
            <div
              className="flex size-28 shrink-0 items-center justify-center rounded-full"
              style={{
                background:
                  "conic-gradient(#2E5BF0 0turn, #7B3FE4 0.78turn, rgba(24,30,54,0.08) 0.78turn)",
              }}
            >
              <div className="flex size-[84px] flex-col items-center justify-center rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(24,30,54,0.05)]">
                <span className="text-[26px] leading-none font-extrabold tracking-tight">
                  78<span className="text-sm text-[#8a90a3]">%</span>
                </span>
                <span className="mt-0.5 font-mono text-[9px] font-semibold tracking-wider text-[#8a90a3]">
                  READINESS
                </span>
              </div>
            </div>
            <div className="flex min-w-[150px] flex-1 flex-col gap-2">
              <div className="rounded-xl border border-[rgba(24,30,54,0.06)] bg-[#f7f8fc] px-3 py-2.5">
                <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                  <span>CV score</span>
                  <span className="text-foreground">82 / 100</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[rgba(24,30,54,0.08)]">
                  <div className="h-full w-[82%] rounded-full bg-brand-gradient" />
                </div>
              </div>
              <div className="rounded-xl border border-[rgba(24,30,54,0.06)] bg-[#f7f8fc] px-3 py-2.5">
                <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                  <span>Role match</span>
                  <span className="text-foreground">71%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[rgba(24,30,54,0.08)]">
                  <div className="h-full w-[71%] rounded-full bg-brand-gradient" />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <div className="min-w-[150px] flex-1 rounded-xl border border-[rgba(22,163,116,0.16)] bg-[rgba(22,163,116,0.06)] px-3 py-2.5">
              <div className="font-mono text-[10px] font-semibold tracking-wider text-[#12855f]">
                STRENGTHS
              </div>
              <div className="mt-1.5 text-[12.5px] leading-snug text-[#28304a]">
                Stakeholder comms · User research · Roadmapping
              </div>
            </div>
            <div className="min-w-[150px] flex-1 rounded-xl border border-[rgba(224,144,43,0.2)] bg-[rgba(224,144,43,0.07)] px-3 py-2.5">
              <div className="font-mono text-[10px] font-semibold tracking-wider text-[#b26e14]">
                PRIORITY GAPS
              </div>
              <div className="mt-1.5 text-[12.5px] leading-snug text-[#28304a]">
                Metrics ownership · SQL · A/B testing
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 font-mono text-[10px] font-semibold tracking-wider text-[#8a90a3]">
              RECOMMENDED NEXT ACTIONS
            </div>
            <div className="flex flex-col gap-1.5">
              {[
                { done: true, text: "Quantify impact on your 3 most recent roles", tag: "CV", tagColor: "text-brand-blue" },
                { done: false, text: "Practise 4 product-sense questions", tag: "INTERVIEW", tagColor: "text-brand-purple" },
                { done: false, text: "Complete numerical reasoning set 2", tag: "ASSESS", tagColor: "text-[#8a90a3]" },
              ].map((action) => (
                <div
                  key={action.text}
                  className="flex items-center gap-2.5 rounded-[10px] border border-border bg-white px-2.5 py-2 text-[12.5px] font-semibold text-[#28304a]"
                >
                  <span
                    className={
                      action.done
                        ? "flex size-[18px] items-center justify-center rounded-md bg-brand-blue text-[11px] text-white"
                        : "size-[18px] rounded-md bg-[rgba(24,30,54,0.1)]"
                    }
                  >
                    {action.done ? "✓" : null}
                  </span>
                  {action.text}
                  <span className={`ml-auto font-mono text-[10px] font-semibold ${action.tagColor}`}>
                    {action.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute -right-2 -bottom-4 flex animate-rr-float items-center gap-2.5 rounded-[14px] border border-border bg-white px-3.5 py-2.5 shadow-[0_16px_34px_-16px_rgba(24,30,60,0.4)]">
          <span className="flex size-[34px] items-center justify-center rounded-[10px] bg-[rgba(22,163,116,0.12)] font-extrabold text-[#12855f]">
            ↑
          </span>
          <div>
            <div className="text-[12.5px] font-bold">+14 pts this week</div>
            <div className="text-[11px] text-[#8a90a3]">Interview readiness</div>
          </div>
        </div>
      </div>
    </section>
  );
}