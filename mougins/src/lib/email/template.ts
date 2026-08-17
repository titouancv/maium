import { APP_NAME } from "@/constants";

export interface EmailContent {
  preview: string;
  heading: string;
  body: string;
  actionLabel: string;
  actionUrl: string;
  footer: string;
  unsubscribeLabel: string;
  unsubscribeUrl: string;
}

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
}

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

export function renderEmailHtml(content: EmailContent): string {
  const {
    preview,
    heading,
    body,
    actionLabel,
    actionUrl,
    footer,
    unsubscribeLabel,
    unsubscribeUrl,
  } = content;

  return `<div style="background-color:#f4f3ee;margin:0;padding:48px 24px;font-family:${FONT_STACK};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preview)}</div>
  <div style="max-width:520px;margin:0 auto;color:#201e1a;">
    <p style="margin:0 0 40px;font-size:13px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#7a756c;">${escapeHtml(APP_NAME)}</p>
    <h1 style="margin:0 0 16px;font-size:26px;line-height:1.25;font-weight:600;color:#201e1a;">${escapeHtml(heading)}</h1>
    <p style="margin:0 0 32px;font-size:16px;line-height:1.65;color:#5c5750;">${escapeHtml(body)}</p>
    <p style="margin:0 0 48px;font-size:16px;line-height:1.5;">
      <a href="${escapeHtml(actionUrl)}" style="color:#ff4500;font-weight:600;text-decoration:none;">${escapeHtml(actionLabel)} &rarr;</a>
    </p>
    <p style="margin:0;font-size:13px;line-height:1.7;color:#7a756c;">
      ${escapeHtml(footer)}<br />
      <a href="${escapeHtml(unsubscribeUrl)}" style="color:#7a756c;text-decoration:underline;">${escapeHtml(unsubscribeLabel)}</a>
    </p>
  </div>
</div>`;
}

export function renderEmailText(content: EmailContent): string {
  return [
    content.heading,
    "",
    content.body,
    "",
    `${content.actionLabel}: ${content.actionUrl}`,
    "",
    content.footer,
    `${content.unsubscribeLabel}: ${content.unsubscribeUrl}`,
  ].join("\n");
}
