import { MessagingRealtime } from "@/components/pages/messaging";

// Wraps both the conversations list and the conversation view. Because this
// layout persists across navigation between them, the single Realtime
// subscription it mounts stays alive — keeping the list/preview/read state live
// without a per-route subscription that would tear down and miss messages.
export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MessagingRealtime />
      {children}
    </>
  );
}
