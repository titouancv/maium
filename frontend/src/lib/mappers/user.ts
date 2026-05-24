import type { Experience } from "@/types/experience";
import type { UserData, Hobby } from "@/types/user";

export type DbExperience = {
  type: "professional" | "educational" | "personal";
  organization: string;
  role: string;
  start_period: number;
  end_period: number | null;
  description: string | null;
  website: string | null;
  location: string | null;
  position: number;
};

export type DbSkill = { name: string; position: number };
export type DbProject = { url: string; position: number };
export type DbSocialNetwork = { url: string; position: number };
export type DbHobby = { title: string; description: string; position: number };

export type DbUserRaw = {
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  pseudo?: string | null;
  dob?: string | null;
  onboarding_completed?: boolean;
  phone?: string | null;
  nationality?: string | null;
  location?: string | null;
  bio?: string | null;
  user_experiences?: DbExperience[];
  user_skills?: DbSkill[];
  user_projects?: DbProject[];
  user_social_networks?: DbSocialNetwork[];
  user_hobbies?: DbHobby[];
};

function byPosition<T extends { position: number }>(a: T, b: T) {
  return a.position - b.position;
}

function mapExperience(e: DbExperience): Experience {
  return {
    organization: e.organization,
    role: e.role,
    startPeriod: e.start_period,
    endPeriod: e.end_period ?? undefined,
    description: e.description ?? undefined,
    website: e.website ?? undefined,
    location: e.location ?? undefined,
  };
}

export function mapUserFromDb(raw: DbUserRaw): UserData {
  const exps = [...(raw.user_experiences ?? [])].sort(byPosition);

  return {
    email: raw.email ?? "",
    first_name: raw.first_name ?? "",
    last_name: raw.last_name ?? "",
    pseudo: raw.pseudo ?? "",
    dob: raw.dob ? new Date(raw.dob + "T00:00:00Z").getTime() : null,
    onboarding_completed: raw.onboarding_completed,
    phone: raw.phone,
    nationality: raw.nationality,
    location: raw.location,
    bio: raw.bio,
    professional_experiences: exps.filter((e) => e.type === "professional").map(mapExperience),
    educational_experiences: exps.filter((e) => e.type === "educational").map(mapExperience),
    personal_experiences: exps.filter((e) => e.type === "personal").map(mapExperience),
    skills: [...(raw.user_skills ?? [])].sort(byPosition).map((s) => s.name),
    projects: [...(raw.user_projects ?? [])].sort(byPosition).map((p) => p.url),
    social_networks: [...(raw.user_social_networks ?? [])].sort(byPosition).map((s) => s.url),
    hobbies: [...(raw.user_hobbies ?? [])].sort(byPosition).map(
      (h): Hobby => ({ title: h.title, description: h.description }),
    ),
  };
}

/** Subset select string to embed all child tables (for use in .select()). */
export const USER_PROFILE_SELECT = `
  user_experiences(type, organization, role, start_period, end_period, description, website, location, position),
  user_skills(name, position),
  user_projects(url, position),
  user_social_networks(url, position),
  user_hobbies(title, description, position)
`.trim();
