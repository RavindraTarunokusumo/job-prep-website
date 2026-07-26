import { describe, expect, it } from "vitest";
import { applyRewriteSuggestion, rejectRewrite } from "@/lib/cv/rewrite-guards";
import { buildPdfBytes, isPdfBytes } from "@/lib/cv/pdf";
import {
  buildSourceFingerprint,
  compareCvVersions,
  createInitialVersionPayload,
  duplicateVersionContent,
  isVersionOutdated,
  selectCurrentVersionId,
} from "@/lib/cv/versioning";
import {
  emptyStructuredCv,
  parseStructuredCv,
  type StructuredCv,
} from "@/lib/validation/cv";

function sampleCv(verified = true): StructuredCv {
  return parseStructuredCv({
    contact: { name: "Alex Example", email: "alex@example.com" },
    summary: "Backend engineer",
    experience: [
      {
        company: "Acme",
        title: "Engineer",
        startDate: "2020-01",
        endDate: "2024-01",
        description: "Built APIs",
        bullets: ["Shipped payments API"],
        verified,
      },
    ],
    education: [],
    skills: ["TypeScript", "Postgres"],
    projects: [],
    certifications: [],
    languages: ["English"],
  });
}

describe("rewrite guards", () => {
  it("refuses silent mutation of verified company", () => {
    const content = sampleCv(true);
    const r = applyRewriteSuggestion(content, {
      path: "experience.0.company",
      proposedText: "FakeCorp",
      force: false,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/verified/i);
    // original unchanged
    expect(content.experience[0].company).toBe("Acme");
  });

  it("allows bullet rewrite on verified experience", () => {
    const content = sampleCv(true);
    const r = applyRewriteSuggestion(content, {
      path: "experience.0.bullets.0",
      proposedText: "Shipped payments API serving 1M requests/day",
      force: false,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.content.experience[0].bullets?.[0]).toMatch(/1M/);
      expect(r.content.experience[0].company).toBe("Acme");
    }
  });

  it("refuses silent mutation of verified description", () => {
    const content = sampleCv(true);
    const r = applyRewriteSuggestion(content, {
      path: "experience.0.description",
      proposedText: "Invented responsibilities",
      force: false,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/verified/i);
  });

  it("allows verified field change only with force", () => {
    const content = sampleCv(true);
    const r = applyRewriteSuggestion(content, {
      path: "experience.0.startDate",
      proposedText: "2019-01",
      force: true,
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.content.experience[0].startDate).toBe("2019-01");
  });

  it("rejectRewrite returns clone without changes", () => {
    const content = sampleCv();
    const r = rejectRewrite(content);
    expect(r.applied).toBe(false);
    expect(r.content.summary).toBe(content.summary);
  });
});

describe("version lifecycle helpers", () => {
  it("duplicates content deeply", () => {
    const a = sampleCv();
    const b = duplicateVersionContent(a);
    b.summary = "Changed";
    expect(a.summary).toBe("Backend engineer");
  });

  it("detects outdated fingerprint", () => {
    expect(isVersionOutdated("p:1|e:|n:0", "p:2|e:|n:0")).toBe(true);
    expect(isVersionOutdated("same", "same")).toBe(false);
    expect(isVersionOutdated(null, "x")).toBe(false);
  });

  it("buildSourceFingerprint is stable for same inputs", () => {
    const fp = buildSourceFingerprint({
      profileUpdatedAt: "2026-07-01T00:00:00.000Z",
      evidenceUpdatedAtMax: "2026-07-02T00:00:00.000Z",
      confirmedEvidenceCount: 3,
    });
    expect(fp).toContain("n:3");
    expect(
      buildSourceFingerprint({
        profileUpdatedAt: "2026-07-01T00:00:00.000Z",
        evidenceUpdatedAtMax: "2026-07-02T00:00:00.000Z",
        confirmedEvidenceCount: 3,
      })
    ).toBe(fp);
  });

  it("compareCvVersions finds field diffs", () => {
    const a = sampleCv();
    const b = duplicateVersionContent(a);
    b.summary = "Updated summary";
    b.skills = ["Rust"];
    const diffs = compareCvVersions(a, b);
    expect(diffs.some((d) => d.path === "summary")).toBe(true);
    expect(diffs.some((d) => d.path === "skills")).toBe(true);
  });

  it("selectCurrentVersionId validates membership", () => {
    expect(selectCurrentVersionId(["a", "b"], "b")).toEqual({
      ok: true,
      currentId: "b",
    });
    expect(selectCurrentVersionId(["a"], "z").ok).toBe(false);
  });

  it("createInitialVersionPayload defaults empty cv", () => {
    const p = createInitialVersionPayload({ name: "v1" });
    expect(p.name).toBe("v1");
    expect(p.content).toEqual(emptyStructuredCv());
  });
});

describe("PDF export path", () => {
  it("produces non-empty PDF bytes with %PDF header", () => {
    const bytes = buildPdfBytes(sampleCv());
    expect(bytes.byteLength).toBeGreaterThan(100);
    expect(isPdfBytes(bytes)).toBe(true);
    const text = new TextDecoder().decode(bytes);
    expect(text.startsWith("%PDF")).toBe(true);
    expect(text).toContain("Alex Example");
    expect(text).toContain("Acme");
  });

  it("still produces PDF for empty content", () => {
    const bytes = buildPdfBytes(emptyStructuredCv());
    expect(isPdfBytes(bytes)).toBe(true);
    expect(bytes.byteLength).toBeGreaterThan(50);
  });
});
