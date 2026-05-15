export * from "./ui";

export const ROUTES = {
  HOME: "/",
  SIGNUP: "/signup",
  WELCOME: "/welcome",
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
