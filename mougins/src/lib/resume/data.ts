import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getResumeById } from "@/lib/jobs/server";
import type { CvExtraction } from "@/lib/validators/cv";
import { getCurrentUserProfile } from "@/lib/auth/getCurrentUser";
import { ROUTES } from "@/constants";
import { parseSocialUrl } from "@/lib/socialNetwork";
import { sortExperiences } from "./experiencePeriod";
import { profileToResumeJson } from "./profileResume";
import type { ResumePdfData } from "./types";
import type { ResumeJson } from "@/types/job";

type SocialLink = { name: string; handle: string; url: string };

function resolveSocialNetworks(urls: string[]): SocialLink[] {
  return urls
    .map((url) => {
      const info = parseSocialUrl(url);
      return info ? { name: info.name, handle: info.handle, url } : null;
    })
    .filter((s): s is SocialLink => s !== null);
}

async function buildAnonResumeHeader(
  analysisId: string | null,
): Promise<Pick<
  ResumePdfData,
  | "fullName"
  | "contact"
  | "socialNetworks"
  | "pseudo"
  | "profileUrl"
  | "profileQrCode"
> | null> {
  if (!analysisId) return null;

  const { data } = await createAdminClient()
    .from("analysis_jobs")
    .select("cv_extraction")
    .eq("analysis_id", analysisId)
    .not("cv_extraction", "is", null)
    .maybeSingle();

  const cv = data?.cv_extraction as CvExtraction | null | undefined;
  if (!cv) return null;

  const fullName = [cv.firstName, cv.lastName].filter(Boolean).join(" ").trim();

  return {
    fullName,
    contact: {
      email: null,
      phone: cv.phone ?? null,
      location: cv.location ?? null,
    },
    socialNetworks: resolveSocialNetworks(cv.socialNetworks ?? []),
    pseudo: "",
    profileUrl: "",
    profileQrCode: "",
  };
}

export async function buildResumePdfData(
  resumeId: string,
  origin: string,
  overrideJson?: ResumeJson,
): Promise<ResumePdfData | null> {
  const result = await getResumeById(resumeId);
  if (!result) return null;

  const resume_json = overrideJson ?? result.resume.resume_json;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const header = await buildAnonResumeHeader(result.resume.analysis_id);
    if (!header) return null;
    return {
      ...header,
      summary: resume_json.summary ?? "",
      experiences: sortExperiences(resume_json.experiences ?? []),
      skills: resume_json.skills ?? [],
      education: sortExperiences(resume_json.education ?? []),
    };
  }

  const { data: profile } = await supabase
    .from("users")
    .select(
      `first_name, last_name, email, phone, location, pseudo, user_social_networks(url, position)`,
    )
    .eq("id", user.id)
    .single();

  const socialNetworks = resolveSocialNetworks(
    [...(profile?.user_social_networks ?? [])]
      .sort((a, b) => a.position - b.position)
      .map(({ url }) => url),
  );

  const fullName = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  const profileUrl = profile?.pseudo
    ? `${origin}${ROUTES.PROFILE(profile.pseudo)}`
    : "";

  const profileQrCode = profileUrl
    ? await QRCode.toDataURL(profileUrl, { margin: 0, width: 160 })
    : "";

  return {
    fullName: fullName || (profile?.email ?? ""),
    contact: {
      email: profile?.email ?? null,
      phone: profile?.phone ?? null,
      location: profile?.location ?? null,
    },
    summary: resume_json.summary ?? "",
    socialNetworks,
    pseudo: profile?.pseudo ?? "",
    profileUrl,
    profileQrCode,
    experiences: sortExperiences(resume_json.experiences ?? []),
    skills: resume_json.skills ?? [],
    education: sortExperiences(resume_json.education ?? []),
  };
}

export async function buildProfileResumePdfData(
  origin: string,
  overrideJson?: ResumeJson,
): Promise<ResumePdfData | null> {
  const profile = await getCurrentUserProfile();
  if (!profile) return null;

  const resume_json = overrideJson ?? profileToResumeJson(profile);

  const fullName = [profile.first_name, profile.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  const profileUrl = profile.pseudo
    ? `${origin}${ROUTES.PROFILE(profile.pseudo)}`
    : "";
  const profileQrCode = profileUrl
    ? await QRCode.toDataURL(profileUrl, { margin: 0, width: 160 })
    : "";

  return {
    fullName: fullName || profile.email,
    contact: {
      email: profile.email || null,
      phone: profile.phone ?? null,
      location: profile.location ?? null,
    },
    summary: resume_json.summary ?? "",
    socialNetworks: resolveSocialNetworks(profile.social_networks ?? []),
    pseudo: profile.pseudo,
    profileUrl,
    profileQrCode,
    experiences: sortExperiences(resume_json.experiences ?? []),
    skills: resume_json.skills ?? [],
    education: sortExperiences(resume_json.education ?? []),
  };
}
