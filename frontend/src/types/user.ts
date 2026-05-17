import { Experience } from "./experience";

export interface UserData {
  email: string;
  first_name: string;
  last_name: string;
  pseudo: string;
  dob: string;
  onboarding_completed?: boolean;
  phone?: string | null;
  nationality?: string | null;
  location?: string | null;
  professional_experiences?: Experience[];
  educational_experiences?: Experience[];
}
