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

/** Resolves a list of profile social URLs into named, ordered links. */
function resolveSocialNetworks(urls: string[]): SocialLink[] {
  return urls
    .map((url) => {
      const info = parseSocialUrl(url);
      return info ? { name: info.name, handle: info.handle, url } : null;
    })
    .filter((s): s is SocialLink => s !== null);
}

/**
 * Header fields for a resume produced by a signed-out run, taken from the CV
 * the visitor uploaded — there is no `public.users` row to read.
 *
 * The extraction lives on the driving `analysis_jobs` row, reached through the
 * resume's `analysis_id`. Ownership was already settled by `getResumeById`, so
 * this only assembles data.
 */
async function buildAnonResumeHeader(
  analysisId: string | null,
): Promise<Pick<
  ResumePdfData,
  "fullName" | "contact" | "socialNetworks" | "pseudo" | "profileUrl" | "profileQrCode"
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
      // A signed-out visitor never gave us an email — only what the CV held.
      email: null,
      phone: cv.phone ?? null,
      location: cv.location ?? null,
    },
    socialNetworks: resolveSocialNetworks(cv.socialNetworks ?? []),
    // Both point at a maium profile, which doesn't exist yet. The QR would
    // otherwise encode a 404, so it is left off.
    pseudo: "",
    profileUrl: "",
    profileQrCode: "",
  };
}

/**
 * Assembles the data a resume template needs: the optimized `resume_json`
 * (ownership-scoped via `getResumeById`, including the AI-optimized experiences
 * and education) plus the owner's header fields.
 *
 * The header comes from the signed-in user's `public.users` row, or — for a
 * resume produced by a signed-out run — from the CV that drove it.
 * Returns `null` when the resume does not exist or isn't visible to the caller.
 *
 * When `overrideJson` is provided (user-edited content from the resume editor),
 * it replaces the stored `resume_json` for rendering only — nothing is
 * persisted. `getResumeById` is still called to enforce ownership / existence.
 */
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

  // Pre-render the QR as a PNG data-URL so the template stays a pure renderer.
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

/**
 * Assembles resume PDF data from the authenticated user's profile alone — no job
 * analysis involved. Unlike {@link buildResumePdfData}, the experiences,
 * education, skills and summary are sourced straight from the profile
 * (`public.users` + child tables) via `getCurrentUserProfile`.
 * Returns `null` when there is no authenticated user.
 *
 * When `overrideJson` is provided (edits from the resume editor), it replaces
 * the profile-derived body for rendering only — nothing is persisted. The
 * header (name, contact, social links, QR) is always taken from the profile.
 */
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
