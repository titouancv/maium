import { SettingsMyInformationContent } from "@/components/pages/settings";
import { getCurrentUserProfile } from "@/lib/auth/getCurrentUser";

export default function SettingsMyInformationPage() {
  const userPromise = getCurrentUserProfile();

  return <SettingsMyInformationContent userPromise={userPromise} />;
}
