import {
  LOCALES,
  type DreamWorkMode,
  type Gender,
  type Locale,
} from "@/constants";
import type { Experience } from "@/types/experience";
import type { UserData, Hobby, Project, UserPhoto, UserSummary } from "@/types/user";

export function userToSummary(
  user: Pick<
    UserData,
    | "pseudo"
    | "first_name"
    | "last_name"
    | "location"
    | "profile_photo"
    | "gender"
  >,
): UserSummary {
  return {
    pseudo: user.pseudo,
    first_name: user.first_name,
    last_name: user.last_name,
    location: user.location,
    profile_photo: user.profile_photo,
    gender: user.gender,
  };
}

type DbExperience = {
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

type DbSkill = { name: string; position: number };
type DbPhoto = { id: string; url: string; position: number };
type DbProject = {
  title: string;
  bio: string | null;
  website_url: string | null;
  github_url: string | null;
  image_url: string | null;
  image_path: string | null;
  position: number;
};
type DbSocialNetwork = { url: string; position: number };
type DbHobby = {
  title: string;
  description: string;
  image_url: string | null;
  source_url: string | null;
  position: number;
};

export type DbUserRaw = {
  id?: string | null;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  pseudo?: string | null;
  dob?: string | null;
  gender?: string | null;
  onboarding_completed?: boolean;
  email_notifications?: boolean;
  locale?: string | null;
  phone?: string | null;
  nationality?: string | null;
  location?: string | null;
  bio?: string | null;
  profile_photo?: string | null;
  dream_company_types?: string[] | null;
  dream_work_mode?: string | null;
  dream_location?: string | null;
  dream_salary?: number | null;
  dream_industries?: string[] | null;
  dream_company_values?: string | null;
  user_experiences?: DbExperience[];
  user_skills?: DbSkill[];
  user_projects?: DbProject[];
  user_social_networks?: DbSocialNetwork[];
  user_photos?: DbPhoto[];
  user_hobbies?: DbHobby[];
};

function byPosition<T extends { position: number }>(a: T, b: T) {
  return a.position - b.position;
}

function toLocale(value: string | null | undefined): Locale {
  return LOCALES.includes(value as Locale) ? (value as Locale) : "en";
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
    id: raw.id ?? undefined,
    email: raw.email ?? "",
    first_name: raw.first_name ?? "",
    last_name: raw.last_name ?? "",
    pseudo: raw.pseudo ?? "",
    dob: raw.dob ? new Date(raw.dob + "T00:00:00Z").getTime() : null,
    gender: (raw.gender as Gender | null) ?? null,
    onboarding_completed: raw.onboarding_completed,
    email_notifications: raw.email_notifications ?? true,
    locale: toLocale(raw.locale),
    phone: raw.phone,
    nationality: raw.nationality,
    location: raw.location,
    bio: raw.bio,
    profile_photo: raw.profile_photo ?? null,
    dream_company_types: raw.dream_company_types ?? [],
    dream_work_mode: (raw.dream_work_mode as DreamWorkMode | null) ?? null,
    dream_location: raw.dream_location ?? null,
    dream_salary: raw.dream_salary ?? null,
    dream_industries: raw.dream_industries ?? [],
    dream_company_values: raw.dream_company_values ?? null,
    professional_experiences: exps
      .filter((e) => e.type === "professional")
      .map(mapExperience),
    educational_experiences: exps
      .filter((e) => e.type === "educational")
      .map(mapExperience),
    personal_experiences: exps
      .filter((e) => e.type === "personal")
      .map(mapExperience),
    skills: [...(raw.user_skills ?? [])].sort(byPosition).map((s) => s.name),
    projects: [...(raw.user_projects ?? [])].sort(byPosition).map(
      (p): Project => ({
        title: p.title,
        bio: p.bio ?? undefined,
        websiteUrl: p.website_url ?? undefined,
        githubUrl: p.github_url ?? undefined,
        imageUrl: p.image_url ?? undefined,
        imagePath: p.image_path ?? undefined,
      }),
    ),
    social_networks: [...(raw.user_social_networks ?? [])]
      .sort(byPosition)
      .map((s) => s.url),
    hobbies: [...(raw.user_hobbies ?? [])].sort(byPosition).map(
      (h): Hobby => ({
        title: h.title,
        description: h.description,
        imageUrl: h.image_url ?? undefined,
        sourceUrl: h.source_url ?? undefined,
      }),
    ),
    photos: [...(raw.user_photos ?? [])].sort(byPosition).map(
      (p): UserPhoto => ({ id: p.id, url: p.url, position: p.position }),
    ),
  };
}

export const USER_PROFILE_SELECT = `
  user_experiences(type, organization, role, start_period, end_period, description, website, location, position),
  user_skills(name, position),
  user_projects(title, bio, website_url, github_url, image_url, image_path, position),
  user_social_networks(url, position),
  user_hobbies(title, description, image_url, source_url, position),
  user_photos(id, url, position)
`.trim();
