export function DashboardPreview() {
  return (
    <section id="resources" className="mx-auto max-w-[1220px] px-6 pt-[82px] pb-5 md:px-8">
      <div className="mx-auto max-w-[640px] text-center">
        <span className="font-mono text-xs font-semibold tracking-widest text-brand-blue uppercase">
          One Dashboard
        </span>
        <h2 className="mt-3 text-[clamp(28px,3.6vw,42px)] leading-[1.08] font-extrabold tracking-tight">
          See it all come together
        </h2>
        <p className="mt-4 text-[17px] leading-relaxed text-muted-foreground">
          Every tool feeds one workspace, so you always know exactly where you
          stand and what to do next.
        </p>
      </div>

      <div className="mt-10 overflow-hidden rounded-3xl border border-border bg-white shadow-[0_30px_70px_-34px_rgba(24,30,60,0.35)]">
        <div className="flex flex-wrap items-center gap-3 border-b border-[rgba(24,30,54,0.07)] bg-[#fbfbff] px-5 py-4">
          <span className="flex size-10 items-center justify-center rounded-[11px] bg-brand-gradient font-extrabold text-white">
            AR
          </span>
          <div>
            <div className="text-[15px] font-bold">Aisha Rahman</div>
            <div className="font-mono text-xs text-[#8a90a3]">
              Graduate · Target: Junior Product Manager
            </div>
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <span className="rounded-[9px] border border-[rgba(24,30,54,0.1)] bg-white px-3 py-1.5 text-xs font-semibold text-[#4a5167]">
              This week
            </span>
            <span className="rounded-[9px] bg-brand-gradient px-3 py-1.5 text-xs font-bold text-white">
              + New target role
            </span>
          </div>
        </div>

        <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-4 p-5">
          <div className="flex items-center gap-4 rounded-[18px] border border-[rgba(24,30,54,0.06)] bg-[linear-gradient(150deg,#F3F5FE,#F6F1FD)] p-5">
            <div
              className="flex size-[104px] shrink-0 items-center justify-center rounded-full"
              style={{
                background:
                  "conic-gradient(#2E5BF0 0turn, #7B3FE4 0.78turn, rgba(24,30,54,0.09) 0.78turn)",
              }}
            >
              <div className="flex size-[78px] flex-col items-center justify-center rounded-full bg-white">
                <span className="text-[25px] leading-none font-extrabold">
                  78<span className="text-[13px] text-[#8a90a3]">%</span>
                </span>
                <span className="font-mono text-[9px] font-semibold text-[#8a90a3]">
                  READY
                </span>
              </div>
            </div>
            <div>
              <div className="text-[15px] font-bold">Overall readiness</div>
              <div className="mt-1 text-[12.5px] leading-snug text-[#616984]">
                Up <b className="text-[#12855f]">14 points</b> in 2 weeks. On
                track for applications in early August.
              </div>
            </div>
          </div>

          <div className="rounded-[18px] border border-border bg-white p-4.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">Current plan</span>
              <span className="font-mono text-[10px] font-semibold text-[#8a90a3]">
                3 OF 7 DONE
              </span>
            </div>
            <div className="my-2.5 h-1.5 overflow-hidden rounded-full bg-[rgba(24,30,54,0.08)]">
              <div className="h-full w-[43%] bg-brand-gradient" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[12.5px] font-semibold text-[#8a90a3] line-through">
                <span className="flex size-[15px] items-center justify-center rounded-[5px] bg-success text-[9px] text-white">
                  ✓
                </span>
                Add CV metrics
              </div>
              <div className="flex items-center gap-2 text-[12.5px] font-semibold text-[#28304a]">
                <span className="flex size-[15px] items-center justify-center rounded-[5px] bg-brand-blue text-[9px] text-white">
                  →
                </span>
                Practise product sense
                <span className="ml-auto font-mono text-[9px] font-semibold text-brand-blue">
                  TODAY
                </span>
              </div>
              <div className="flex items-center gap-2 text-[12.5px] font-semibold text-[#3a4159]">
                <span className="size-[15px] rounded-[5px] bg-[rgba(24,30,54,0.12)]" />
                Numerical set 2
              </div>
            </div>
          </div>

          <div className="rounded-[18px] border border-border bg-white p-4.5">
            <span className="text-sm font-bold">Strengths & gaps</span>
            <div className="mt-3 flex flex-col gap-2">
              {[
                { label: "Communication", status: "Strong", pct: 88, color: "#16A374", labelColor: "text-[#12855f]" },
                { label: "Product sense", status: "Building", pct: 62, color: "#2E5BF0", labelColor: "text-[#28304a]" },
                { label: "Data / SQL", status: "Priority", pct: 34, color: "#E0902B", labelColor: "text-[#b26e14]" },
              ].map((skill) => (
                <div key={skill.label}>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className={skill.labelColor}>{skill.label}</span>
                    <span className={skill.label === "Communication" ? "" : skill.labelColor}>
                      {skill.status}
                    </span>
                  </div>
                  <div className="mt-1 h-[5px] rounded-full bg-[rgba(24,30,54,0.08)]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${skill.pct}%`, background: skill.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[18px] border border-border bg-white p-4.5">
            <span className="text-sm font-bold">Upcoming practice</span>
            <div className="mt-3 flex flex-col gap-2">
              {[
                { icon: "◎", color: "purple", title: "Mock: Behavioural", time: "TODAY · 20 MIN" },
                { icon: "▦", color: "blue", title: "Numerical reasoning", time: "TOMORROW · 15 MIN" },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-center gap-2.5 rounded-[10px] bg-[#f7f8fc] px-2.5 py-2"
                >
                  <span
                    className={`flex size-[30px] items-center justify-center rounded-lg text-xs font-extrabold ${
                      item.color === "purple"
                        ? "bg-[rgba(123,63,228,0.12)] text-brand-purple"
                        : "bg-[rgba(46,91,240,0.12)] text-brand-blue"
                    }`}
                  >
                    {item.icon}
                  </span>
                  <div className="text-xs">
                    <div className="font-bold">{item.title}</div>
                    <div className="font-mono text-[10px] text-[#8a90a3]">{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="col-span-full rounded-[18px] border border-border bg-white p-4.5 lg:col-span-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">Recent results</span>
              <span className="font-mono text-[10px] font-semibold text-[#8a90a3]">
                LAST 7 DAYS
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2.5">
              {[
                { title: "CV v3 review", sub: "2 risks resolved", score: "82 / 100 ↑", color: "text-success" },
                { title: "Mock: Product sense", sub: "STAR feedback given", score: "76 / 100 ↑", color: "text-brand-blue" },
                { title: "Verbal reasoning", sub: "14 / 18 correct", score: "68 / 100", color: "text-warning" },
              ].map((result) => (
                <div
                  key={result.title}
                  className="min-w-[150px] flex-1 rounded-xl border border-[rgba(24,30,54,0.07)] p-3"
                >
                  <div className="text-xs font-bold">{result.title}</div>
                  <div className="my-0.5 text-[11px] text-[#8a90a3]">{result.sub}</div>
                  <span className={`font-mono text-xs font-bold ${result.color}`}>
                    {result.score}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}