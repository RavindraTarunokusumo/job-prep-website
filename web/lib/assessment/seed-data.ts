import type {
  CategorySlug,
  Choice,
  Difficulty,
} from "../validation/assessment";

export type SeedCategory = {
  id: string;
  slug: CategorySlug;
  name: string;
  description: string;
  sortOrder: number;
  disclaimerKind: string;
};

export type SeedQuestion = {
  id: string;
  categorySlug: CategorySlug;
  prompt: string;
  choices: Choice[] | null;
  correctAnswer: string | null;
  explanation: string | null;
  difficulty: Difficulty | null;
  sortOrder: number;
};

/** Minimum question counts required for MVP seed integrity. */
export const MIN_COUNTS: Record<CategorySlug, number> = {
  numerical: 5,
  verbal: 5,
  logical: 5,
  situational_judgment: 5,
  work_style: 4,
  consulting_case: 4,
};

export const SEED_CATEGORIES: SeedCategory[] = [
  {
    id: "acat_numerical",
    slug: "numerical",
    name: "Numerical reasoning",
    description:
      "Practice interpreting tables, ratios, and simple quantitative scenarios. For preparation only — not an official employment test.",
    sortOrder: 1,
    disclaimerKind: "practice_only",
  },
  {
    id: "acat_verbal",
    slug: "verbal",
    name: "Verbal reasoning",
    description:
      "Practice reading short passages and drawing careful conclusions. For preparation only — not an official employment test.",
    sortOrder: 2,
    disclaimerKind: "practice_only",
  },
  {
    id: "acat_logical",
    slug: "logical",
    name: "Logical reasoning",
    description:
      "Practice pattern recognition and rule-based deductions. For preparation only — not an official employment test.",
    sortOrder: 3,
    disclaimerKind: "practice_only",
  },
  {
    id: "acat_situational_judgment",
    slug: "situational_judgment",
    name: "Situational judgment",
    description:
      "Choose the most effective response in workplace-style scenarios. For preparation only — not an official employment test.",
    sortOrder: 4,
    disclaimerKind: "practice_only",
  },
  {
    id: "acat_work_style",
    slug: "work_style",
    name: "Work style reflection",
    description:
      "Self-reflection prompts about how you prefer to work. Not scored and not a clinical or personality diagnosis.",
    sortOrder: 5,
    disclaimerKind: "practice_only",
  },
  {
    id: "acat_consulting_case",
    slug: "consulting_case",
    name: "Consulting case practice",
    description:
      "Short structured case prompts for consulting-style problem solving. For preparation only — not an official case interview.",
    sortOrder: 6,
    disclaimerKind: "practice_only",
  },
];

export const SEED_QUESTIONS: SeedQuestion[] = [
  // —— Numerical (5) ——
  {
    id: "aq_numerical_01",
    categorySlug: "numerical",
    prompt:
      "A team ships 240 support tickets in 8 days at a steady pace. At the same pace, how many tickets will they ship in 15 days?",
    choices: [
      { key: "a", label: "360" },
      { key: "b", label: "420" },
      { key: "c", label: "450" },
      { key: "d", label: "480" },
    ],
    correctAnswer: "c",
    explanation:
      "Daily rate is 240 ÷ 8 = 30 tickets/day. In 15 days: 30 × 15 = 450.",
    difficulty: "easy",
    sortOrder: 1,
  },
  {
    id: "aq_numerical_02",
    categorySlug: "numerical",
    prompt:
      "A project budget is $80,000. Engineering is allocated 45% and design 20%. How much remains for all other work?",
    choices: [
      { key: "a", label: "$20,000" },
      { key: "b", label: "$28,000" },
      { key: "c", label: "$32,000" },
      { key: "d", label: "$36,000" },
    ],
    correctAnswer: "b",
    explanation:
      "Engineering + design = 45% + 20% = 65%. Remaining = 35% of $80,000 = $28,000.",
    difficulty: "easy",
    sortOrder: 2,
  },
  {
    id: "aq_numerical_03",
    categorySlug: "numerical",
    prompt:
      "Last month conversion was 4.0%. This month visits rose 25% and conversions rose 10%. What is this month’s approximate conversion rate?",
    choices: [
      { key: "a", label: "3.2%" },
      { key: "b", label: "3.5%" },
      { key: "c", label: "4.0%" },
      { key: "d", label: "4.4%" },
    ],
    correctAnswer: "b",
    explanation:
      "Conversion rate = conversions ÷ visits. Multipliers: conversions ×1.10, visits ×1.25. New rate ≈ 4.0% × (1.10 / 1.25) = 4.0% × 0.88 = 3.52% ≈ 3.5%.",
    difficulty: "medium",
    sortOrder: 3,
  },
  {
    id: "aq_numerical_04",
    categorySlug: "numerical",
    prompt:
      "A warehouse has 3 identical shelves holding 180 boxes total. After adding 2 more identical shelves and redistributing evenly, how many boxes per shelf?",
    choices: [
      { key: "a", label: "30" },
      { key: "b", label: "36" },
      { key: "c", label: "45" },
      { key: "d", label: "60" },
    ],
    correctAnswer: "b",
    explanation:
      "Total boxes stay 180. Shelves become 3 + 2 = 5. Per shelf: 180 ÷ 5 = 36.",
    difficulty: "easy",
    sortOrder: 4,
  },
  {
    id: "aq_numerical_05",
    categorySlug: "numerical",
    prompt:
      "A subscription costs $48/month. An annual plan costs $432 prepaid. What is the percent savings of annual versus 12 monthly payments?",
    choices: [
      { key: "a", label: "10%" },
      { key: "b", label: "15%" },
      { key: "c", label: "20%" },
      { key: "d", label: "25%" },
    ],
    correctAnswer: "d",
    explanation:
      "Twelve monthly payments: 12 × $48 = $576. Savings: $576 − $432 = $144. Percent: 144 / 576 = 0.25 = 25%.",
    difficulty: "medium",
    sortOrder: 5,
  },

  // —— Verbal (5) ——
  {
    id: "aq_verbal_01",
    categorySlug: "verbal",
    prompt:
      'Passage: "The pilot program reduced onboarding time by training mentors first, not by adding more documentation." Which statement is best supported?',
    choices: [
      {
        key: "a",
        label: "Documentation was completely removed from onboarding.",
      },
      {
        key: "b",
        label: "Mentor training contributed to shorter onboarding time.",
      },
      {
        key: "c",
        label: "New hires preferred mentors over written guides.",
      },
      {
        key: "d",
        label: "The program increased total training cost.",
      },
    ],
    correctAnswer: "b",
    explanation:
      "The passage attributes the reduction to training mentors first. It does not claim documentation was removed, preferences, or cost impact.",
    difficulty: "easy",
    sortOrder: 1,
  },
  {
    id: "aq_verbal_02",
    categorySlug: "verbal",
    prompt:
      'Which sentence best preserves the meaning of: "Although revenue grew, margin compressed because costs rose faster."',
    choices: [
      {
        key: "a",
        label: "Revenue fell while costs stayed flat.",
      },
      {
        key: "b",
        label: "Revenue increased, but profit percentage declined as expenses outpaced sales.",
      },
      {
        key: "c",
        label: "Costs fell faster than revenue grew.",
      },
      {
        key: "d",
        label: "Margin improved despite higher costs.",
      },
    ],
    correctAnswer: "b",
    explanation:
      "Growth with compressed margin means sales rose while costs rose even more, lowering margin percentage.",
    difficulty: "easy",
    sortOrder: 2,
  },
  {
    id: "aq_verbal_03",
    categorySlug: "verbal",
    prompt:
      "Policy note: remote employees must log core hours between 10:00 and 15:00 local time; optional collaboration windows may be scheduled outside those hours. Which action violates the policy?",
    choices: [
      {
        key: "a",
        label: "Taking a short break at 12:30 during core hours.",
      },
      {
        key: "b",
        label: "Scheduling a brainstorm at 16:30 after core hours.",
      },
      {
        key: "c",
        label: "Being unreachable for meetings from 11:00 to 14:00 without coverage.",
      },
      {
        key: "d",
        label: "Working independently at 09:00 before core hours.",
      },
    ],
    correctAnswer: "c",
    explanation:
      "Core hours require availability roughly 10:00–15:00. Being unreachable through most of that window without coverage conflicts with the policy; optional windows after core hours are allowed.",
    difficulty: "medium",
    sortOrder: 3,
  },
  {
    id: "aq_verbal_04",
    categorySlug: "verbal",
    prompt:
      'Two claims: (1) "All analysts completed the ethics module." (2) "Some analysts completed the ethics module." If only claim (1) is known true, what follows about claim (2)?',
    choices: [
      { key: "a", label: "Claim (2) must be false." },
      { key: "b", label: "Claim (2) must be true." },
      { key: "c", label: "Claim (2) is unrelated and indeterminate." },
      { key: "d", label: "Claim (2) contradicts claim (1)." },
    ],
    correctAnswer: "b",
    explanation:
      "If every analyst completed the module, then it is also true that some (at least one, in ordinary usage of “some” in this style of item) completed it. Claim (2) is entailed, not contradicted.",
    difficulty: "medium",
    sortOrder: 4,
  },
  {
    id: "aq_verbal_05",
    categorySlug: "verbal",
    prompt:
      'Memo: "We will delay the launch until legal review finishes, unless the risk committee grants a waiver." Under which condition can launch proceed before legal review finishes?',
    choices: [
      {
        key: "a",
        label: "Engineering is ready and marketing requests an early date.",
      },
      {
        key: "b",
        label: "The risk committee grants a waiver.",
      },
      {
        key: "c",
        label: "Legal review has not started.",
      },
      {
        key: "d",
        label: "Customer support staffing is complete.",
      },
    ],
    correctAnswer: "b",
    explanation:
      "The memo allows only one exception path: a risk-committee waiver. Readiness elsewhere does not override the legal-review gate.",
    difficulty: "easy",
    sortOrder: 5,
  },

  // —— Logical (5) ——
  {
    id: "aq_logical_01",
    categorySlug: "logical",
    prompt:
      "Sequence: 2, 6, 12, 20, 30, ___. What number comes next?",
    choices: [
      { key: "a", label: "36" },
      { key: "b", label: "40" },
      { key: "c", label: "42" },
      { key: "d", label: "44" },
    ],
    correctAnswer: "c",
    explanation:
      "Differences increase by 2 each step: +4, +6, +8, +10, then +12 → 30 + 12 = 42. (Also n(n+1): 1×2, 2×3, 3×4, 4×5, 5×6, 6×7=42.)",
    difficulty: "easy",
    sortOrder: 1,
  },
  {
    id: "aq_logical_02",
    categorySlug: "logical",
    prompt:
      "If every square is a rectangle, and shape S is a square, which must be true?",
    choices: [
      { key: "a", label: "S is a rectangle." },
      { key: "b", label: "S is not a rectangle." },
      { key: "c", label: "Every rectangle is a square." },
      { key: "d", label: "S might not be a square." },
    ],
    correctAnswer: "a",
    explanation:
      "From “all squares are rectangles” and “S is a square,” it follows that S is a rectangle. The converse is not required.",
    difficulty: "easy",
    sortOrder: 2,
  },
  {
    id: "aq_logical_03",
    categorySlug: "logical",
    prompt:
      "Rule: cards with an even number on one side must have a vowel on the other. You see four cards showing A, B, 4, and 7. Which two cards must you flip to check the rule?",
    choices: [
      { key: "a", label: "A and 4" },
      { key: "b", label: "B and 7" },
      { key: "c", label: "A and 7" },
      { key: "d", label: "4 and B" },
    ],
    correctAnswer: "d",
    explanation:
      "You must check the even number (4) has a vowel reverse, and the consonant (B) is not hiding an even number. A already satisfies a vowel; 7 is odd so the rule does not constrain it.",
    difficulty: "hard",
    sortOrder: 3,
  },
  {
    id: "aq_logical_04",
    categorySlug: "logical",
    prompt:
      "Three teammates — Ava, Ben, and Cora — make statements about who submitted a report. Exactly one person submitted it. Ava: \"I submitted it.\" Ben: \"I did not submit it.\" Cora: \"Ava did not submit it.\" Exactly one of the three statements is true. Who submitted the report?",
    choices: [
      { key: "a", label: "Ava" },
      { key: "b", label: "Ben" },
      { key: "c", label: "Cora" },
      { key: "d", label: "Cannot be determined" },
    ],
    correctAnswer: "b",
    explanation:
      "If Ava submitted: Ava true, Ben true (he did not), Cora false → two truths, impossible. If Cora submitted: Ava false, Ben true, Cora true → two truths, impossible. If Ben submitted: Ava false, Ben false (\"I did not\" is false), Cora true (\"Ava did not\") → exactly one truth. So Ben submitted.",
    difficulty: "hard",
    sortOrder: 4,
  },
  {
    id: "aq_logical_05",
    categorySlug: "logical",
    prompt:
      "A code maps each letter to the letter three places later in the alphabet (A→D, B→E, …, X→A, Y→B, Z→C). What is the encoding of “PLAN”?",
    choices: [
      { key: "a", label: "SODQ" },
      { key: "b", label: "SOAN" },
      { key: "c", label: "RMZP" },
      { key: "d", label: "QOBP" },
    ],
    correctAnswer: "a",
    explanation:
      "P→S, L→O, A→D, N→Q, so PLAN → SODQ.",
    difficulty: "medium",
    sortOrder: 5,
  },

  // —— Situational judgment (5) ——
  {
    id: "aq_sj_01",
    categorySlug: "situational_judgment",
    prompt:
      "A teammate shares a draft with a factual error one hour before a client call. You noticed the error. What is the most effective first step?",
    choices: [
      {
        key: "a",
        label: "Correct the error yourself silently and never mention it.",
      },
      {
        key: "b",
        label:
          "Flag the specific error promptly, propose a fix, and confirm with the teammate before the call.",
      },
      {
        key: "c",
        label: "Wait until after the call so you do not create stress.",
      },
      {
        key: "d",
        label: "Escalate to the client that your teammate made a mistake.",
      },
    ],
    correctAnswer: "b",
    explanation:
      "Timely, specific correction with ownership still shared with the author protects the client outcome without unnecessary escalation or silence that leaves risk unaddressed.",
    difficulty: "easy",
    sortOrder: 1,
  },
  {
    id: "aq_sj_02",
    categorySlug: "situational_judgment",
    prompt:
      "Two stakeholders request conflicting priorities for this week’s release. You own the backlog. Best next action?",
    choices: [
      {
        key: "a",
        label: "Implement both fully regardless of capacity.",
      },
      {
        key: "b",
        label:
          "Clarify goals and constraints, surface the trade-off, and get an explicit priority decision.",
      },
      {
        key: "c",
        label: "Choose the request from the more senior title only.",
      },
      {
        key: "d",
        label: "Ignore both requests until next quarter.",
      },
    ],
    correctAnswer: "b",
    explanation:
      "Making trade-offs explicit and securing a decision reduces thrash better than silent ranking by hierarchy or over-committing.",
    difficulty: "medium",
    sortOrder: 2,
  },
  {
    id: "aq_sj_03",
    categorySlug: "situational_judgment",
    prompt:
      "You realize you will miss a committed internal deadline by one day. What is the most effective response?",
    choices: [
      {
        key: "a",
        label: "Stay silent and deliver late without warning.",
      },
      {
        key: "b",
        label:
          "Notify stakeholders as soon as the slip is clear, explain impact, and propose a revised plan.",
      },
      {
        key: "c",
        label: "Blame another team in a public channel.",
      },
      {
        key: "d",
        label: "Cancel the work entirely without discussion.",
      },
    ],
    correctAnswer: "b",
    explanation:
      "Early communication with a revised plan lets others adapt; silence or blame damages trust.",
    difficulty: "easy",
    sortOrder: 3,
  },
  {
    id: "aq_sj_04",
    categorySlug: "situational_judgment",
    prompt:
      "A colleague repeatedly interrupts others in meetings. You are the facilitator. Best approach?",
    choices: [
      {
        key: "a",
        label: "Publicly criticize them at length mid-meeting.",
      },
      {
        key: "b",
        label:
          "Reset speaking norms, redirect to the interrupted person, and follow up privately if needed.",
      },
      {
        key: "c",
        label: "End the meeting immediately every time it happens.",
      },
      {
        key: "d",
        label: "Ignore it so conflict never surfaces.",
      },
    ],
    correctAnswer: "b",
    explanation:
      "Facilitators protect equal airtime with clear norms and gentle redirects, then private coaching if patterns continue.",
    difficulty: "medium",
    sortOrder: 4,
  },
  {
    id: "aq_sj_05",
    categorySlug: "situational_judgment",
    prompt:
      "You discover a low-severity bug in production that has a simple workaround and is not actively harming users. Best practice response?",
    choices: [
      {
        key: "a",
        label: "Hide it to avoid looking bad.",
      },
      {
        key: "b",
        label:
          "Log it with severity and workaround, notify the owner channel, and schedule a fix appropriately.",
      },
      {
        key: "c",
        label: "Page the entire company overnight.",
      },
      {
        key: "d",
        label: "Delete monitoring so alerts stop.",
      },
    ],
    correctAnswer: "b",
    explanation:
      "Transparent logging and proportional communication match severity; concealment and over-paging are both harmful.",
    difficulty: "easy",
    sortOrder: 5,
  },

  // —— Work style reflection (4) ——
  {
    id: "aq_work_style_01",
    categorySlug: "work_style",
    prompt:
      "Describe an environment where you do your best focused work. What conditions help (schedule, collaboration style, tools), and what tends to get in the way?",
    choices: null,
    correctAnswer: null,
    explanation:
      "There is no single correct answer. Use this to notice patterns you can share with managers or teammates during onboarding conversations.",
    difficulty: null,
    sortOrder: 1,
  },
  {
    id: "aq_work_style_02",
    categorySlug: "work_style",
    prompt:
      "When priorities shift mid-week, how do you typically re-plan? Walk through the steps you take to reassess scope, communicate changes, and protect critical outcomes.",
    choices: null,
    correctAnswer: null,
    explanation:
      "Reflection only — not scored. Strong answers usually mention reprioritization criteria and stakeholder communication, not just working longer hours.",
    difficulty: null,
    sortOrder: 2,
  },
  {
    id: "aq_work_style_03",
    categorySlug: "work_style",
    prompt:
      "Think about a time you received critical feedback. How did you process it, and what (if anything) did you change afterward?",
    choices: null,
    correctAnswer: null,
    explanation:
      "Self-reflection prompt with no correct key. Interview practice often values concrete examples over abstract claims.",
    difficulty: null,
    sortOrder: 3,
  },
  {
    id: "aq_work_style_04",
    categorySlug: "work_style",
    prompt:
      "How do you prefer to collaborate on ambiguous problems — async writing first, a whiteboard session, pair programming, or something else? Explain what works for you and when you adapt.",
    choices: null,
    correctAnswer: null,
    explanation:
      "No single correct style. Awareness of your defaults and flexibility is useful for team fit conversations.",
    difficulty: null,
    sortOrder: 4,
  },

  // —— Consulting case (4) ——
  {
    id: "aq_case_01",
    categorySlug: "consulting_case",
    prompt:
      "A regional coffee chain’s same-store sales fell 8% year over year while foot traffic fell only 2%. Which hypothesis best explains the gap?",
    choices: [
      {
        key: "a",
        label: "Average spend per visit declined (mix or pricing).",
      },
      {
        key: "b",
        label: "The company opened many new stores.",
      },
      {
        key: "c",
        label: "Foot traffic measurement must be wrong only.",
      },
      {
        key: "d",
        label: "Labor costs increased.",
      },
    ],
    correctAnswer: "a",
    explanation:
      "Same-store sales ≈ traffic × spend per visit. Traffic down 2% with sales down 8% implies lower average ticket or worse mix, not merely new-store effects (same-store excludes that) or labor costs (not in sales).",
    difficulty: "medium",
    sortOrder: 1,
  },
  {
    id: "aq_case_02",
    categorySlug: "consulting_case",
    prompt:
      "A client asks whether to cut price 10% to gain share. Volume is expected to rise 12% if price falls 10%. Variable cost is 40% of current price; fixed costs unchanged. Directionally, what happens to contribution margin dollars per unit and roughly to total contribution?",
    choices: [
      {
        key: "a",
        label:
          "Unit contribution falls; total contribution likely falls because volume gain does not fully offset margin loss.",
      },
      {
        key: "b",
        label: "Unit contribution rises; total contribution always rises.",
      },
      {
        key: "c",
        label: "Unit contribution unchanged; total contribution rises 12%.",
      },
      {
        key: "d",
        label: "Fixed costs absorb the price cut so contribution is unaffected.",
      },
    ],
    correctAnswer: "a",
    explanation:
      "If price = 100, variable cost = 40, unit contribution = 60. After −10% price: price 90, VC 40, unit contribution 50 (−16.7%). Volume ×1.12 → total contribution factor 50/60 × 1.12 ≈ 0.933 (down ~7%). Fixed costs do not change unit contribution math.",
    difficulty: "hard",
    sortOrder: 2,
  },
  {
    id: "aq_case_03",
    categorySlug: "consulting_case",
    prompt:
      "You are structuring an issue tree for “why did profit decline?” Which MECE first split is most useful?",
    choices: [
      {
        key: "a",
        label: "Revenue drivers vs. cost drivers (then break each down).",
      },
      {
        key: "b",
        label: "Only marketing ideas vs. only product ideas.",
      },
      {
        key: "c",
        label: "List every department alphabetically with no hierarchy.",
      },
      {
        key: "d",
        label: "Blame external factors only and stop.",
      },
    ],
    correctAnswer: "a",
    explanation:
      "Profit = revenue − costs. Splitting revenue vs. cost first is a standard MECE top cut before drilling into price/volume/mix and fixed/variable cost lines.",
    difficulty: "easy",
    sortOrder: 3,
  },
  {
    id: "aq_case_04",
    categorySlug: "consulting_case",
    prompt:
      "A SaaS client loses 5% of customers each month (logo churn) but expands remaining accounts so net revenue retention is 110%. Which statement is most accurate?",
    choices: [
      {
        key: "a",
        label:
          "Expansion among retained customers more than offsets logo losses in revenue terms.",
      },
      {
        key: "b",
        label: "The company must be shrinking revenue overall.",
      },
      {
        key: "c",
        label: "Logo churn of 5% monthly is impossible with NRR above 100%.",
      },
      {
        key: "d",
        label: "NRR only measures new logo acquisition.",
      },
    ],
    correctAnswer: "a",
    explanation:
      "NRR > 100% means revenue from a starting cohort grows after churn and expansion. Logo churn can coexist with expansion-driven net growth; NRR is not a new-logo metric.",
    difficulty: "medium",
    sortOrder: 4,
  },
];
