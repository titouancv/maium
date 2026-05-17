export * from "./ui";

export const ROUTES = {
  HOME: "/",
  SIGNUP: "/signup",
  SETTINGS: "/settings",
  SETTINGS_ACCOUNT: "/settings/account",
  SETTINGS_PERSONAL_DATA: "/settings/personal-data",
  UPDATE_EXPERIENCE_PRO: "/update-experience/professional",
  UPDATE_EXPERIENCE_EDU: "/update-experience/educational",
  AUTH_CALLBACK: "/auth/callback",
} as const;

export const CONFIG = {} as const;

export const API = {
  HEALTH: "/api/health",
  USERS: "/api/users",
  USERS_ME: "/api/users/me",
  USERS_PSEUDO_CHECK: "/api/users/pseudo",
  AUTH_LOGOUT: "/api/auth/logout",
} as const;

export const EXTERNAL_API = {
  PHOTON_GEOCODE: "https://photon.komoot.io/api/",
  RESTCOUNTRIES: "https://restcountries.com/v3.1",
} as const;

export const SIGNUP_FORM_ID = "signup-step-form";
