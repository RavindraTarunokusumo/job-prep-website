import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  emptyParsedResume,
  parsedResumeSchema,
  type ParsedResume,
} from "@/lib/validation/resume";

/** Which parser actually produced a document's parsedData. */
export type ResumeStructureParser = "heuristic" | "gliner";

export type GlinerParseResult =
  | { ok: true; data: ParsedResume; raw?: unknown }
  | { ok: false; error: string };

/**
 * Optional GLiNER2 structure step (Python sidecar).
 *
 * Enable with RESUME_STRUCTURE_PARSER=gliner
 * Optional: GLINER_PYTHON=/path/to/python
 *   (default: <repo>/.venv-gliner/bin/python, or Scripts/python.exe on Windows)
 * Optional: GLINER_MODEL=fastino/gliner2-base-v1
 * Optional: GLINER_MODE=json|entities  (default json)
 */
/** True when the env asks for GLiNER, regardless of whether it can actually run. */
export function isGlinerStructureRequested(): boolean {
  const value = (process.env.RESUME_STRUCTURE_PARSER ?? "").toLowerCase();
  return value === "gliner" || value === "gliner2";
}

let warnedMissingInterpreter = "";

/**
 * True only when GLiNER is requested *and* its interpreter exists. A configured
 * but unreachable interpreter is reported once instead of spawning a doomed
 * process per upload.
 */
export function isGlinerStructureEnabled(): boolean {
  if (!isGlinerStructureRequested()) {
    return false;
  }

  const python = resolvePythonBin();
  if (!existsSync(python)) {
    if (warnedMissingInterpreter !== python) {
      warnedMissingInterpreter = python;
      console.warn(
        `[resume] RESUME_STRUCTURE_PARSER requests GLiNER but no Python interpreter exists at ${python}. ` +
          "Set GLINER_PYTHON to a valid interpreter or set RESUME_STRUCTURE_PARSER=heuristic. " +
          "Uploads will use the heuristic parser until this is fixed."
      );
    }
    return false;
  }

  return true;
}

/**
 * True when a document fell back to the heuristic parser while GLiNER was the
 * configured choice — the state the review UI warns about.
 */
export function isStructureParserDegraded(
  structureParser: string | null
): boolean {
  return structureParser === "heuristic" && isGlinerStructureRequested();
}

export function resolvePythonBin(): string {
  if (process.env.GLINER_PYTHON) {
    return process.env.GLINER_PYTHON;
  }
  // web/ -> repo root
  const segments =
    process.platform === "win32"
      ? ["Scripts", "python.exe"]
      : ["bin", "python"];
  return path.resolve(process.cwd(), "..", ".venv-gliner", ...segments);
}

function resolveScriptPath(): string {
  return path.resolve(process.cwd(), "..", "scripts", "gliner_resume_parse.py");
}

export async function parseResumeWithGliner(
  rawText: string
): Promise<GlinerParseResult> {
  const python = resolvePythonBin();
  const script = resolveScriptPath();
  const model = process.env.GLINER_MODEL ?? "fastino/gliner2-base-v1";
  const mode = process.env.GLINER_MODE === "entities" ? "entities" : "json";

  return new Promise((resolve) => {
    const child = spawn(
      python,
      [script, "--mode", mode, "--model", model, "--no-raw-meta"],
      { stdio: ["pipe", "pipe", "pipe"] }
    );

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", (error) => {
      resolve({
        ok: false,
        error: `Failed to start GLiNER python: ${error.message}`,
      });
    });

    child.on("close", (code) => {
      // Model load prints to stdout before JSON — take last JSON object
      const jsonStart = stdout.lastIndexOf("{");
      const payload = jsonStart >= 0 ? stdout.slice(jsonStart) : stdout;

      if (code !== 0) {
        resolve({
          ok: false,
          error:
            payload.trim() ||
            stderr.trim() ||
            `GLiNER exited with code ${code ?? "unknown"}`,
        });
        return;
      }

      try {
        const parsedJson = JSON.parse(payload) as Record<string, unknown>;
        if (parsedJson.error) {
          resolve({ ok: false, error: String(parsedJson.error) });
          return;
        }

        // Drop meta before zod (form schema doesn't include meta)
        const formFields = { ...parsedJson };
        delete formFields.meta;
        const data = parsedResumeSchema.parse({
          ...emptyParsedResume(),
          ...formFields,
          contact: {
            ...emptyParsedResume().contact,
            ...((formFields.contact as object) ?? {}),
          },
        });
        resolve({ ok: true, data, raw: parsedJson });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Invalid GLiNER JSON";
        resolve({
          ok: false,
          error: `${message}. stderr=${stderr.slice(0, 400)}`,
        });
      }
    });

    child.stdin.write(rawText);
    child.stdin.end();
  });
}
