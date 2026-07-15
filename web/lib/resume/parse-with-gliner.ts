import { spawn } from "node:child_process";
import path from "node:path";
import {
  emptyParsedResume,
  parsedResumeSchema,
  type ParsedResume,
} from "@/lib/validation/resume";

export type GlinerParseResult =
  | { ok: true; data: ParsedResume; raw?: unknown }
  | { ok: false; error: string };

/**
 * Optional GLiNER2 structure step (Python sidecar).
 *
 * Enable with RESUME_STRUCTURE_PARSER=gliner
 * Optional: GLINER_PYTHON=/path/to/python  (default: <repo>/.venv-gliner/bin/python)
 * Optional: GLINER_MODEL=fastino/gliner2-base-v1
 * Optional: GLINER_MODE=json|entities  (default json)
 */
export function isGlinerStructureEnabled(): boolean {
  const value = (process.env.RESUME_STRUCTURE_PARSER ?? "").toLowerCase();
  return value === "gliner" || value === "gliner2";
}

function resolvePythonBin(): string {
  if (process.env.GLINER_PYTHON) {
    return process.env.GLINER_PYTHON;
  }
  // web/ -> repo root
  return path.resolve(process.cwd(), "..", ".venv-gliner", "bin", "python");
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
        const { meta: _meta, ...formFields } = parsedJson;
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
