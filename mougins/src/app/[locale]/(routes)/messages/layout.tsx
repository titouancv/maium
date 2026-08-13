import { MessagingRealtime } from "@/components/pages/messaging";

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
