export * from "./ui";

/** Product name — the public landing's title and the browser-tab suffix. */
export const APP_NAME = "maium";

export const ROUTES = {
  HOME: "/",
  SIGNUP: "/signup",
  SETTINGS: "/settings",
  SETTINGS_ACCOUNT: "/settings/account",
  SETTINGS_MY_INFORMATION: "/settings/my-information",
  SETTINGS_PERSONALIZATION: "/settings/personalization",
  AUTH_CALLBACK: "/auth/callback",
  PROFILE: (pseudo: string) => `/profile/${pseudo}`,
  PROFILE_FOLLOWERS: (pseudo: string) => `/profile/${pseudo}/followers`,
  PROFILE_FOLLOWING: (pseudo: string) => `/profile/${pseudo}/following`,
  PRIVACY_POLICY: "/privacy-policy",
  MESSAGES: "/messages",
  CONVERSATION: (id: string) => `/messages/${id}`,
  /** Public analysis funnel — signed-out visitors get one free run here. */
  ANALYZE: "/analyze",
  JOBS: "/jobs",
  JOBS_HISTORY: "/jobs/history",
  /** History page with one analysis' detail overlay already open. */
  JOBS_HISTORY_ANALYSIS: (id: string) => `/jobs/history?analysis=${id}`,
} as const;

export const API = {
  HEALTH: "/api/health",
  USERS_ME: "/api/users/me",
  USERS_PSEUDO_CHECK: "/api/users/pseudo",
  USERS_SEARCH: "/api/users/search",
  USERS_FOLLOW: "/api/users/follow",
  USERS_VIEW: "/api/users/view",
  USERS_FOLLOWERS: "/api/users/followers",
  USERS_FOLLOWING: "/api/users/following",
  AUTH_LOGOUT: "/api/auth/logout",
  URL_TITLE: "/api/url-title",
  MESSAGES_CONVERSATIONS: "/api/messages/conversations",
  MESSAGES_CONVERSATION_MESSAGES: (id: string) =>
    `/api/messages/conversations/${id}/messages`,
  MESSAGES_CONVERSATION_READ: (id: string) =>
    `/api/messages/conversations/${id}/read`,
  HOME_STATS: "/api/home/stats",
  HOME_NOTIFICATIONS: "/api/home/notifications",
  HOME_NOTIFICATIONS_READ: "/api/home/notifications/read",
  ANALYZE_JOB: "/api/analyze-job",
  ANALYSIS: (id: string) => `/api/analysis/${id}`,
  HISTORY: "/api/history",
  CV_PARSE: "/api/cv/parse",
  RESUME: (id: string) => `/api/resume/${id}`,
  RESUME_PDF: (id: string) => `/api/resume/${id}/pdf`,
  RESUME_PROFILE_PDF: "/api/resume/profile/pdf",
} as const;

export const EXTERNAL_API = {
  PHOTON_GEOCODE: "https://photon.komoot.io/api/",
  FAVICON: "https://www.google.com/s2/favicons",
} as const;

// --- Durations -------------------------------------------------------------

/** One day in milliseconds (rate-limit windows, cookie lifetimes). */
export const DAY_MS = 24 * 60 * 60 * 1000;

export const SIGNUP_FORM_ID = "signup-step-form";

/** Minimum age (in years) required to create an account. */
export const MIN_SIGNUP_AGE = 16;

// --- Pseudo (username) -----------------------------------------------------

/** Min / max length of a user pseudo. */
export const PSEUDO_MIN_LENGTH = 3;
export const PSEUDO_MAX_LENGTH = 30;

/** Allowed pseudo format: lowercase letters and dots only (no spaces/digits). */
export const PSEUDO_REGEX = /^[a-z.]+$/;

// --- Job-analysis pipeline -------------------------------------------------

/** Max job analyses a user can launch per rolling hour (rate-limit). */
export const ANALYSES_PER_HOUR = 100;

/** Max characters of sanitized job HTML sent to Mistral (token guardrail). */
export const JOB_TEXT_CHAR_LIMIT = 12000;

/** Embedding dimension for `mistral-embed` (matches the `vector(1024)` column). */
export const EMBEDDING_DIM = 1024;

// --- CV import (OCR) -------------------------------------------------------

/** Max size of an uploaded CV. Comfortably above a text-heavy scanned PDF. */
export const CV_MAX_BYTES = 10 * 1024 * 1024;

/** Content types accepted by `POST /api/cv/parse` (PDF + the common photo formats). */
export const CV_ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

/** `accept` attribute for the CV file picker, derived from the accepted types. */
export const CV_ACCEPT_ATTRIBUTE = CV_ACCEPTED_MIME_TYPES.join(",");

/** Max characters of OCR'd CV markdown sent to Mistral (token guardrail). */
export const CV_TEXT_CHAR_LIMIT = 20000;

/**
 * CV imports an anonymous caller may run per day, per IP. `/api/cv/parse` is
 * open by design (it serves the signup wizard *and* the signed-out analysis
 * funnel) and each call costs an OCR + an LLM request. Set well above what a
 * real visitor needs, so a shared office or campus IP isn't punished.
 * Signed-in users are not limited by it.
 */
export const CV_PARSE_PER_IP_PER_DAY = 20;

// --- Anonymous analysis ----------------------------------------------------

/** Identifies a signed-out visitor's analyses (httpOnly). */
export const ANON_SESSION_COOKIE = "maium_anon";

/** Records that the one free analysis has been spent (httpOnly). */
export const ANON_USED_COOKIE = "maium_anon_used";

/** Client-side mirror of {@link ANON_USED_COOKIE}, for painting the right screen. */
export const ANON_USED_STORAGE_KEY = "maium.anonAnalysisUsed";

/** How long a signed-out visitor can come back to their results. */
export const ANON_SESSION_MAX_AGE_S = 7 * 24 * 60 * 60;

/** The free run is a lifetime allowance, so its marker outlives the session. */
export const ANON_USED_MAX_AGE_S = 365 * 24 * 60 * 60;

/**
 * Analyses a signed-out visitor may run per IP per day.
 *
 * The cookie above is the nominal limit — one run, then sign up. This is the
 * backstop for clearing cookies, and is deliberately above 1 so a shared office
 * or CGNAT address isn't locked out by one colleague's visit.
 */
export const ANON_ANALYSES_PER_IP_PER_DAY = 3;

/**
 * How often the signed-out progress UI re-checks an analysis. Realtime is
 * unavailable there (no RLS policy matches a NULL `user_id`), so it polls.
 */
export const ANALYSIS_POLL_INTERVAL_MS = 1500;

/** Prompt version stamped on stored analyses for auditability. */
export const PROMPT_VERSION = "v1";

// --- Messaging -------------------------------------------------------------

// Number of messages fetched per page (initial load + each upward scroll).
export const MESSAGES_PAGE_SIZE = 30;

/** Max characters of a message shown as the conversation-list preview. */
export const MESSAGE_PREVIEW_MAX_LENGTH = 50;

/** Consecutive messages from the same sender within this window are grouped. */
export const MESSAGE_GROUP_WINDOW_MS = 5 * 60 * 1000;

/** Minimum gap between "typing" broadcasts while the user keeps typing. */
export const TYPING_BROADCAST_THROTTLE_MS = 2000;

/** How long a received "typing" indicator stays visible without a refresh. */
export const TYPING_INDICATOR_TIMEOUT_MS = 3000;

/** Debounce before refetching the list when a brand-new conversation appears. */
export const CONVERSATIONS_REFETCH_DEBOUNCE_MS = 800;

/** Debounce before refetching home stats after a Realtime "refresh" ping. */
export const HOME_STATS_REFETCH_DEBOUNCE_MS = 800;

/** How many recent analyses the home dashboard previews before the history. */
export const HOME_RECENT_ANALYSES_LIMIT = 4;

// --- Profile photos --------------------------------------------------------

/** Number of bundled default profile photos in `/public/assets`. */
export const DEFAULT_PROFILE_PHOTO_COUNT = 10;

/** Path to a bundled default profile photo (1-based index). */
export const DEFAULT_PROFILE_PHOTO = (index: number) =>
  `/assets/defaultProfilePhoto${index}.png`;

/** Decorative frame overlaid on a framed profile photo. */
export const DEFAULT_FRAME = "/assets/defaultFrame.png";

/** Illustrations bundled in `/public/assets/illustrations`. */
export const ILLUSTRATIONS = {
  ANALYZE_JOBS: "/assets/illustrations/analyseJobsIllustration.png",
  DOWNLOAD_RESUME: "/assets/illustrations/downloadResumeIllustration.png",
} as const;

/** Supabase Storage bucket holding user-uploaded profile photos. */
export const PROFILE_PHOTO_BUCKET = "profile-photos";

/** Profile photo aspect ratio (width / height) — 5:7 portrait. */
export const PROFILE_PHOTO_ASPECT = 5 / 7;

/** Max accepted upload size for a profile photo, in bytes (5 MB). */
export const PROFILE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;

/** Longest edge (px) of the exported, cropped profile photo. */
export const PROFILE_PHOTO_OUTPUT_WIDTH = 700;

export const EXPERIENCE_NAMESPACE = {
  professional: "experience.professional",
  educational: "experience.educational",
} as const;

export type ExperienceNamespace =
  (typeof EXPERIENCE_NAMESPACE)[keyof typeof EXPERIENCE_NAMESPACE];

/** Allowed gender values (stored as canonical codes; labels are translated). */
export const GENDERS = ["male", "female", "other"] as const;

export type Gender = (typeof GENDERS)[number];
