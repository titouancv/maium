import { describe, expect, it } from "vitest";
import {
  escapeHtml,
  renderEmailHtml,
  renderEmailText,
  type EmailContent,
} from "./template";

const content: EmailContent = {
  preview: "preview",
  heading: "Ada <script>alert(1)</script> follows you",
  body: "Ada & Co just followed you",
  actionLabel: "View profile",
  actionUrl: "https://maium.app/profile/ada",
  footer: "You get this because you have an account",
  unsubscribeLabel: "Unsubscribe",
  unsubscribeUrl: "https://maium.app/api/email/unsubscribe?token=abc",
};

describe("email template", () => {
  it("escapes html-significant characters", () => {
    expect(escapeHtml(`<a href="x">&'`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;&amp;&#39;",
    );
  });

  it("never emits interpolated markup as html", () => {
    const html = renderEmailHtml(content);

    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("Ada &amp; Co just followed you");
  });

  it("keeps the action and unsubscribe urls linkable", () => {
    const html = renderEmailHtml(content);

    expect(html).toContain(`href="${content.actionUrl}"`);
    expect(html).toContain(
      'href="https://maium.app/api/email/unsubscribe?token=abc"',
    );
  });

  it("dresses the email in the site palette and type", () => {
    const html = renderEmailHtml(content);

    expect(html).toContain("#f4f3ee");
    expect(html).toContain("radial-gradient(circle,#e04490 10%,#ff4500 90%)");
    expect(html).toContain("CabinetGrotesk-Extrabold.woff2");
  });

  it("always renders in light mode, since Gmail ignores prefers-color-scheme", () => {
    const html = renderEmailHtml(content);

    expect(html).not.toContain("prefers-color-scheme");
    expect(html).toContain('<meta name="color-scheme" content="light" />');
    expect(html).toContain(
      '<meta name="supported-color-schemes" content="light" />',
    );
  });

  it("renders a plain-text alternative with both urls", () => {
    const text = renderEmailText(content);

    expect(text).toContain(content.actionUrl);
    expect(text).toContain(content.unsubscribeUrl);
    expect(text).not.toContain("<div");
  });
});
