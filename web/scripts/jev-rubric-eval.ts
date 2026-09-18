/**
 * Offline evaluation of the Jev rubric against the synthetic CV corpus.
 *
 * Not a unit test and not run by `npm test`: it makes live TypeSafe calls.
 *
 * Usage (from web/):
 *   npm run eval:jev-rubric
 *   npx tsx scripts/jev-rubric-eval.ts
 *
 * Requires TYPESAFE_API_KEY. Reports, per CV, the expected band against the
 * actual score, per-dimension confidence and full probability distribution,
 * latency and input-token cost, then the four acceptance signals from the spec:
 * ordering, discrimination on the adversarial pairs, calibration on the
 * ambiguous fixtures, and stability across repeat runs.
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import { estimateJevCostUsd } from "../lib/ai/jev";
import {
  RESUME_RUBRIC_DIMENSIONS,
  scoreResumeRubric,
  type ResumeRubricResult,
} from "../lib/ai/resume-rubric";

const RUNS_PER_CV = 3;
const CORPUS_DIR = path.join(
  process.cwd(),
  "__tests__",
  "fixtures",
  "cvs",
);

type Manifest = {
  bands: Record<string, [number, number]>;
  fixtures: Array<{
    file: string;
    expectedBand: string;
    expectedRank: number;
    ambiguous: boolean;
    notes: string;
    pair: { id: string; dimension: string; side: "high" | "low" } | null;
  }>;
};

function loadManifest(): Manifest {
  const manifest = JSON.parse(
    readFileSync(path.join(CORPUS_DIR, "manifest.json"), "utf8"),
  ) as Manifest;

  const onDisk = new Set(
    readdirSync(CORPUS_DIR).filter((name) => name.endsWith(".txt")),
  );
  for (const fixture of manifest.fixtures) {
    if (!onDisk.has(fixture.file)) {
      throw new Error(`Manifest lists ${fixture.file}, which is not on disk.`);
    }
    onDisk.delete(fixture.file);
  }
  if (onDisk.size > 0) {
    throw new Error(
      `Corpus files missing from manifest.json: ${[...onDisk].join(", ")}`,
    );
  }
  return manifest;
}

function bandFor(manifest: Manifest, score: number): string {
  for (const [band, [low, high]] of Object.entries(manifest.bands)) {
    if (score >= low && score <= high) return band;
  }
  return "out-of-range";
}

function mean(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function fmt(value: number, digits = 2): string {
  return value.toFixed(digits);
}

function reportRun(result: ResumeRubricResult): void {
  for (const dimension of result.dimensions) {
    const distribution = Object.entries(dimension.probabilities)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([level, p]) => `${level}:${fmt(p)}`)
      .join(" ");
    console.log(
      `      ${dimension.id.padEnd(18)} level=${fmt(dimension.level)} ` +
        `score=${String(dimension.score).padStart(3)} ` +
        `conf=${fmt(dimension.confidence)} [${distribution}]`,
    );
  }
}

async function main(): Promise<void> {
  if (!process.env.TYPESAFE_API_KEY) {
    console.error(
      [
        "TYPESAFE_API_KEY is not set, so the Jev rubric evaluation cannot run.",
        "",
        "This harness makes live calls to https://api.typesafe.ai/v1/systemone.",
        "Set the key and re-run, for example:",
        "",
        "  TYPESAFE_API_KEY=sk-... npm run eval:jev-rubric",
        "",
        "or add TYPESAFE_API_KEY to web/.env.local.",
      ].join("\n"),
    );
    process.exitCode = 1;
    return;
  }

  const manifest = loadManifest();
  const byFile = new Map<string, ResumeRubricResult[]>();

  for (const fixture of manifest.fixtures) {
    const cvText = readFileSync(path.join(CORPUS_DIR, fixture.file), "utf8");
    const runs: ResumeRubricResult[] = [];

    console.log(`\n${fixture.file}`);
    console.log(
      `  expected: ${fixture.expectedBand} (rank ${fixture.expectedRank})` +
        `${fixture.ambiguous ? " [ambiguous]" : ""}` +
        `${fixture.pair ? ` [pair ${fixture.pair.id}/${fixture.pair.side} on ${fixture.pair.dimension}]` : ""}`,
    );

    for (let run = 1; run <= RUNS_PER_CV; run++) {
      const result = await scoreResumeRubric(cvText, { userId: null });
      runs.push(result);
      console.log(
        `    run ${run}: overall=${result.overallScore} ` +
          `band=${bandFor(manifest, result.overallScore)} ` +
          `latency=${result.latencyMs}ms ` +
          `cost=$${fmt(estimateJevCostUsd(result.usage.inputTokens), 5)} ` +
          `(in=${result.usage.inputTokens} out=${result.usage.outputTokens})`,
      );
      reportRun(result);
    }

    byFile.set(fixture.file, runs);
  }

  console.log("\n=== Ordering (expected rank vs mean overall score) ===");
  const ordered = [...manifest.fixtures]
    .map((fixture) => ({
      fixture,
      score: mean(byFile.get(fixture.file)!.map((r) => r.overallScore)),
    }))
    .sort((a, b) => b.score - a.score);
  ordered.forEach((row, index) => {
    console.log(
      `  actual #${String(index + 1).padStart(2)}  expected #${String(row.fixture.expectedRank).padStart(2)}  ` +
        `${fmt(row.score, 1).padStart(5)}  ${bandFor(manifest, Math.round(row.score)).padEnd(9)} ` +
        `expected ${row.fixture.expectedBand.padEnd(9)} ${row.fixture.file}`,
    );
  });

  console.log("\n=== Discrimination (adversarial pairs, per dimension) ===");
  const pairs = new Map<string, typeof manifest.fixtures>();
  for (const fixture of manifest.fixtures) {
    if (!fixture.pair) continue;
    const bucket = pairs.get(fixture.pair.id) ?? [];
    bucket.push(fixture);
    pairs.set(fixture.pair.id, bucket);
  }
  for (const [id, members] of pairs) {
    const high = members.find((m) => m.pair?.side === "high");
    const low = members.find((m) => m.pair?.side === "low");
    if (!high || !low) {
      console.log(`  ${id}: incomplete pair in manifest`);
      continue;
    }
    const target = high.pair!.dimension;
    console.log(`  pair ${id} (target dimension: ${target})`);
    for (const dimension of RESUME_RUBRIC_DIMENSIONS) {
      const highLevel = mean(
        byFile
          .get(high.file)!
          .map((r) => r.dimensions.find((d) => d.id === dimension.id)!.level),
      );
      const lowLevel = mean(
        byFile
          .get(low.file)!
          .map((r) => r.dimensions.find((d) => d.id === dimension.id)!.level),
      );
      const flag = dimension.id === target ? "<- target" : "";
      console.log(
        `    ${dimension.id.padEnd(18)} high=${fmt(highLevel)} low=${fmt(lowLevel)} ` +
          `delta=${fmt(highLevel - lowLevel)} ${flag}`,
      );
    }
  }

  console.log("\n=== Calibration (mean confidence) ===");
  for (const group of ["ambiguous", "unambiguous"] as const) {
    const files = manifest.fixtures
      .filter((f) => (group === "ambiguous" ? f.ambiguous : !f.ambiguous))
      .map((f) => f.file);
    const confidences = files.flatMap((file) =>
      byFile.get(file)!.flatMap((r) => r.dimensions.map((d) => d.confidence)),
    );
    console.log(
      `  ${group.padEnd(12)} n=${String(confidences.length).padStart(3)} mean=${fmt(mean(confidences))}`,
    );
  }

  console.log("\n=== Stability (max ordinal spread across runs) ===");
  for (const fixture of manifest.fixtures) {
    const runs = byFile.get(fixture.file)!;
    const spreads = RESUME_RUBRIC_DIMENSIONS.map((dimension) => {
      const levels = runs.map(
        (r) => r.dimensions.find((d) => d.id === dimension.id)!.level,
      );
      return {
        id: dimension.id,
        spread: Math.max(...levels) - Math.min(...levels),
      };
    });
    const worst = spreads.reduce((a, b) => (b.spread > a.spread ? b : a));
    console.log(
      `  ${fixture.file.padEnd(40)} worst=${fmt(worst.spread)} (${worst.id})` +
        `${worst.spread > 1 ? "  FAIL: >1 level" : ""}`,
    );
  }

  const totalCost = [...byFile.values()]
    .flat()
    .reduce((sum, r) => sum + estimateJevCostUsd(r.usage.inputTokens), 0);
  console.log(
    `\nTotal: ${manifest.fixtures.length} CVs x ${RUNS_PER_CV} runs, ` +
      `estimated input cost $${fmt(totalCost, 4)}.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
