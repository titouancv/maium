import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { getResumeById } from "@/lib/jobs/server";
import { ROUTES } from "@/constants";
import { parseSocialUrl } from "@/lib/socialNetwork";
import { sortExperiences } from "./experiencePeriod";
import type { ResumePdfData } from "./types";

/**
 * Assembles the data a resume template needs: the optimized `resume_json`
 * (RLS-scoped via `getResumeById`, including the AI-optimized experiences and
 * education) plus the owner's header fields read from the authenticated user's
 * own `public.users` row.
 * Returns `null` when the resume does not exist or isn't visible to the user.
 */
export async function buildResumePdfData(
  resumeId: string,
  origin: string,
): Promise<ResumePdfData | null> {
  const result = await getResumeById(resumeId);
  if (!result) return null;

  const { resume_json } = result.resume;

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

  const socialNetworks = [...(profile?.user_social_networks ?? [])]
    .sort((a, b) => a.position - b.position)
    .map(({ url }) => {
      const info = parseSocialUrl(url);
      return info ? { name: info.name, handle: info.handle, url } : null;
    })
    .filter((s): s is { name: string; handle: string; url: string } => s !== null);

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
    headline: resume_json.headline ?? "",
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
