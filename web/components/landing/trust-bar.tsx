const companies = ["Northgate", "Vantic", "Meridian", "Kestrel Labs", "Outfield"] as const;

export function TrustBar() {
  return (
    <div className="mx-auto max-w-[1220px] px-6 pt-6.5 pb-2 md:px-8">
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-[13px] font-semibold text-[#9096a8]">
        <span className="font-mono text-[11px] tracking-widest uppercase">
          Trusted by applicants at
        </span>
        {companies.map((name) => (
          <span
            key={name}
            className="text-[17px] font-extrabold tracking-tight text-[#b4b9c7]"
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}