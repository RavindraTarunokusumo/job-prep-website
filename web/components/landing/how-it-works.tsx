const steps = [
  {
    num: "01",
    label: "UPLOAD",
    color: "blue" as const,
    title: "Upload your CV & build your profile",
    description:
      "Drop in your CV and complete a short career profile — experience, education, and the direction you want to grow.",
    extra: (
      <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-dashed border-[rgba(46,91,240,0.3)] bg-[#f7f8fc] p-3.5">
        <span className="relative h-10 w-8 shrink-0 rounded-md border border-[rgba(24,30,54,0.12)] bg-white">
          <i className="absolute top-2 right-1.5 left-1.5 h-0.5 rounded-sm bg-[rgba(24,30,54,0.15)] shadow-[0_5px_0_rgba(24,30,54,0.12),0_10px_0_rgba(24,30,54,0.09)]" />
        </span>
        <div className="text-xs">
          <div className="font-bold">Aisha_Rahman_CV.pdf</div>
          <div className="font-mono text-[10.5px] text-[#8a90a3]">Parsed · 2 pages</div>
        </div>
      </div>
    ),
  },
  {
    num: "02",
    label: "TARGET",
    color: "purple" as const,
    title: "Choose a role or paste a job description",
    description:
      "Select a target role or paste any job posting. We extract the real requirements, keywords, and success signals.",
    extra: (
      <div className="mt-4 rounded-xl border border-[rgba(24,30,54,0.06)] bg-[#f7f8fc] p-3">
        <div className="font-mono text-[10px] font-semibold text-[#8a90a3]">TARGET ROLE</div>
        <div className="mt-1 text-[13px] font-bold">Junior Product Manager</div>
        <div className="mt-2 flex flex-wrap gap-1">
          {["Roadmapping", "Analytics", "Stakeholders"].map((tag, i) => (
            <span
              key={tag}
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                i < 2
                  ? "bg-[rgba(46,91,240,0.09)] text-[#2450d8]"
                  : "bg-[rgba(123,63,228,0.09)] text-[#6a2fd8]"
              }`}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    ),
  },
  {
    num: "03",
    label: "PLAN",
    color: "blue" as const,
    title: "Receive a personalized plan",
    description:
      "A prioritized plan tailored to the gap between your profile and the role — with clear, explainable reasons.",
    extra: (
      <div className="mt-4 flex flex-col gap-1.5">
        {[
          { done: true, text: "Strengthen CV metrics", priority: "HIGH", priorityColor: "text-danger" },
          { done: false, text: "Draft tailored cover letter", priority: "MED", priorityColor: "text-warning" },
          { done: false, text: "Interview: product sense", priority: "MED", priorityColor: "text-warning" },
        ].map((item) => (
          <div key={item.text} className="flex items-center gap-2 text-xs font-semibold text-[#28304a]">
            <span
              className={
                item.done
                  ? "flex size-[15px] items-center justify-center rounded-[5px] bg-brand-blue text-[9px] text-white"
                  : "size-[15px] rounded-[5px] bg-[rgba(24,30,54,0.12)]"
              }
            >
              {item.done ? "✓" : null}
            </span>
            {item.text}
            <span className={`ml-auto font-mono text-[10px] font-semibold ${item.priorityColor}`}>
              {item.priority}
            </span>
          </div>
        ))}
      </div>
    ),
  },
  {
    num: "04",
    label: "TRACK",
    color: "purple" as const,
    title: "Practise, improve & track readiness",
    description:
      "Run mock interviews and assessments, apply edits, and watch your readiness score climb over time.",
    extra: (
      <div className="mt-4 rounded-xl border border-[rgba(24,30,54,0.06)] bg-[#f7f8fc] px-3 py-3">
        <div className="flex justify-between font-mono text-[11px] text-[#8a90a3]">
          <span>W1</span><span>W2</span><span>W3</span><span>W4</span>
        </div>
        <div className="mt-2 flex h-11 items-end gap-2">
          {[42, 58, 74, 92].map((h, i) => (
            <span
              key={h}
              className="flex-1 rounded-t-[5px]"
              style={{
                height: `${h}%`,
                background:
                  i === 3
                    ? "linear-gradient(180deg, #2E5BF0, #7B3FE4)"
                    : `rgba(46, 91, 240, ${0.25 + i * 0.15})`,
              }}
            />
          ))}
        </div>
      </div>
    ),
  },
] as const;

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-[1220px] px-6 pt-20 pb-5 md:px-8">
      <div className="mx-auto max-w-[640px] text-center">
        <span className="font-mono text-xs font-semibold tracking-widest text-brand-blue uppercase">
          How It Works
        </span>
        <h2 className="mt-3 text-[clamp(28px,3.6vw,42px)] leading-[1.08] font-extrabold tracking-tight">
          A clear path from CV to offer-ready
        </h2>
        <p className="mt-4 text-[17px] leading-relaxed text-muted-foreground">
          Four steps that turn scattered job hunting into a structured, trackable
          preparation routine.
        </p>
      </div>

      <div className="mt-11 grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-4.5">
        {steps.map((step) => (
          <div
            key={step.num}
            className="rounded-[20px] border border-border bg-white p-6 shadow-[0_1px_3px_rgba(24,30,60,0.05)]"
          >
            <div className="flex items-center justify-between">
              <span
                className={`flex size-11 items-center justify-center rounded-[13px] font-mono text-base font-extrabold ${
                  step.color === "blue"
                    ? "bg-[rgba(46,91,240,0.1)] text-brand-blue"
                    : "bg-[rgba(123,63,228,0.1)] text-brand-purple"
                }`}
              >
                {step.num}
              </span>
              <span className="font-mono text-[11px] font-semibold text-[#c3c7d4]">
                {step.label}
              </span>
            </div>
            <h3 className="mt-4.5 text-[17px] font-bold">{step.title}</h3>
            <p className="mt-2 text-[13.5px] leading-snug text-[#616984]">
              {step.description}
            </p>
            {step.extra}
          </div>
        ))}
      </div>
    </section>
  );
}