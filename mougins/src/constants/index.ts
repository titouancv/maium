import { routing } from "@/i18n/routing";

export * from "./ui";

export const APP_NAME = "maium";

export const LOCALES = routing.locales;

export type Locale = (typeof LOCALES)[number];

export const LANGUAGE_NAMES: Record<Locale, string> = {
  en: "English",
  fr: "French",
};

export const ROUTES = {
  HOME: "/",
  SIGNUP: "/signup",
  SETTINGS: "/settings",
  SETTINGS_ACCOUNT: "/settings/account",
  SETTINGS_MY_INFORMATION: "/settings/my-information",
  SETTINGS_PERSONALIZATION: "/settings/personalization",
  SETTINGS_NOTIFICATIONS: "/settings/notifications",
  SETTINGS_DREAM_JOB: "/settings/dream-job",
  UNSUBSCRIBED: "/unsubscribed",
  AUTH_CALLBACK: "/auth/callback",
  PROFILE: (pseudo: string) => `/profile/${pseudo}`,
  PROFILE_FOLLOWERS: (pseudo: string) => `/profile/${pseudo}/followers`,
  PROFILE_FOLLOWING: (pseudo: string) => `/profile/${pseudo}/following`,
  PRIVACY_POLICY: "/privacy-policy",
  MESSAGES: "/messages",
  CONVERSATION: (id: string) => `/messages/${id}`,
  ANALYZE: "/analyze",
  JOBS: "/jobs",
  JOBS_HISTORY: "/jobs/history",
  JOB_ANALYSIS: (id: string) => `/jobs/${id}`,
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
  RESUME_TRANSLATE: "/api/resume/translate",
  ANALYSIS_CONTACTS_COUNT: (id: string) => `/api/analysis/${id}/contacts-count`,
  EMAIL_UNSUBSCRIBE: "/api/email/unsubscribe",
  CRON_NOTIFICATION_EMAILS: "/api/cron/notification-emails",
} as const;

export const SNOOZE_EMAIL_BATCH_LIMIT = 200;

export const ANALYTICS_EVENTS = {
  ANON_CV_PARSED: "anon_cv_parsed",
  ANON_ANALYSIS_SUBMITTED: "anon_analysis_submitted",
  ANON_QUOTA_BLOCKED: "anon_quota_blocked",
  ANON_RESULT_VIEWED: "anon_result_viewed",
  ANON_RESULT_RESTORED: "anon_result_restored",
  ANON_GATE_VIEWED: "anon_gate_viewed",
  ANON_SIGNIN_CLICKED: "anon_signin_clicked",
  ANON_CLAIM_SUCCEEDED: "anon_claim_succeeded",
} as const;

export const SIGNIN_SOURCES = [
  "result_cta",
  "locked_contacts",
  "locked_tracking",
  "gate",
] as const;

export type SigninSource = (typeof SIGNIN_SOURCES)[number];

export const EXTERNAL_API = {
  PHOTON_GEOCODE: "https://photon.komoot.io/api/",
  FAVICON: "https://www.google.com/s2/favicons",
  YOUTUBE_SEARCH: "https://www.youtube.com/results",
  GOOGLE_SEARCH: "https://www.google.com/search",
  MISTRAL_CHAT: "https://chat.mistral.ai/chat",
} as const;

export const DAY_MS = 24 * 60 * 60 * 1000;

export const SIGNUP_FORM_ID = "signup-step-form";

export const MIN_SIGNUP_AGE = 16;

export const PSEUDO_MIN_LENGTH = 3;
export const PSEUDO_MAX_LENGTH = 30;

export const PSEUDO_REGEX = /^[a-z.]+$/;

export const ANALYSES_PER_HOUR = 100;

export const JOB_TEXT_CHAR_LIMIT = 12000;

export const EMBEDDING_DIM = 1024;

export const CV_MAX_BYTES = 10 * 1024 * 1024;

export const CV_ACCEPTED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

export const CV_ACCEPT_ATTRIBUTE = CV_ACCEPTED_MIME_TYPES.join(",");

export const CV_TEXT_CHAR_LIMIT = 20000;

export const CV_PARSE_PER_IP_PER_DAY = 20;

export const ANON_SESSION_COOKIE = "maium_anon";

export const ANON_USED_COOKIE = "maium_anon_used";

export const ANON_USED_STORAGE_KEY = "maium.anonAnalysisUsed";

export const ANON_ANALYSIS_STORAGE_KEY = "maium.anonAnalysisId";

export const ANON_PENDING_JOB_STORAGE_KEY = "maium.anonPendingJob";

export const ANON_ANALYSIS_RETENTION_DAYS = 7;

export const ANON_SESSION_MAX_AGE_S =
  ANON_ANALYSIS_RETENTION_DAYS * 24 * 60 * 60;

export const ANON_USED_MAX_AGE_S = 365 * 24 * 60 * 60;

export const ANON_ANALYSES_PER_IP_PER_DAY = 3;

export const ANALYSIS_POLL_INTERVAL_MS = 1500;

export const ANALYSIS_NOTES_CHAR_LIMIT = 4000;

export const ANALYSIS_LOW_CONFIDENCE_SCORE = 75;

export const ANALYSIS_SNOOZE_DAYS = [7, 14, 30] as const;

export const COMPANY_CONTACTS_LIMIT = 8;

export const PROMPT_VERSION = "v2";

export const MESSAGES_PAGE_SIZE = 30;

export const MESSAGE_PREVIEW_MAX_LENGTH = 50;

export const MESSAGE_GROUP_WINDOW_MS = 5 * 60 * 1000;

export const TYPING_BROADCAST_THROTTLE_MS = 2000;

export const TYPING_INDICATOR_TIMEOUT_MS = 3000;

export const CONVERSATIONS_REFETCH_DEBOUNCE_MS = 800;

export const HOME_STATS_REFETCH_DEBOUNCE_MS = 800;

export const HOME_RECENT_ANALYSES_LIMIT = 4;

export const DEFAULT_PROFILE_PHOTO = "/assets/avatarMaium.png";

export const DEFAULT_FRAME = "/assets/defaultFrame.png";

export const ILLUSTRATIONS = {
  ANALYZE_JOBS: "/assets/illustrations/analyseJobsIllustration.png",
  DOWNLOAD_RESUME: "/assets/illustrations/downloadResumeIllustration.png",
} as const;

export const PROFILE_PHOTO_BUCKET = "profile-photos";

export const PROFILE_PHOTO_ASPECT = 5 / 7;

export const PROFILE_PHOTO_MAX_BYTES = 5 * 1024 * 1024;

export const PROFILE_PHOTO_OUTPUT_WIDTH = 700;

export const EXPERIENCE_NAMESPACE = {
  professional: "experience.professional",
  educational: "experience.educational",
} as const;

export type ExperienceNamespace =
  (typeof EXPERIENCE_NAMESPACE)[keyof typeof EXPERIENCE_NAMESPACE];

export const GENDERS = ["male", "female", "other"] as const;

export type Gender = (typeof GENDERS)[number];

export const DREAM_COMPANY_TYPES = [
  "startup",
  "scaleup",
  "sme",
  "corporate",
  "nonprofit",
  "freelance",
] as const;

export type DreamCompanyType = (typeof DREAM_COMPANY_TYPES)[number];

export const DREAM_WORK_MODES = [
  "flexible",
  "remote",
  "hybrid",
  "onsite",
] as const;

export type DreamWorkMode = (typeof DREAM_WORK_MODES)[number];
