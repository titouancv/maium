import { SettingsMyInformationContent } from "@/components/pages/settings";
import { getCurrentUserProfile } from "@/lib/auth/getCurrentUser";

export default function SettingsMyInformationPage() {
  // Not awaited: streams into the menu's Suspense boundary.
  const userPromise = getCurrentUserProfile();

  return <SettingsMyInformationContent userPromise={userPromise} />;
}
