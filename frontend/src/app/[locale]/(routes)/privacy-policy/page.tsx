import { Suspense } from "react";
import { PrivacyPolicyContent } from "@/components/content";

export default function PrivacyPolicyPage() {
  return (
    <Suspense>
      <PrivacyPolicyContent />
    </Suspense>
  );
}
