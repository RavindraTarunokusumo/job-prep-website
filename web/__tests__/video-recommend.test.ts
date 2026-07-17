import { describe, expect, it } from "vitest";

import {
  matchVideosForPlanItem,
  videoHrefForPlanItem,
} from "@/lib/videos/recommend";

const sampleVideos = [
  {
    id: "1",
    title: "Behavioral interviews with STAR",
    categoryTags: ["behavioral", "general"],
  },
  {
    id: "2",
    title: "System design trade-offs",
    categoryTags: ["technical"],
  },
  {
    id: "3",
    title: "Case interview structure",
    categoryTags: ["case"],
  },
];

describe("videoHrefForPlanItem", () => {
  it("keeps an existing /videos href", () => {
    expect(
      videoHrefForPlanItem({
        category: "interview",
        title: "Practice answers",
        href: "/videos?category=case",
      })
    ).toBe("/videos?category=case");
  });

  it("suggests a filtered library link for interview items", () => {
    const href = videoHrefForPlanItem({
      category: "interview",
      title: "Prepare behavioral stories",
    });
    expect(href).toBeTruthy();
    expect(href?.startsWith("/videos")).toBe(true);
    expect(href).toContain("category=");
  });

  it("returns null for unrelated CV items without interview keywords", () => {
    expect(
      videoHrefForPlanItem({
        category: "cv",
        title: "Tighten bullet metrics",
      })
    ).toBeNull();
  });
});

describe("matchVideosForPlanItem", () => {
  it("ranks behavioral videos higher for STAR plan items", () => {
    const matches = matchVideosForPlanItem(
      { category: "interview", title: "Rewrite STAR behavioral answers" },
      sampleVideos,
      2
    );
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0]?.id).toBe("1");
  });

  it("matches technical keywords", () => {
    const matches = matchVideosForPlanItem(
      { category: "skills", title: "Practice system design interview" },
      sampleVideos,
      1
    );
    expect(matches[0]?.categoryTags).toContain("technical");
  });
});
