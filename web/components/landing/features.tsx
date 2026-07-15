export function Features() {
  return (
    <section id="features" className="mx-auto max-w-[1220px] px-6 pt-[82px] pb-5 md:px-8">
      <div className="mx-auto max-w-[660px] text-center">
        <span className="font-mono text-xs font-semibold tracking-widest text-brand-purple uppercase">
          Features
        </span>
        <h2 className="mt-3 text-[clamp(28px,3.6vw,42px)] leading-[1.08] font-extrabold tracking-tight">
          Everything the prep workflow needs
        </h2>
        <p className="mt-4 text-[17px] leading-relaxed text-muted-foreground">
          Each tool is a working part of one connected plan — not a separate app.
          Hover any card to see more.
        </p>
      </div>

      <div className="mt-11 grid auto-rows-min grid-cols-[repeat(auto-fit,minmax(268px,1fr))] gap-4.5">
        {/* CV Checker */}
        <article className="landing-feature-card relative col-span-full overflow-hidden rounded-[22px] border border-border bg-white p-6 shadow-[0_1px_3px_rgba(24,30,60,0.05)] lg:col-span-2 lg:row-span-2">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-[10px] bg-[rgba(46,91,240,0.1)] font-extrabold text-brand-blue">
              ✓
            </span>
            <h3 className="text-[17px] font-bold">CV / Resume Checker</h3>
            <span className="ml-auto rounded-full bg-[rgba(229,72,77,0.09)] px-2 py-1 font-mono text-[10px] font-semibold text-danger">
              2 ATS RISKS
            </span>
          </div>
          <p className="mt-3 text-[13.5px] leading-snug text-[#616984]">
            ATS-risk detection, structural feedback, visual highlighting, and
            editable rewrites grounded in what you actually did.
          </p>
          <div className="mt-4 rounded-[14px] border border-[rgba(24,30,54,0.06)] bg-[#f7f8fc] p-4 text-[12.5px] leading-relaxed text-[#3a4159]">
            <div className="mb-2 font-mono text-[10px] font-semibold text-[#8a90a3]">
              EXPERIENCE · PRODUCT INTERN
            </div>
            <p className="mb-1.5 inline rounded-[5px] bg-[rgba(229,72,77,0.12)] px-1 py-0.5">
              Worked on the mobile app and helped the team ship features.
            </p>
            <div className="my-2 flex items-center gap-1.5 text-[11px] font-semibold text-[#b26e14]">
              <span className="shrink-0">↳ suggested rewrite</span>
              <span className="h-px flex-1 bg-[rgba(24,30,54,0.1)]" />
            </div>
            <p className="inline rounded-[5px] bg-[rgba(22,163,116,0.12)] px-1 py-0.5">
              Shipped 4 features to 40k users; cut onboarding drop-off 18% via 3
              A/B tests.
            </p>
          </div>
          <div className="mt-3.5 flex flex-wrap gap-1.5">
            {[
              { label: "Structure ✓", warn: false },
              { label: "Action verbs ✓", warn: false },
              { label: "Add metrics ⚠", warn: true },
              { label: "Template ✓", warn: false },
            ].map((tag) => (
              <span
                key={tag.label}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  tag.warn
                    ? "bg-[rgba(224,144,43,0.1)] text-[#b26e14]"
                    : "bg-[#f1f2f8] text-[#616984]"
                }`}
              >
                {tag.label}
              </span>
            ))}
          </div>
        </article>

        {/* JD Match */}
        <article className="landing-feature-card col-span-full rounded-[22px] border border-border bg-white p-6 shadow-[0_1px_3px_rgba(24,30,60,0.05)] lg:col-span-2">
          <div className="flex flex-wrap items-center gap-4">
            <div
              className="flex size-[78px] shrink-0 items-center justify-center rounded-full"
              style={{
                background:
                  "conic-gradient(#7B3FE4 0turn, #2E5BF0 0.71turn, rgba(24,30,54,0.08) 0.71turn)",
              }}
            >
              <div className="flex size-[58px] items-center justify-center rounded-full bg-white text-[19px] font-extrabold">
                71<span className="text-[11px] text-[#8a90a3]">%</span>
              </div>
            </div>
            <div className="min-w-[180px] flex-1">
              <h3 className="text-base font-bold">Job Description Match</h3>
              <p className="mt-1.5 text-[13px] leading-snug text-[#616984]">
                Your profile and CV, compared against the posting&apos;s
                requirements, keywords, and evidence.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <div className="min-w-[130px] flex-1 rounded-[11px] border border-[rgba(22,163,116,0.16)] bg-[rgba(22,163,116,0.06)] px-3 py-2.5">
              <div className="font-mono text-[10px] font-semibold text-[#12855f]">
                MATCHED · 12
              </div>
              <div className="mt-1 text-xs leading-snug text-[#28304a]">
                Roadmapping, user research, agile, comms
              </div>
            </div>
            <div className="min-w-[130px] flex-1 rounded-[11px] border border-[rgba(229,72,77,0.16)] bg-[rgba(229,72,77,0.05)] px-3 py-2.5">
              <div className="font-mono text-[10px] font-semibold text-[#c93d42]">
                MISSING · 4
              </div>
              <div className="mt-1 text-xs leading-snug text-[#28304a]">
                SQL, experimentation, metrics ownership
              </div>
            </div>
          </div>
        </article>

        {/* Cover Letter */}
        <article className="landing-feature-card rounded-[22px] border border-border bg-white p-5.5 shadow-[0_1px_3px_rgba(24,30,60,0.05)]">
          <span className="flex size-[34px] items-center justify-center rounded-[10px] bg-[rgba(123,63,228,0.1)] font-extrabold text-brand-purple">
            ✎
          </span>
          <h3 className="mt-3.5 text-base font-bold">Cover Letter Assistant</h3>
          <p className="mt-1.5 text-[13px] leading-snug text-[#616984]">
            Tailored, editable drafts grounded in your real experience — never
            invented.
          </p>
          <div className="mt-3 rounded-[11px] border border-[rgba(24,30,54,0.06)] bg-[#f7f8fc] p-2.5 text-[11.5px] leading-relaxed text-[#4a5167]">
            Dear Hiring Team,
            <br />
            My work redesigning onboarding for 40k users maps directly to your
            focus on activation…
            <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-brand-blue align-middle" />
          </div>
        </article>

        {/* Aptitude */}
        <article className="landing-feature-card rounded-[22px] border border-border bg-white p-5.5 shadow-[0_1px_3px_rgba(24,30,60,0.05)]">
          <span className="flex size-[34px] items-center justify-center rounded-[10px] bg-[rgba(46,91,240,0.1)] font-extrabold text-brand-blue">
            ▦
          </span>
          <h3 className="mt-3.5 text-base font-bold">Aptitude & Assessment</h3>
          <p className="mt-1.5 text-[13px] leading-snug text-[#616984]">
            Practice with explanations — preparatory, never an official test.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            {["Numerical", "Verbal", "Logical", "Situational"].map((label) => (
              <span
                key={label}
                className="rounded-lg bg-[#f1f2f8] px-2 py-1.5 text-[11px] font-semibold text-[#3a4159]"
              >
                {label}
              </span>
            ))}
          </div>
        </article>

        {/* Mock Interviews */}
        <article className="landing-feature-card col-span-full rounded-[22px] border border-white/8 bg-[linear-gradient(140deg,#1E2340,#2A2E52)] p-6 text-[#eaecf6] shadow-[0_1px_3px_rgba(24,30,60,0.05)] lg:col-span-2">
          <div className="flex items-center gap-2.5">
            <span className="flex size-[34px] items-center justify-center rounded-[10px] bg-[rgba(123,63,228,0.28)] font-extrabold text-[#c9b6ff]">
              ◎
            </span>
            <h3 className="text-base font-bold text-white">Text-Based Mock Interviews</h3>
            <span className="ml-auto rounded-full bg-[rgba(123,63,228,0.25)] px-2 py-1 font-mono text-[10px] font-semibold text-[#c9b6ff]">
              STAR
            </span>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            <div className="max-w-[88%] rounded-[11px_11px_11px_3px] bg-white/6 px-3 py-2.5 text-[12.5px] leading-snug">
              Tell me about a time you influenced a decision without authority.
            </div>
            <div className="max-w-[88%] self-end rounded-[11px_11px_3px_11px] border border-[rgba(120,150,255,0.3)] bg-[rgba(46,91,240,0.28)] px-3 py-2.5 text-[12.5px] leading-snug">
              During my internship I noticed onboarding drop-off, so I…
            </div>
            <div className="mt-0.5 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-[rgba(22,163,116,0.2)] px-2 py-0.5 text-[10.5px] font-semibold text-[#8cf0c4]">
                ✓ Clear Situation
              </span>
              <span className="rounded-full bg-[rgba(224,144,43,0.2)] px-2 py-0.5 text-[10.5px] font-semibold text-[#ffd79a]">
                ⚠ Quantify Result
              </span>
            </div>
          </div>
        </article>

        {/* Prep Plan */}
        <article className="landing-feature-card rounded-[22px] border border-border bg-white p-5.5 shadow-[0_1px_3px_rgba(24,30,60,0.05)]">
          <span className="flex size-[34px] items-center justify-center rounded-[10px] bg-[rgba(123,63,228,0.1)] font-extrabold text-brand-purple">
            ◈
          </span>
          <h3 className="mt-3.5 text-base font-bold">Preparation Plan</h3>
          <p className="mt-1.5 text-[13px] leading-snug text-[#616984]">
            Prioritized actions across CV, materials, interviews, and skills gaps.
          </p>
          <div className="mt-3 flex flex-col gap-1.5">
            {[
              { done: true, text: "CV metrics", status: "DONE", statusColor: "text-success" },
              { done: false, text: "Product sense", status: "NEXT", statusColor: "text-[#8a90a3]" },
              { done: false, text: "SQL basics", status: null, statusColor: "" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2 text-xs font-semibold text-[#3a4159]">
                <span
                  className={
                    item.done
                      ? "flex size-3.5 items-center justify-center rounded bg-brand-blue text-[9px] text-white"
                      : "size-3.5 rounded bg-[rgba(24,30,54,0.12)]"
                  }
                >
                  {item.done ? "✓" : null}
                </span>
                {item.text}
                {item.status && (
                  <span className={`ml-auto font-mono text-[9px] font-semibold ${item.statusColor}`}>
                    {item.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        </article>

        {/* Performance Report */}
        <article className="landing-feature-card col-span-full rounded-[22px] border border-border bg-white p-6 shadow-[0_1px_3px_rgba(24,30,60,0.05)] lg:col-span-2">
          <div className="flex items-center gap-2.5">
            <span className="flex size-[34px] items-center justify-center rounded-[10px] bg-[rgba(46,91,240,0.1)] font-extrabold text-brand-blue">
              ▲
            </span>
            <h3 className="text-base font-bold">Performance Report</h3>
            <span className="ml-auto font-mono text-[10px] font-semibold text-[#8a90a3]">
              UPDATED TODAY
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-5.5">
            {[
              { label: "CV READINESS", score: "82" },
              { label: "INTERVIEW", score: "76" },
              { label: "ASSESSMENTS", score: "68" },
            ].map((stat) => (
              <div key={stat.label} className="min-w-[110px] flex-1">
                <div className="font-mono text-[10px] font-semibold text-[#8a90a3]">
                  {stat.label}
                </div>
                <div className="mt-0.5 text-[22px] font-extrabold">
                  {stat.score}
                  <span className="text-xs text-[#8a90a3]">/100</span>
                </div>
              </div>
            ))}
            <div className="min-w-[150px] flex-2 self-center">
              <div className="flex h-[46px] items-end gap-1.5">
                {[40, 55, 50, 72, 88].map((h, i) => (
                  <span
                    key={h}
                    className="flex-1 rounded-t"
                    style={{
                      height: `${h}%`,
                      background:
                        i === 4
                          ? "linear-gradient(180deg, #2E5BF0, #7B3FE4)"
                          : `rgba(46, 91, 240, ${0.3 + i * 0.075})`,
                    }}
                  />
                ))}
              </div>
              <div className="mt-1.5 text-right font-mono text-[10px] font-semibold text-[#8a90a3]">
                READINESS OVER 5 WEEKS
              </div>
            </div>
          </div>
        </article>

        {/* Privacy */}
        <article className="landing-feature-card rounded-[22px] border border-border bg-white p-5.5 shadow-[0_1px_3px_rgba(24,30,60,0.05)]">
          <span className="flex size-[34px] items-center justify-center rounded-[10px] bg-[rgba(22,163,116,0.12)] font-extrabold text-[#12855f]">
            ⛨
          </span>
          <h3 className="mt-3.5 text-base font-bold">Privacy & Control</h3>
          <p className="mt-1.5 text-[13px] leading-snug text-[#616984]">
            Clear consent, protected documents, and export or deletion any time.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#28304a]">
              Share CV externally
              <span className="relative ml-auto h-[19px] w-[34px] rounded-full bg-[rgba(24,30,54,0.15)]">
                <i className="absolute top-0.5 left-0.5 size-[15px] rounded-full bg-white" />
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#28304a]">
              Store documents
              <span className="relative ml-auto h-[19px] w-[34px] rounded-full bg-success">
                <i className="absolute top-0.5 right-0.5 size-[15px] rounded-full bg-white" />
              </span>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}