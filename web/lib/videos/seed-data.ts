/**
 * Sample interview video metadata for MVP.
 *
 * These are public YouTube/Vimeo URLs used as placeholders for a
 * curated human-made interview library. They are NOT AI-generated videos.
 * Replace with licensed or first-party human-produced content for production.
 */

export type SeedInterviewVideo = {
  id: string;
  title: string;
  url: string;
  categoryTags: string[];
  targetRoles: string[];
  targetIndustries: string[];
  experienceLevels: string[];
  summary: string;
  transcript: string | null;
  published: boolean;
  sortOrder: number;
};

export const SEED_INTERVIEW_VIDEOS: SeedInterviewVideo[] = [
  {
    id: "seed-video-behavioral-star",
    title: "Behavioral interviews: structuring answers with STAR",
    url: "https://www.youtube.com/watch?v=PJKYqLP6MRE",
    categoryTags: ["behavioral", "general"],
    targetRoles: [],
    targetIndustries: [],
    experienceLevels: ["student", "entry", "mid", "career_switch"],
    summary:
      "Human-made overview of Situation–Task–Action–Result storytelling for common behavioral prompts.",
    transcript:
      "Key points: pick a concrete story, state the situation briefly, emphasize your actions, quantify results when honest.",
    published: true,
    sortOrder: 10,
  },
  {
    id: "seed-video-technical-system",
    title: "Technical interview: talking through system design trade-offs",
    url: "https://www.youtube.com/watch?v=i7twT3x5yv8",
    categoryTags: ["technical"],
    targetRoles: ["Software Engineer", "Backend Engineer", "Full Stack Engineer"],
    targetIndustries: ["Technology"],
    experienceLevels: ["mid", "senior"],
    summary:
      "Placeholder human-hosted talk on clarifying requirements, API sketching, and scaling trade-offs.",
    transcript: null,
    published: true,
    sortOrder: 20,
  },
  {
    id: "seed-video-case-structure",
    title: "Case interviews: structuring ambiguous problems",
    url: "https://www.youtube.com/watch?v=Zt1qex1Yb5s",
    categoryTags: ["case"],
    targetRoles: ["Consultant", "Business Analyst", "Strategy Associate"],
    targetIndustries: ["Consulting", "Professional Services"],
    experienceLevels: ["entry", "mid", "career_switch"],
    summary:
      "Human-made framing tips for case prompts — clarify objective, build a MECE structure, check units.",
    transcript: null,
    published: true,
    sortOrder: 30,
  },
  {
    id: "seed-video-motivation",
    title: "Why this company? Motivation and research answers",
    url: "https://www.youtube.com/watch?v=HG68Ymazo18",
    categoryTags: ["motivation", "company_research"],
    targetRoles: [],
    targetIndustries: [],
    experienceLevels: [],
    summary:
      "How to research a company honestly and connect your goals without generic flattery.",
    transcript: null,
    published: true,
    sortOrder: 40,
  },
  {
    id: "seed-video-salary",
    title: "Salary negotiation basics for early-career offers",
    url: "https://vimeo.com/148751763",
    categoryTags: ["salary_negotiation", "general"],
    targetRoles: [],
    targetIndustries: [],
    experienceLevels: ["student", "entry", "career_switch"],
    summary:
      "Placeholder human-made discussion of offer timing, total compensation, and polite counter offers.",
    transcript: null,
    published: true,
    sortOrder: 50,
  },
  {
    id: "seed-video-unpublished-draft",
    title: "(Draft) Internal demo — unpublished",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    categoryTags: ["general"],
    targetRoles: [],
    targetIndustries: [],
    experienceLevels: [],
    summary: "Unpublished seed row to verify published filter.",
    transcript: null,
    published: false,
    sortOrder: 999,
  },
];

export const MIN_PUBLISHED_SEED_COUNT = 4;
