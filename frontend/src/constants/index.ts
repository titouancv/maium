export * from "./ui";

export const ROUTES = {
  HOME: "/",
  SIGNUP: "/signup",
  SETTINGS: "/settings",
  SETTINGS_ACCOUNT: "/settings/account",
  SETTINGS_PERSONAL_DATA: "/settings/personal-data",
  SETTINGS_PERSONALIZATION: "/settings/personalization",
  AUTH_CALLBACK: "/auth/callback",
  PROFILE: (pseudo: string) => `/profile/${pseudo}`,
  PROFILE_FOLLOWERS: (pseudo: string) => `/profile/${pseudo}/followers`,
  PROFILE_FOLLOWING: (pseudo: string) => `/profile/${pseudo}/following`,
  PRIVACY_POLICY: "/privacy-policy",
  MESSAGES: "/messages",
  CONVERSATION: (id: string) => `/messages/${id}`,
  JOBS: "/jobs",
} as const;

export const API = {
  HEALTH: "/api/health",
  USERS: "/api/users",
  USERS_ME: "/api/users/me",
  USERS_PSEUDO_CHECK: "/api/users/pseudo",
  USERS_SEARCH: "/api/users/search",
  USERS_FOLLOW: "/api/users/follow",
  USERS_FOLLOWERS: "/api/users/followers",
  USERS_FOLLOWING: "/api/users/following",
  AUTH_LOGOUT: "/api/auth/logout",
  URL_TITLE: "/api/url-title",
  MESSAGES_CONVERSATIONS: "/api/messages/conversations",
  MESSAGES_CONVERSATION_MESSAGES: (id: string) =>
    `/api/messages/conversations/${id}/messages`,
  MESSAGES_CONVERSATION_READ: (id: string) =>
    `/api/messages/conversations/${id}/read`,
  ANALYZE_JOB: "/api/analyze-job",
  ANALYSIS: (id: string) => `/api/analysis/${id}`,
  HISTORY: "/api/history",
  RESUME: (id: string) => `/api/resume/${id}`,
} as const;

export const EXTERNAL_API = {
  PHOTON_GEOCODE: "https://photon.komoot.io/api/",
  FAVICON: "https://www.google.com/s2/favicons",
} as const;

export const SIGNUP_FORM_ID = "signup-step-form";

// --- Job-analysis pipeline -------------------------------------------------

/** Max job analyses a user can launch per rolling hour (rate-limit). */
export const ANALYSES_PER_HOUR = 10;

/** Max characters of sanitized job HTML sent to Mistral (token guardrail). */
export const JOB_TEXT_CHAR_LIMIT = 12000;

/** Embedding dimension for `mistral-embed` (matches the `vector(1024)` column). */
export const EMBEDDING_DIM = 1024;

/** Prompt version stamped on stored analyses for auditability. */
export const PROMPT_VERSION = "v1";

// Number of messages fetched per page (initial load + each upward scroll).
export const MESSAGES_PAGE_SIZE = 30;

export const EXPERIENCE_NAMESPACE = {
  professional: "experience.professional",
  educational: "experience.educational",
} as const;

export type ExperienceNamespace =
  (typeof EXPERIENCE_NAMESPACE)[keyof typeof EXPERIENCE_NAMESPACE];
