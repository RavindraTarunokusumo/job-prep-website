import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: { aiUsageEvent: { create: vi.fn(async () => ({})) } },
}));

type FetchCall = { url: string; init: RequestInit };

function stubFetch(
  responses: Array<{ status: number; body: unknown }>,
): { fetchImpl: typeof fetch; calls: FetchCall[] } {
  const calls: FetchCall[] = [];
  let index = 0;
  const fetchImpl = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const next = responses[Math.min(index, responses.length - 1)];
    index += 1;
    return {
      ok: next.status >= 200 && next.status < 300,
      status: next.status,
      json: async () => next.body,
      text: async () => JSON.stringify(next.body),
    };
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}

/** A score answer whose probability mass sits entirely on one level. */
function scoreAnswer(level: number, confidence = 0.9) {
  const probabilities: Record<string, number> = {
    "0": 0,
    "1": 0,
    "2": 0,
    "3": 0,
    "4": 0,
  };
  probabilities[String(level)] = 1;
  return {
    type: "score",
    score: level,
    confidence,
    legend: {
      "0": "level zero",
      "1": "level one",
      "2": "level two",
      "3": "level three",
      "4": "level four",
    },
    probabilities,
  };
}

function corpusResponse(levels: Record<string, number>) {
  const answers: Record<string, unknown> = {};
  for (const [id, level] of Object.entries(levels)) {
    answers[id] = scoreAnswer(level);
  }
  return {
    model: "jev-latest",
    answers,
    usage: { input_tokens: 1200, output_tokens: 40 },
  };
}

const ALL_LEVEL_4 = {
  impact_evidence: 4,
  ats_structure: 4,
  role_relevance: 4,
  clarity_concision: 4,
  completeness: 4,
};

async function loadRubric(apiKey: string | undefined) {
  if (apiKey === undefined) {
    vi.stubEnv("TYPESAFE_API_KEY", "");
  } else {
    vi.stubEnv("TYPESAFE_API_KEY", apiKey);
  }
  vi.resetModules();
  return {
    rubric: await import("@/lib/ai/resume-rubric"),
    jev: await import("@/lib/ai/jev"),
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("mapOrdinalToPercent", () => {
  it("stretches a 5-level ordinal linearly onto 0-100", async () => {
    const { rubric } = await loadRubric("test-key");
    expect(rubric.mapOrdinalToPercent(0)).toBe(0);
    expect(rubric.mapOrdinalToPercent(1)).toBe(25);
    expect(rubric.mapOrdinalToPercent(2)).toBe(50);
    expect(rubric.mapOrdinalToPercent(3)).toBe(75);
    expect(rubric.mapOrdinalToPercent(4)).toBe(100);
  });

  it("handles scores that land between levels", async () => {
    const { rubric } = await loadRubric("test-key");
    expect(rubric.mapOrdinalToPercent(1.6)).toBe(40);
    expect(rubric.mapOrdinalToPercent(2.5)).toBe(63);
    expect(rubric.mapOrdinalToPercent(3.25)).toBe(81);
  });

  it("clamps outside the level range and respects other level counts", async () => {
    const { rubric } = await loadRubric("test-key");
    expect(rubric.mapOrdinalToPercent(-1)).toBe(0);
    expect(rubric.mapOrdinalToPercent(9)).toBe(100);
    expect(rubric.mapOrdinalToPercent(1.5, 3)).toBe(75);
    expect(rubric.mapOrdinalToPercent(1, 2)).toBe(100);
    expect(() => rubric.mapOrdinalToPercent(0, 1)).toThrow();
  });
});

describe("composeOverallScore", () => {
  it("weights each dimension by its declared share", async () => {
    const { rubric } = await loadRubric("test-key");
    const parts = rubric.RESUME_RUBRIC_DIMENSIONS.map((d) => ({
      weight: d.weight,
      score: d.id === "impact_evidence" ? 100 : 0,
    }));
    expect(rubric.composeOverallScore(parts)).toBe(30);
  });

  it("returns the common value when every dimension agrees", async () => {
    const { rubric } = await loadRubric("test-key");
    const parts = rubric.RESUME_RUBRIC_DIMENSIONS.map((d) => ({
      weight: d.weight,
      score: 75,
    }));
    expect(rubric.composeOverallScore(parts)).toBe(75);
  });

  it("rejects non-positive total weight", async () => {
    const { rubric } = await loadRubric("test-key");
    expect(() => rubric.composeOverallScore([{ weight: 0, score: 50 }])).toThrow();
  });
});

describe("rubric definition", () => {
  it("declares five 5-level dimensions whose weights sum to 1", async () => {
    const { rubric } = await loadRubric("test-key");
    expect(rubric.RESUME_RUBRIC_DIMENSIONS).toHaveLength(5);
    const total = rubric.RESUME_RUBRIC_DIMENSIONS.reduce(
      (sum, d) => sum + d.weight,
      0,
    );
    expect(total).toBeCloseTo(1, 10);
    for (const dimension of rubric.RESUME_RUBRIC_DIMENSIONS) {
      expect(dimension.criteria).toHaveLength(rubric.RESUME_RUBRIC_LEVEL_COUNT);
      for (const level of dimension.criteria) {
        expect(level.length).toBeGreaterThan(40);
      }
    }
  });

  it("builds one score question per dimension", async () => {
    const { rubric } = await loadRubric("test-key");
    const questions = rubric.buildResumeRubricQuestions();
    expect(Object.keys(questions).sort()).toEqual(
      rubric.RESUME_RUBRIC_DIMENSIONS.map((d) => d.id).sort(),
    );
    for (const question of Object.values(questions)) {
      expect(question.type).toBe("score");
    }
  });

  it("truncates state that exceeds the vendor input budget", async () => {
    const { rubric } = await loadRubric("test-key");
    const long = "x".repeat(200_000);
    const state = rubric.buildRubricState(long);
    expect(state.length).toBeLessThan(long.length);
    expect(state).toContain("[truncated");
    expect(rubric.buildRubricState("  short cv  ")).toBe("short cv");
  });
});

describe("request construction", () => {
  it("posts one request carrying all five questions", async () => {
    const { rubric } = await loadRubric("test-key");
    const { fetchImpl, calls } = stubFetch([
      { status: 200, body: corpusResponse(ALL_LEVEL_4) },
    ]);

    await rubric.scoreResumeRubric("Jane Doe\nEngineer", { fetchImpl });

    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("https://api.typesafe.ai/v1/systemone");
    expect(calls[0].init.method).toBe("POST");
    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer test-key");
    expect(headers["Content-Type"]).toBe("application/json");

    const body = JSON.parse(calls[0].init.body as string);
    expect(body.model).toBe("jev-latest");
    expect(body.state).toBe("Jane Doe\nEngineer");
    expect(Object.keys(body.questions)).toHaveLength(5);
    for (const dimension of rubric.RESUME_RUBRIC_DIMENSIONS) {
      const question = body.questions[dimension.id];
      expect(question.type).toBe("score");
      expect(question.instructions).toBe(dimension.instructions);
      expect(question.criteria).toEqual(dimension.criteria);
    }
  });
});

describe("response handling", () => {
  it("maps answers onto weighted scores and section scores", async () => {
    const { rubric } = await loadRubric("test-key");
    const { fetchImpl } = stubFetch([
      {
        status: 200,
        body: corpusResponse({
          impact_evidence: 4,
          ats_structure: 2,
          role_relevance: 3,
          clarity_concision: 1,
          completeness: 0,
        }),
      },
    ]);

    const result = await rubric.scoreResumeRubric("cv text", { fetchImpl });

    // 0.30*100 + 0.20*50 + 0.20*75 + 0.15*25 + 0.15*0 = 58.75 -> 59
    expect(result.overallScore).toBe(59);
    expect(result.sectionScores.map((s) => s.score)).toEqual([
      100, 50, 75, 25, 0,
    ]);
    expect(result.sectionScores[0].section).toBe(
      "Impact evidence & quantification",
    );
    expect(result.sectionScores[0].note).toBe("level four");
    expect(result.usage).toEqual({ inputTokens: 1200, outputTokens: 40 });
  });

  it("keeps confidence available on the dimension results", async () => {
    const { rubric } = await loadRubric("test-key");
    const { fetchImpl } = stubFetch([
      { status: 200, body: corpusResponse(ALL_LEVEL_4) },
    ]);

    const result = await rubric.scoreResumeRubric("cv text", { fetchImpl });
    expect(result.dimensions).toHaveLength(5);
    for (const dimension of result.dimensions) {
      expect(dimension.confidence).toBe(0.9);
      expect(dimension.probabilities["4"]).toBe(1);
    }
  });

  it("satisfies the existing section score schema", async () => {
    const { rubric } = await loadRubric("test-key");
    const { resumeReviewSectionScoreSchema } = await import(
      "@/lib/validation/resume-review"
    );
    const { fetchImpl } = stubFetch([
      { status: 200, body: corpusResponse(ALL_LEVEL_4) },
    ]);

    const result = await rubric.scoreResumeRubric("cv text", { fetchImpl });
    for (const section of result.sectionScores) {
      expect(resumeReviewSectionScoreSchema.safeParse(section).success).toBe(
        true,
      );
    }
  });

  it("rejects a malformed response", async () => {
    const { rubric } = await loadRubric("test-key");
    const { fetchImpl } = stubFetch([
      {
        status: 200,
        body: {
          model: "jev-latest",
          answers: { impact_evidence: { type: "score", score: "high" } },
          usage: { input_tokens: 10, output_tokens: 1 },
        },
      },
    ]);

    await expect(
      rubric.scoreResumeRubric("cv text", { fetchImpl }),
    ).rejects.toThrow();
  });

  it("fails when a rubric dimension is missing from the answers", async () => {
    const { rubric } = await loadRubric("test-key");
    const { fetchImpl } = stubFetch([
      { status: 200, body: corpusResponse({ impact_evidence: 3 }) },
    ]);

    await expect(
      rubric.scoreResumeRubric("cv text", { fetchImpl }),
    ).rejects.toThrow(/ats_structure/);
  });
});

describe("askJev transport", () => {
  it("throws a configuration error when the key is missing", async () => {
    const { jev } = await loadRubric(undefined);
    const { fetchImpl, calls } = stubFetch([
      { status: 200, body: corpusResponse(ALL_LEVEL_4) },
    ]);

    await expect(
      jev.askJev({
        state: "cv text",
        questions: {
          impact_evidence: {
            type: "score",
            instructions: "i",
            criteria: ["low", "high"],
          },
        },
        fetchImpl,
      }),
    ).rejects.toThrow(/TYPESAFE_API_KEY/);
    expect(calls).toHaveLength(0);
  });

  it("retries 429 and returns the eventual answers", async () => {
    const { jev } = await loadRubric("test-key");
    const { fetchImpl, calls } = stubFetch([
      { status: 429, body: { error: "rate limited" } },
      { status: 200, body: corpusResponse({ impact_evidence: 2 }) },
    ]);

    const answers = await jev.askJev({
      state: "cv text",
      questions: {
        impact_evidence: {
          type: "score",
          instructions: "i",
          criteria: ["low", "high"],
        },
      },
      fetchImpl,
      retryDelayMs: 0,
    });

    expect(calls).toHaveLength(2);
    expect(answers.impact_evidence.type).toBe("score");
  });

  it("does not retry a 422 validation error", async () => {
    const { jev } = await loadRubric("test-key");
    const { fetchImpl, calls } = stubFetch([
      { status: 422, body: { error: "questions.impact_evidence.criteria" } },
    ]);

    await expect(
      jev.askJev({
        state: "cv text",
        questions: {
          impact_evidence: {
            type: "score",
            instructions: "i",
            criteria: ["low", "high"],
          },
        },
        fetchImpl,
        retryDelayMs: 0,
      }),
    ).rejects.toThrow(/422/);
    expect(calls).toHaveLength(1);
  });
});

describe("askJev retry classification", () => {
  const QUESTION = {
    impact_evidence: {
      type: "score" as const,
      instructions: "i",
      criteria: ["low", "high"],
    },
  };

  it("retries a 5xx, which is the fault the loop exists for", async () => {
    const { jev } = await loadRubric("test-key");
    const { fetchImpl, calls } = stubFetch([
      { status: 503, body: { error: "unavailable" } },
      { status: 200, body: corpusResponse({ impact_evidence: 3 }) },
    ]);

    const answers = await jev.askJev({
      state: "cv text",
      questions: QUESTION,
      fetchImpl,
      retryDelayMs: 0,
    });

    expect(calls).toHaveLength(2);
    expect(answers.impact_evidence.type).toBe("score");
  });

  it("retries a rejected fetch (network failure)", async () => {
    const { jev } = await loadRubric("test-key");
    let attempts = 0;
    const fetchImpl = (async () => {
      attempts += 1;
      if (attempts === 1) {
        throw new TypeError("fetch failed");
      }
      return {
        ok: true,
        status: 200,
        json: async () => corpusResponse({ impact_evidence: 1 }),
        text: async () => "",
      };
    }) as unknown as typeof fetch;

    const answers = await jev.askJev({
      state: "cv text",
      questions: QUESTION,
      fetchImpl,
      retryDelayMs: 0,
    });

    expect(attempts).toBe(2);
    expect(answers.impact_evidence.type).toBe("score");
  });

  it("gives up after maxRetries rather than looping forever", async () => {
    const { jev } = await loadRubric("test-key");
    const { fetchImpl, calls } = stubFetch([
      { status: 503, body: { error: "unavailable" } },
    ]);

    await expect(
      jev.askJev({
        state: "cv text",
        questions: QUESTION,
        fetchImpl,
        retryDelayMs: 0,
        maxRetries: 2,
      }),
    ).rejects.toThrow(/503/);
    expect(calls).toHaveLength(3);
  });

  it("does not retry a malformed but successful response", async () => {
    const { jev } = await loadRubric("test-key");
    const { fetchImpl, calls } = stubFetch([
      { status: 200, body: { model: "jev-latest", answers: {} } },
    ]);

    await expect(
      jev.askJev({ state: "cv text", questions: QUESTION, fetchImpl }),
    ).rejects.toThrow();
    expect(calls).toHaveLength(1);
  });
});
