/**
 * Pure helpers linking prep plan items to the interview video library.
 */

export type PlanItemLike = {
  category: string;
  title: string;
  href?: string | null;
  description?: string | null;
};

export type VideoLike = {
  id: string;
  title: string;
  categoryTags: string[];
  summary?: string | null;
};

/** Map plan categories / title keywords → video category tags. */
const CATEGORY_TO_TAGS: Record<string, string[]> = {
  interview: ["behavioral", "motivation", "technical", "case", "general"],
  skills: ["technical", "case", "general"],
  application: ["motivation", "company_research", "salary_negotiation"],
  cv: [],
  other: ["general"],
};

const KEYWORD_TAGS: { pattern: RegExp; tags: string[] }[] = [
  { pattern: /\bbehavioral\b|\bstar\b|\bstory\b/i, tags: ["behavioral"] },
  { pattern: /\btechnical\b|\bcoding\b|\bsystem design\b|\balgorithm\b/i, tags: ["technical"] },
  { pattern: /\bcase\b|\bconsult/i, tags: ["case"] },
  { pattern: /\bmotivat|\bwhy (this|our) company\b|\bculture fit\b/i, tags: ["motivation"] },
  { pattern: /\bnegotiat|\bsalary\b|\bcompensat|\boffer\b/i, tags: ["salary_negotiation"] },
  { pattern: /\bresearch\b|\bcompany\b/i, tags: ["company_research"] },
];

function tagsFromPlanItem(item: PlanItemLike): string[] {
  const tags = new Set<string>(CATEGORY_TO_TAGS[item.category] ?? ["general"]);
  const haystack = `${item.title} ${item.description ?? ""}`;
  for (const { pattern, tags: matched } of KEYWORD_TAGS) {
    if (pattern.test(haystack)) {
      for (const t of matched) tags.add(t);
    }
  }
  return [...tags];
}

/**
 * Prefer an existing /videos href; otherwise build a filtered library link
 * for interview-related plan items.
 */
export function videoHrefForPlanItem(item: PlanItemLike): string | null {
  const href = item.href?.trim() ?? "";
  if (href.startsWith("/videos")) {
    return href;
  }

  const tags = tagsFromPlanItem(item);
  const isInterviewRelated =
    item.category === "interview" ||
    tags.some((t) => t !== "general") ||
    /\binterview\b/i.test(item.title);

  if (!isInterviewRelated && item.category !== "skills") {
    return null;
  }

  // Prefer a specific category filter when keywords narrow it
  const preferred =
    tags.find((t) => t !== "general") ??
    (item.category === "interview" ? "behavioral" : null);

  if (preferred) {
    return `/videos?category=${encodeURIComponent(preferred)}`;
  }

  return "/videos";
}

/**
 * Rank published videos by overlap with plan item category/title tags.
 */
export function matchVideosForPlanItem<T extends VideoLike>(
  item: PlanItemLike,
  videos: T[],
  limit = 3
): T[] {
  const wanted = new Set(tagsFromPlanItem(item).map((t) => t.toLowerCase()));
  const titleWords = item.title
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 3);

  const scored = videos.map((video) => {
    let score = 0;
    for (const tag of video.categoryTags) {
      if (wanted.has(tag.toLowerCase())) score += 3;
    }
    const title = video.title.toLowerCase();
    for (const word of titleWords) {
      if (title.includes(word)) score += 1;
    }
    return { video, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.video);
}
