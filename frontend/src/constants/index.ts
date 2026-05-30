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
} as const;

export const EXTERNAL_API = {
  PHOTON_GEOCODE: "https://photon.komoot.io/api/",
  FAVICON: "https://www.google.com/s2/favicons",
} as const;

export const SIGNUP_FORM_ID = "signup-step-form";

export const EXPERIENCE_NAMESPACE = {
  professional: "experience.professional",
  educational: "experience.educational",
} as const;

export type ExperienceNamespace =
  (typeof EXPERIENCE_NAMESPACE)[keyof typeof EXPERIENCE_NAMESPACE];
