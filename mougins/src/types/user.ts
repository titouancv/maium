import type { DreamWorkMode, Gender, HobbyCategory, Locale } from "@/constants";
import { Experience } from "./experience";

export interface Hobby {
  title: string;
  description: string;
  category: HobbyCategory;
  imageUrl?: string;
  sourceUrl?: string;
}

export type HobbyData = Hobby;

export interface UserPhoto {
  id: string;
  url: string;
  position: number;
}

export interface Project {
  title: string;
  bio?: string;
  websiteUrl?: string;
  githubUrl?: string;
  imageUrl?: string;
  imagePath?: string;
}

export interface UserSummary {
  pseudo: string;
  first_name: string;
  last_name: string;
  location?: string | null;
  profile_photo?: string | null;
  gender?: Gender | null;
  is_following?: boolean;
}

export interface SuggestedUser extends UserSummary {
  followers_count: number;
}

export interface UserData {
  id?: string;
  email: string;
  first_name: string;
  last_name: string;
  pseudo: string;
  dob: number | null;
  gender?: Gender | null;
  onboarding_completed?: boolean;
  email_notifications?: boolean;
  locale?: Locale;
  phone?: string | null;
  nationality?: string | null;
  location?: string | null;
  bio?: string | null;
  profile_photo?: string | null;
  professional_experiences?: Experience[];
  educational_experiences?: Experience[];
  social_networks?: string[];
  hobbies?: Hobby[];
  personal_experiences?: Experience[];
  skills?: string[];
  projects?: Project[];
  photos?: UserPhoto[];
  dream_company_types?: string[];
  dream_work_mode?: DreamWorkMode | null;
  dream_location?: string | null;
  dream_salary?: number | null;
  dream_industries?: string[];
  dream_company_values?: string | null;
}
