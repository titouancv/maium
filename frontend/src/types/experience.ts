export const EXPERIENCE_TYPES = [
  "professional",
  "educational",
  "personal",
] as const;
export type ExperienceType = (typeof EXPERIENCE_TYPES)[number];

export interface Experience {
  organization: string;
  role: string;
  startPeriod: number;
  endPeriod?: number;
  description?: string;
  website?: string;
  location?: string;
}

export interface ExperienceFormData {
  organization: string;
  role: string;
  startPeriod: number;
  endPeriod?: number;
  description: string;
  website: string;
  location: string;
}

export type ExperienceItemRecord = Record<string, string>;
export type ExperienceFormItems = { items: ExperienceItemRecord[] };
