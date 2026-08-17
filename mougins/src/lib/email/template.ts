import { APP_NAME } from "@/constants";
import { getAppUrl } from "./client";

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

const SURFACE = "#f4f3ee";
const SURFACE_DARK = "#020617";
const TEXT = "#201e1a";
const TEXT_DARK = "#f4f3ee";
const TEXT_MUTED = "#818cf8";
const PRIMARY = "#ff4500";
const SECONDARY = "#e04490";
const ON_PRIMARY = "#fff2ee";

const FONT_STACK =
  "'CabinetGrotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

const FONT_WEIGHTS: Record<string, number> = {
  Regular: 400,
  Medium: 500,
  Extrabold: 800,
};

function fontFaces(): string {
  const base = `${getAppUrl()}/fonts/cabinet-grotesk`;

  return Object.entries(FONT_WEIGHTS)
    .map(
      ([file, weight]) =>
        `@font-face{font-family:'CabinetGrotesk';src:url('${base}/CabinetGrotesk-${file}.woff2') format('woff2');font-weight:${weight};font-style:normal;font-display:swap;}`,
    )
    .join("");
}

function styleBlock(): string {
  return `${fontFaces()}
body{margin:0;padding:0;width:100%;}
@media (prefers-color-scheme:dark){
.ground{background-color:${SURFACE_DARK}!important;}
.txt{color:${TEXT_DARK}!important;}
.accent{background-color:${TEXT_DARK}!important;}
}
@media (max-width:600px){
.shell{padding:40px 20px!important;}
.heading{font-size:24px!important;}
}`;
}

function accentBar(width: number): string {
  return `<div class="accent" style="height:4px;line-height:4px;font-size:0;width:${width}px;border-radius:9999px;background-color:${TEXT};">&#160;</div>`;
}

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

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light dark" />
<meta name="supported-color-schemes" content="light dark" />
<style>${styleBlock()}</style>
</head>
<body class="ground" style="margin:0;padding:0;background-color:${SURFACE};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preview)}</div>
<div class="ground shell" style="background-color:${SURFACE};padding:56px 24px;font-family:${FONT_STACK};">
  <div style="max-width:520px;margin:0 auto;">
    <p class="txt" style="margin:0 0 8px;font-size:22px;line-height:1;font-weight:800;letter-spacing:-0.01em;color:${TEXT};">${escapeHtml(APP_NAME)}</p>
    ${accentBar(64)}
    <h1 class="txt heading" style="margin:56px 0 12px;font-size:28px;line-height:1.2;font-weight:800;letter-spacing:-0.02em;color:${TEXT};">${escapeHtml(heading)}</h1>
    ${accentBar(88)}
    <p class="txt" style="margin:24px 0 0;font-size:16px;line-height:1.65;color:${TEXT};">${escapeHtml(body)}</p>
    <div style="margin:40px 0 0;">
      <a href="${escapeHtml(actionUrl)}" style="display:inline-block;padding:14px 28px;border-radius:16px;background-color:${PRIMARY};background-image:radial-gradient(circle,${SECONDARY} 10%,${PRIMARY} 90%);color:${ON_PRIMARY};font-size:16px;font-weight:500;line-height:1.2;text-decoration:none;box-shadow:0 4px 6px -1px rgba(32,30,26,0.15);">${escapeHtml(actionLabel)}</a>
    </div>
    <p style="margin:56px 0 0;font-size:13px;line-height:1.7;color:${TEXT_MUTED};">
      ${escapeHtml(footer)}<br />
      <a href="${escapeHtml(unsubscribeUrl)}" style="color:${TEXT_MUTED};text-decoration:underline;">${escapeHtml(unsubscribeLabel)}</a>
    </p>
  </div>
</div>
</body>
</html>`;
}

export function renderEmailText(content: EmailContent): string {
  return [
    APP_NAME,
    "",
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
