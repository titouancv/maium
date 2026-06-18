export interface Experience {
  organization: string;
  role: string;
  startPeriod: number;
  endPeriod?: number;
  description?: string;
  website?: string;
  location?: string;
}

export type ExperienceItemRecord = Record<string, string>;
export type ExperienceFormItems = { items: ExperienceItemRecord[] };
