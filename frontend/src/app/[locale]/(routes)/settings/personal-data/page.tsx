import { SettingsPersonalDataContent } from "@/components/pages/settings";
import { getCurrentUserProfile } from "@/lib/auth/getCurrentUser";

export default function SettingsPersonalDataPage() {
  // Not awaited: streams into the menu's Suspense boundary.
  const userPromise = getCurrentUserProfile();

  return <SettingsPersonalDataContent userPromise={userPromise} />;
}
