import type { Gender } from "@/constants";
import { Experience } from "./experience";

export interface Hobby {
  title: string;
  description: string;
}

export type HobbyData = Hobby;

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
  projects?: string[];
}
