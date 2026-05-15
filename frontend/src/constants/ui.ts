export const PRIMARY_COLORS =
  "bg-radial from-secondary-400 from-10% to-primary to-90% text-on-primary hover:from-primary hover:to-secondary-400 inset-shadow-light-100/60";
export const INVERSE_COLORS =
  "bg-inverse-50 text-txt-inverse hover:bg-inverse-200 inset-shadow-surface-50/80";
export const OUTLINE_COLORS =
  "text-txt border-b border-brd-200 hover:bg-surface-200 inset-shadow-primary-200/80 dark:inset-shadow-primary-400/80";
export const GHOST_COLORS =
  "bg-transparent text-txt hover:bg-surface-200 shadow-none inset-shadow-transparent";

export type UIVariant = "primary" | "inverse" | "outline" | "ghost";

export const UI_VARIANTS: Record<UIVariant, string> = {
  primary: PRIMARY_COLORS,
  inverse: INVERSE_COLORS,
  outline: OUTLINE_COLORS,
  ghost: GHOST_COLORS,
};
