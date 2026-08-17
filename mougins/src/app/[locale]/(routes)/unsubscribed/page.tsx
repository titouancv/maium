import { Suspense } from "react";
import { UnsubscribedContent } from "@/components/pages/unsubscribed";

export default function UnsubscribedPage() {
  return (
    <Suspense>
      <UnsubscribedContent />
    </Suspense>
  );
}
