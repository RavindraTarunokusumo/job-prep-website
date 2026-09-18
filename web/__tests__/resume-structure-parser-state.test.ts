import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isGlinerStructureEnabled,
  isGlinerStructureRequested,
  isStructureParserDegraded,
  resolvePythonBin,
} from "@/lib/resume/parse-with-gliner";

const ENV_KEYS = ["RESUME_STRUCTURE_PARSER", "GLINER_PYTHON"] as const;

let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  for (const key of ENV_KEYS) delete process.env[key];
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
  vi.restoreAllMocks();
});

describe("resolvePythonBin", () => {
  it("prefers an explicit GLINER_PYTHON", () => {
    process.env.GLINER_PYTHON = "/opt/custom/python";
    expect(resolvePythonBin()).toBe("/opt/custom/python");
  });

  it("defaults to a platform-correct venv location", () => {
    const bin = resolvePythonBin();
    expect(bin).toContain(".venv-gliner");
    if (process.platform === "win32") {
      expect(bin.endsWith("python.exe")).toBe(true);
      expect(bin).toContain("Scripts");
    } else {
      expect(bin.endsWith("python")).toBe(true);
      expect(bin).toContain("bin");
    }
  });
});

describe("parser state: GLiNER disabled", () => {
  it("is neither requested nor enabled", () => {
    process.env.RESUME_STRUCTURE_PARSER = "heuristic";
    expect(isGlinerStructureRequested()).toBe(false);
    expect(isGlinerStructureEnabled()).toBe(false);
  });

  it("does not flag heuristic output as degraded", () => {
    process.env.RESUME_STRUCTURE_PARSER = "heuristic";
    expect(isStructureParserDegraded("heuristic")).toBe(false);
  });
});

describe("parser state: GLiNER requested but interpreter missing", () => {
  beforeEach(() => {
    process.env.RESUME_STRUCTURE_PARSER = "gliner";
    // Unique per test so the module's warn-once latch is not order-dependent.
    process.env.GLINER_PYTHON = `/nonexistent/python-${Math.random()}`;
  });

  it("is requested but not enabled, and warns once per path", () => {
    expect(isGlinerStructureRequested()).toBe(true);
    expect(isGlinerStructureEnabled()).toBe(false);
    expect(isGlinerStructureEnabled()).toBe(false);
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(vi.mocked(console.warn).mock.calls[0][0]).toContain(
      process.env.GLINER_PYTHON
    );
  });

  it("flags heuristic output as degraded", () => {
    expect(isStructureParserDegraded("heuristic")).toBe(true);
  });
});

describe("parser state: GLiNER requested with an interpreter present", () => {
  beforeEach(() => {
    process.env.RESUME_STRUCTURE_PARSER = "gliner";
    // Any existing executable proves the existence guard, without needing a venv.
    process.env.GLINER_PYTHON = process.execPath;
  });

  it("is enabled without warning", () => {
    expect(isGlinerStructureEnabled()).toBe(true);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("does not flag gliner output as degraded", () => {
    expect(isStructureParserDegraded("gliner")).toBe(false);
  });

  it("treats a null structureParser (pre-migration row) as not degraded", () => {
    expect(isStructureParserDegraded(null)).toBe(false);
  });
});
