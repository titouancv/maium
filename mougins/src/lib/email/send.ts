import { getResendClient, getSenderAddress } from "./client";
import {
  renderEmailHtml,
  renderEmailText,
  type EmailContent,
} from "./template";

export interface OutgoingEmail {
  to: string;
  subject: string;
  content: EmailContent;
}

export async function sendEmail({
  to,
  subject,
  content,
}: OutgoingEmail): Promise<boolean> {
  const resend = getResendClient();
  const from = getSenderAddress();
  if (!resend || !from) return false;

  const { error } = await resend.emails.send({
    from,
    to,
    subject,
    html: renderEmailHtml(content),
    text: renderEmailText(content),
    headers: {
      "List-Unsubscribe": `<${content.unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });

  if (error) {
    console.error("[email] send failed", error);
    return false;
  }

  return true;
}
