/**
 * Centralized privacy / AI-use copy for legal pages and consent UI.
 * Version strings are stored with UserConsent rows (T2) for auditability.
 * Plainspoken MVP language only — not counsel-approved legal policy.
 */

export const CONSENT_COPY_VERSION = "2026-07-17";

export type LegalCopyKey =
  | "privacySummary"
  | "uploadConsent"
  | "aiGuidanceDisclaimer"
  | "jobFitLimitations"
  | "interviewFeedbackDisclaimer"
  | "assessmentNonClinical"
  | "careerRecommendationLimits"
  | "dataRights";

export const LEGAL_COPY: Record<LegalCopyKey, string> = {
  privacySummary:
    "RoleReady stores the account details and career materials you provide so we can run reviews, match analysis, drafts, and prep plans. We use that data to operate the product for you — not to sell your CV or profile. You can request an export or deletion of your data from Settings.",

  uploadConsent:
    "I understand RoleReady will store my CV to parse and review it, and may send relevant content to AI providers to generate feedback.",

  aiGuidanceDisclaimer:
    "AI outputs on RoleReady are guidance and drafts only. They can be incomplete, biased, or wrong. Always review before you use them in applications, interviews, or career decisions.",

  jobFitLimitations:
    "Job-fit and match scores are rough signals from the materials you provide. They are not hiring decisions, guarantees of interviews, or official assessments by any employer.",

  interviewFeedbackDisclaimer:
    "Interview practice feedback is coaching only. It is not a prediction of interview outcomes and does not replace real interviewer judgment.",

  assessmentNonClinical:
    "Practice assessments and skill checks are for learning only. They are not clinical, medical, or licensed psychological evaluations.",

  careerRecommendationLimits:
    "Prep plans and career recommendations are suggestions based on your inputs. They are not a promise of job offers, salary outcomes, or a complete career strategy.",

  dataRights:
    "You can request a copy of the profile and analysis metadata we hold, or request deletion of your account data. We process requests as soon as practical; full removal of stored files may take additional operator steps.",
};

/** Short bullets for the privacy page overview. */
export const PRIVACY_SUMMARY_BULLETS: readonly string[] = [
  "Account basics (email, session) so you can sign in and keep your work.",
  "Career profile answers from onboarding (target role, industry, location, experience).",
  "Documents you upload (for example CVs) and text we extract from them.",
  "AI analysis results you generate (reviews, match notes, drafts, prep plans).",
  "Consent and data-request records so we know what you agreed to and what you asked us to do.",
];

/** Expanded sections for /privacy (beyond the reusable one-liners). */
export const PRIVACY_PAGE = {
  title: "Privacy",
  intro:
    "This page explains, in plain language, what RoleReady collects, how we use it, and how you can ask for export or deletion. It is product guidance for the MVP — not a full legal privacy policy.",
  whatWeCollectTitle: "What we collect",
  howWeUseTitle: "How we use it",
  howWeUseBody:
    "We use your data to power features you request: resume storage and review, job-fit analysis, cover-letter drafts, preparation plans, and related coaching tools. When a feature needs AI, relevant text may be sent to third-party AI providers to generate outputs. We do not sell your CV or career profile as a product.",
  storageTitle: "Storage and retention",
  storageBody:
    "Data lives in our application database and document storage so features keep working across sessions. We keep materials while your account is active and while they are needed for the product. Exact retention windows may change as the product matures; request deletion when you want us to start removing your data.",
  thirdPartiesTitle: "Service providers",
  thirdPartiesBody:
    "We rely on infrastructure and AI providers to run the app (hosting, database, authentication, model APIs). They process data only to provide those services. We aim to share only what a feature needs — not your entire account history by default.",
  contactNote:
    "Questions about privacy can be raised through the product support channels published on the site. For export or deletion, use Settings → Your data when that section is available.",
} as const;

/** Expanded sections for /ai-use. */
export const AI_USE_PAGE = {
  title: "How RoleReady uses AI",
  intro:
    "RoleReady uses AI models to help with career prep. This page sets expectations: AI helps draft and analyze; you stay responsible for what you submit and decide.",
  whatAiDoesTitle: "What AI is used for",
  whatAiDoesBody:
    "Depending on the feature, AI may summarize or score resume content, compare your materials to a job description, draft cover letters or application messages, suggest prep-plan items, or (when available) give practice-interview or assessment feedback. Outputs are generated from the inputs you provide and model responses — not from a human recruiter reviewing every run.",
  whatAiIsNotTitle: "What AI is not",
  humanReviewTitle: "Your review is required",
  humanReviewBody:
    "Before you send anything to an employer, interview, or another person, read AI outputs carefully. Correct facts, tone, and claims. RoleReady does not guarantee accuracy, completeness, or fitness for any particular application.",
  consentNote:
    "Sensitive flows (such as uploading a CV or running AI analysis) may ask you to confirm that you understand storage and AI processing. Acknowledgments are recorded with a copy version so we can show what you agreed to.",
} as const;
