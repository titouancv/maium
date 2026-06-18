export * from "./ui";

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
  /** Home with the story reader deep-linked open (opened by `StoriesRow`). */
  STORY: (id: string) => `/?story=${id}`,
  PRIVACY_POLICY: "/privacy-policy",
  MESSAGES: "/messages",
  CONVERSATION: (id: string) => `/messages/${id}`,
  JOBS: "/jobs",
  JOBS_HISTORY: "/jobs/history",
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
  RESUME: (id: string) => `/api/resume/${id}`,
  RESUME_PDF: (id: string) => `/api/resume/${id}/pdf`,
  RESUME_PROFILE_PDF: "/api/resume/profile/pdf",
  STORIES: "/api/stories",
  STORY: (id: string) => `/api/stories/${id}`,
  STORY_VIEW: (id: string) => `/api/stories/${id}/view`,
  STORY_LIKE: (id: string) => `/api/stories/${id}/like`,
  STORY_REPOST: (id: string) => `/api/stories/${id}/repost`,
} as const;

export const EXTERNAL_API = {
  PHOTON_GEOCODE: "https://photon.komoot.io/api/",
  FAVICON: "https://www.google.com/s2/favicons",
} as const;

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

// --- Profile photos --------------------------------------------------------

/** Number of bundled default profile photos in `/public/assets`. */
export const DEFAULT_PROFILE_PHOTO_COUNT = 10;

/** Path to a bundled default profile photo (1-based index). */
export const DEFAULT_PROFILE_PHOTO = (index: number) =>
  `/assets/defaultProfilePhoto${index}.png`;

/** Decorative frame overlaid on a framed profile photo. */
export const DEFAULT_FRAME = "/assets/defaultFrame.png";

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
