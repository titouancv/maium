import { Experience } from "./experience";

export interface Hobby {
  title: string;
  description: string;
}

export type HobbyData = Hobby;

export interface UserData {
  email: string;
  first_name: string;
  last_name: string;
  pseudo: string;
  dob: number | null;
  onboarding_completed?: boolean;
  phone?: string | null;
  nationality?: string | null;
  location?: string | null;
  bio?: string | null;
  professional_experiences?: Experience[];
  educational_experiences?: Experience[];
  social_networks?: string[];
  hobbies?: Hobby[];
  personal_experiences?: Experience[];
  skills?: string[];
  projects?: string[];
}

export type PublicUserData = Omit<UserData, "email" | "phone" | "onboarding_completed"> & {
  followers_count: number;
  following_count: number;
};
