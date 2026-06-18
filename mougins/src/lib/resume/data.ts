import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { getResumeById } from "@/lib/jobs/server";
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
 * Assembles the data a resume template needs: the optimized `resume_json`
 * (RLS-scoped via `getResumeById`, including the AI-optimized experiences and
 * education) plus the owner's header fields read from the authenticated user's
 * own `public.users` row.
 * Returns `null` when the resume does not exist or isn't visible to the user.
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
  if (!user) return null;

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
