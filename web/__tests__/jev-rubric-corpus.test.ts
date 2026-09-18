import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The eval harness performs its own manifest/disk check, but that check sits
 * behind an API-key guard and so can never run without credentials. These
 * assertions are the part that must hold regardless — the corpus is the
 * pre-registered baseline the acceptance criteria are judged against, so a
 * silent drift between manifest and disk would invalidate the evaluation.
 */

const CORPUS_DIR = path.join(__dirname, "fixtures", "cvs");

const BAND_ORDER = ["poor", "weak", "moderate", "strong", "excellent"] as const;
type Band = (typeof BAND_ORDER)[number];

type Fixture = {
  file: string;
  expectedBand: Band;
  expectedRank: number;
  ambiguous: boolean;
  notes: string;
  pair: { id: string; dimension: string; side: string } | null;
};

type Manifest = {
  description: string;
  bands: Record<Band, [number, number]>;
  fixtures: Fixture[];
};

const manifest: Manifest = JSON.parse(
  readFileSync(path.join(CORPUS_DIR, "manifest.json"), "utf8")
);

describe("CV corpus manifest", () => {
  it("lists exactly the .txt files on disk", () => {
    const onDisk = readdirSync(CORPUS_DIR)
      .filter((f) => f.endsWith(".txt"))
      .sort();
    const listed = manifest.fixtures.map((f) => f.file).sort();
    expect(listed).toEqual(onDisk);
  });

  it("covers the 12-15 CVs the spec requires", () => {
    expect(manifest.fixtures.length).toBeGreaterThanOrEqual(12);
    expect(manifest.fixtures.length).toBeLessThanOrEqual(15);
  });

  it("points every fixture at a non-empty file", () => {
    for (const fixture of manifest.fixtures) {
      const text = readFileSync(path.join(CORPUS_DIR, fixture.file), "utf8");
      expect(text.trim().length, fixture.file).toBeGreaterThan(0);
    }
  });

  it("uses only declared bands", () => {
    for (const fixture of manifest.fixtures) {
      expect(BAND_ORDER, fixture.file).toContain(fixture.expectedBand);
    }
  });

  it("never contradicts itself between expectedRank and expectedBand", () => {
    const rank = (b: Band) => BAND_ORDER.indexOf(b);
    for (const a of manifest.fixtures) {
      for (const b of manifest.fixtures) {
        if (a.expectedRank < b.expectedRank) {
          // a is ranked better, so it must not sit in a worse band.
          expect(
            rank(a.expectedBand),
            `${a.file} ranks above ${b.file} but bands below it`
          ).toBeGreaterThanOrEqual(rank(b.expectedBand));
        }
      }
    }
  });

  it("pairs adversarial fixtures two to a dimension, on opposite sides", () => {
    const pairs = new Map<string, Fixture[]>();
    for (const fixture of manifest.fixtures.filter((f) => f.pair)) {
      const id = fixture.pair!.id;
      pairs.set(id, [...(pairs.get(id) ?? []), fixture]);
    }
    expect(pairs.size).toBeGreaterThanOrEqual(2);
    for (const [id, members] of pairs) {
      expect(members.length, id).toBe(2);
      expect(new Set(members.map((m) => m.pair!.dimension)).size, id).toBe(1);
      expect(new Set(members.map((m) => m.pair!.side)).size, id).toBe(2);
    }
  });

  it("marks at least one fixture ambiguous, for the calibration criterion", () => {
    expect(manifest.fixtures.some((f) => f.ambiguous)).toBe(true);
  });
});
