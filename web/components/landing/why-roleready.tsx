const reasons = [
  {
    title: "Grounded in your CV",
    description:
      "Recommendations reference your real experience and the target role.",
  },
  {
    title: "Editable AI drafts",
    description:
      "You review and edit everything. No invented experience or qualifications.",
  },
  {
    title: "Private by design",
    description:
      "Your career documents are protected, with export and deletion in your control.",
  },
  {
    title: "Practice, not tests",
    description:
      "Assessments are preparatory — never clinical or official employer tests.",
  },
] as const;

export function WhyRoleReady() {
  return (
    <section className="mx-auto max-w-[1220px] px-6 pt-[82px] pb-5 md:px-8">
      <div className="relative overflow-hidden rounded-[26px] bg-[linear-gradient(150deg,#1B2140,#2A2450)] px-8 py-8 text-[#eaecf6] md:px-14 md:py-14">
        <div className="pointer-events-none absolute -top-15 -right-15 size-[280px] rounded-full bg-[radial-gradient(circle,rgba(123,63,228,0.4),transparent_70%)]" />
        <div className="relative max-w-[620px]">
          <span className="font-mono text-xs font-semibold tracking-widest text-[#c9b6ff] uppercase">
            Why RoleReady
          </span>
          <h2 className="mt-3 text-[clamp(26px,3.4vw,38px)] leading-tight font-extrabold tracking-tight text-white">
            Structured, explainable guidance — not generic advice
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[#b9beda]">
            Every recommendation is tied to your CV and target role, so you
            always know why it matters and what to change.
          </p>
        </div>
        <div className="relative mt-8.5 grid grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-3.5">
          {reasons.map((reason) => (
            <div
              key={reason.title}
              className="rounded-2xl border border-white/9 bg-white/5 p-4.5"
            >
              <span className="font-extrabold text-[#8cf0c4]">✓</span>
              <div className="mt-2 text-[14.5px] font-bold">{reason.title}</div>
              <div className="mt-1 text-[12.5px] leading-snug text-[#a7adcb]">
                {reason.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}