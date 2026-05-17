export const EXPERIENCE_TYPES = ["professional", "educational"] as const;
export type ExperienceType = (typeof EXPERIENCE_TYPES)[number];

export interface Experience {
  organization: string;
  role: string;
  startPeriod: string;
  endPeriod?: string;
  description?: string;
  website?: string;
  location?: string;
}

export interface ExperienceFormData {
  organization: string;
  role: string;
  startPeriod: string;
  endPeriod?: string;
  description: string;
  website: string;
  location: string;
}
