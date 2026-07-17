import { describe, expect, it } from "vitest";
import {
  composeContentFromSections,
  coverLetterGenerationSchema,
  draftTypeSchema,
  lengthSchema,
  parseCoverLetterGeneration,
  parseShortMessageGeneration,
  sectionKeySchema,
  shortMessageGenerationSchema,
  toneSchema,
} from "@/lib/validation/application-draft";

const validCoverLetter = {
  title: "Cover letter — Backend Engineer at Acme",
  sections: {
    intro:
      "I am writing to apply for the Backend Engineer role at Acme, where I can contribute to scalable API design.",
    body: "In my recent role I built TypeScript services handling high request volume and improved database reliability with careful schema design.",
    closing:
      "I would welcome the chance to discuss how my experience aligns with Acme’s platform goals.",
  },
  content:
    "I am writing to apply for the Backend Engineer role at Acme, where I can contribute to scalable API design.\n\nIn my recent role I built TypeScript services handling high request volume and improved database reliability with careful schema design.\n\nI would welcome the chance to discuss how my experience aligns with Acme’s platform goals.",
  evidenceNotes: ["TypeScript services", "database reliability"],
};

const validShortMessage = {
  title: "Recruiter DM — Backend Engineer",
  content:
    "Hi Alex — I saw the Backend Engineer opening and would love a brief chat about the team’s API stack. Happy to share a short summary of relevant work.",
  evidenceNotes: ["Backend Engineer opening"],
};

describe("draftTypeSchema / toneSchema / lengthSchema / sectionKeySchema", () => {
  it("accepts known enum values", () => {
    expect(draftTypeSchema.safeParse("cover_letter").success).toBe(true);
    expect(draftTypeSchema.safeParse("recruiter_dm").success).toBe(true);
    expect(draftTypeSchema.safeParse("referral_request").success).toBe(true);
    expect(draftTypeSchema.safeParse("application_note").success).toBe(true);
    expect(toneSchema.safeParse("professional").success).toBe(true);
    expect(toneSchema.safeParse("enthusiastic").success).toBe(true);
    expect(toneSchema.safeParse("formal").success).toBe(true);
    expect(toneSchema.safeParse("concise").success).toBe(true);
    expect(lengthSchema.safeParse("short").success).toBe(true);
    expect(lengthSchema.safeParse("medium").success).toBe(true);
    expect(lengthSchema.safeParse("long").success).toBe(true);
    expect(sectionKeySchema.safeParse("intro").success).toBe(true);
    expect(sectionKeySchema.safeParse("body").success).toBe(true);
    expect(sectionKeySchema.safeParse("closing").success).toBe(true);
  });

  it("rejects bad enums", () => {
    expect(draftTypeSchema.safeParse("email").success).toBe(false);
    expect(toneSchema.safeParse("casual").success).toBe(false);
    expect(lengthSchema.safeParse("xl").success).toBe(false);
    expect(sectionKeySchema.safeParse("ps").success).toBe(false);
  });
});

describe("coverLetterGenerationSchema", () => {
  it("accepts a valid fixture", () => {
    const result = coverLetterGenerationSchema.safeParse(validCoverLetter);
    expect(result.success).toBe(true);
    expect(parseCoverLetterGeneration(validCoverLetter)).toEqual(
      validCoverLetter
    );
  });

  it("accepts fixture without optional evidenceNotes", () => {
    const withoutNotes = {
      title: validCoverLetter.title,
      sections: validCoverLetter.sections,
      content: validCoverLetter.content,
    };
    expect(coverLetterGenerationSchema.safeParse(withoutNotes).success).toBe(
      true
    );
  });

  it("rejects empty required strings", () => {
    expect(
      coverLetterGenerationSchema.safeParse({
        ...validCoverLetter,
        title: "",
      }).success
    ).toBe(false);
    expect(
      coverLetterGenerationSchema.safeParse({
        ...validCoverLetter,
        content: "",
      }).success
    ).toBe(false);
    expect(
      coverLetterGenerationSchema.safeParse({
        ...validCoverLetter,
        sections: { ...validCoverLetter.sections, intro: "" },
      }).success
    ).toBe(false);
    expect(() =>
      parseCoverLetterGeneration({ ...validCoverLetter, title: "" })
    ).toThrow();
  });

  it("rejects too many evidenceNotes", () => {
    const tooMany = {
      ...validCoverLetter,
      evidenceNotes: Array.from({ length: 13 }, (_, i) => `note-${i}`),
    };
    expect(coverLetterGenerationSchema.safeParse(tooMany).success).toBe(false);
  });
});

describe("shortMessageGenerationSchema", () => {
  it("accepts a valid fixture", () => {
    const result = shortMessageGenerationSchema.safeParse(validShortMessage);
    expect(result.success).toBe(true);
    expect(parseShortMessageGeneration(validShortMessage)).toEqual(
      validShortMessage
    );
  });

  it("rejects empty required strings", () => {
    expect(
      shortMessageGenerationSchema.safeParse({
        ...validShortMessage,
        title: "",
      }).success
    ).toBe(false);
    expect(
      shortMessageGenerationSchema.safeParse({
        ...validShortMessage,
        content: "",
      }).success
    ).toBe(false);
    expect(() =>
      parseShortMessageGeneration({ ...validShortMessage, content: "" })
    ).toThrow();
  });

  it("rejects too many evidenceNotes", () => {
    const tooMany = {
      ...validShortMessage,
      evidenceNotes: Array.from({ length: 9 }, (_, i) => `note-${i}`),
    };
    expect(shortMessageGenerationSchema.safeParse(tooMany).success).toBe(false);
  });
});

describe("composeContentFromSections", () => {
  it("joins intro, body, and closing with blank lines", () => {
    const composed = composeContentFromSections(validCoverLetter.sections);
    expect(composed).toBe(
      `${validCoverLetter.sections.intro}\n\n${validCoverLetter.sections.body}\n\n${validCoverLetter.sections.closing}`
    );
  });
});
