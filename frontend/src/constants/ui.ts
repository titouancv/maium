export const PRIMARY_COLORS =
  "bg-radial from-secondary-400 from-10% to-primary to-90% text-on-primary hover:from-primary hover:to-secondary-400 shadow-md inset-shadow-sm transition-colors duration-300 ease-in-out inset-shadow-light-100/60";
const INVERSE_COLORS =
  "bg-inverse-50 text-txt-inverse hover:bg-inverse-200 shadow-md inset-shadow-sm transition-colors duration-300 ease-in-out inset-shadow-surface-50/80";
const OUTLINE_COLORS =
  "text-txt border-b border-brd-200 hover:bg-surface-200 shadow-md inset-shadow-sm transition-colors duration-300 ease-in-out inset-shadow-primary-200/80 dark:inset-shadow-primary-400/80";
const OUTLINE_SECONDARY_COLORS =
  "text-txt border-b border-brd-200 hover:bg-surface-200 shadow-md inset-shadow-sm transition-colors duration-300 ease-in-out inset-shadow-secondary-200/80 dark:inset-shadow-secondary-400/80";
const OUTLINE_MUTED_COLORS =
  "text-txt border-b border-brd-200 hover:bg-surface-200 shadow-md inset-shadow-sm transition-colors duration-300 ease-in-out inset-shadow-dark-200/80";
const GHOST_COLORS = "bg-transparent text-txt hover:text-primary";

export type UIVariant =
  | "primary"
  | "inverse"
  | "outline"
  | "outlineSecondary"
  | "outlineMuted"
  | "ghost";

export const UI_VARIANTS: Record<UIVariant, string> = {
  primary: PRIMARY_COLORS,
  inverse: INVERSE_COLORS,
  outline: OUTLINE_COLORS,
  outlineSecondary: OUTLINE_SECONDARY_COLORS,
  outlineMuted: OUTLINE_MUTED_COLORS,
  ghost: GHOST_COLORS,
};

export type NotificationVariant = "primary" | "surface";

export const NOTIFICATION_VARIANTS: Record<NotificationVariant, string> = {
  primary: "bg-primary text-on-primary",
  surface: "bg-surface-50 text-txt",
};

export type UISize = "none" | "sm" | "md" | "lg";

export type InfoType = "error" | "success" | "info";

export const INFO_COLORS: Record<InfoType, string> = {
  error: "text-error",
  success: "text-primary",
  info: "text-txt",
};
