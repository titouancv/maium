import { getTranslations } from "next-intl/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { routing } from "@/i18n/routing";
import { APP_NAME, LOCALES, ROUTES, type Locale } from "@/constants";
import { getAppUrl } from "./client";
import { sendEmail } from "./send";
import { createUnsubscribeUrl } from "./unsubscribeToken";
import type { EmailContent } from "./template";

type AdminClient = ReturnType<typeof createAdminClient>;

interface EmailRecipient {
  id: string;
  email: string;
  firstName: string;
  locale: Locale;
}

interface RecipientRow {
  id: string;
  email: string | null;
  first_name: string | null;
  locale: string | null;
  email_notifications: boolean;
}

function toLocale(value: string | null): Locale {
  return LOCALES.includes(value as Locale)
    ? (value as Locale)
    : routing.defaultLocale;
}

function toRecipient(row: RecipientRow | null): EmailRecipient | null {
  if (!row || !row.email_notifications || !row.email) return null;

  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name ?? "",
    locale: toLocale(row.locale),
  };
}

const RECIPIENT_SELECT = "id, email, first_name, locale, email_notifications";

async function getRecipient(
  admin: AdminClient,
  userId: string,
): Promise<EmailRecipient | null> {
  const { data } = await admin
    .from("users")
    .select(RECIPIENT_SELECT)
    .eq("id", userId)
    .maybeSingle();

  return toRecipient(data as RecipientRow | null);
}

async function claimNotification(
  admin: AdminClient,
  notificationId: number,
): Promise<boolean> {
  const { data } = await admin
    .from("notifications")
    .update({ emailed_at: new Date().toISOString() })
    .eq("id", notificationId)
    .is("emailed_at", null)
    .select("id")
    .maybeSingle();

  return data !== null;
}

async function releaseNotification(
  admin: AdminClient,
  notificationId: number,
): Promise<void> {
  await admin
    .from("notifications")
    .update({ emailed_at: null })
    .eq("id", notificationId);
}

function localizedUrl(locale: Locale, path: string): string {
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  return `${getAppUrl()}${prefix}${path}`;
}

interface BuildContentInput {
  recipient: EmailRecipient;
  heading: string;
  body: string;
  actionLabel: string;
  actionPath: string;
}

async function buildContent({
  recipient,
  heading,
  body,
  actionLabel,
  actionPath,
}: BuildContentInput): Promise<EmailContent | null> {
  const unsubscribeUrl = createUnsubscribeUrl(recipient.id);
  if (!unsubscribeUrl) return null;

  const t = await getTranslations({
    locale: recipient.locale,
    namespace: "emails",
  });

  return {
    preview: body,
    heading,
    body,
    actionLabel,
    actionUrl: localizedUrl(recipient.locale, actionPath),
    footer: t("footer", { appName: APP_NAME }),
    unsubscribeLabel: t("unsubscribe"),
    unsubscribeUrl,
  };
}

interface DispatchInput extends BuildContentInput {
  admin: AdminClient;
  notificationId: number;
  subject: string;
}

async function dispatch({
  admin,
  notificationId,
  subject,
  ...contentInput
}: DispatchInput): Promise<boolean> {
  const content = await buildContent(contentInput);
  if (!content) return false;

  if (!(await claimNotification(admin, notificationId))) return false;

  const sent = await sendEmail({
    to: contentInput.recipient.email,
    subject,
    content,
  });
  if (!sent) await releaseNotification(admin, notificationId);

  return sent;
}

export async function sendFollowNotificationEmail(input: {
  recipientId: string;
  actorId: string;
  actorName: string;
  actorPseudo: string;
}): Promise<void> {
  const admin = createAdminClient();

  const recipient = await getRecipient(admin, input.recipientId);
  if (!recipient) return;

  const { data: notification } = await admin
    .from("notifications")
    .select("id")
    .eq("user_id", input.recipientId)
    .eq("actor_id", input.actorId)
    .eq("kind", "follow")
    .is("emailed_at", null)
    .maybeSingle();
  if (!notification) return;

  const t = await getTranslations({
    locale: recipient.locale,
    namespace: "emails",
  });
  const actorName = input.actorName || input.actorPseudo;

  await dispatch({
    admin,
    notificationId: notification.id as number,
    recipient,
    subject: t("follow.subject", { name: actorName, appName: APP_NAME }),
    heading: t("follow.heading", { name: actorName }),
    body: t("follow.body", { name: actorName, appName: APP_NAME }),
    actionLabel: t("follow.action"),
    actionPath: ROUTES.PROFILE(input.actorPseudo),
  });
}

interface PendingSnoozeRow {
  id: number;
  analysis_id: string;
  user: RecipientRow | null;
  analysis: {
    id: string;
    job: { title: string | null; company: string | null } | null;
  } | null;
}

const PENDING_SNOOZE_SELECT = `id, analysis_id,
   user:user_id ( ${RECIPIENT_SELECT} ),
   analysis:analysis_id ( id, job:job_id ( title, company ) )`;

export async function sendPendingSnoozeEmails(limit: number): Promise<number> {
  const admin = createAdminClient();

  const { error: sweepError } = await admin.rpc(
    "sweep_stale_analysis_notifications_all",
  );
  if (sweepError) throw sweepError;

  const { data, error } = await admin
    .from("notifications")
    .select(PENDING_SNOOZE_SELECT)
    .eq("kind", "analysis_snooze")
    .is("emailed_at", null)
    .is("read_at", null)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw error;

  const rows = (data ?? []) as unknown as PendingSnoozeRow[];
  let sent = 0;

  for (const row of rows) {
    const recipient = toRecipient(row.user);
    if (!recipient || !row.analysis) continue;

    const t = await getTranslations({
      locale: recipient.locale,
      namespace: "emails",
    });
    const tJobs = await getTranslations({
      locale: recipient.locale,
      namespace: "jobs",
    });
    const title = row.analysis.job?.title || tJobs("untitledJob");
    const company = row.analysis.job?.company;

    const delivered = await dispatch({
      admin,
      notificationId: row.id,
      recipient,
      subject: t("snooze.subject", { title }),
      heading: t("snooze.heading", { title }),
      body: company
        ? t("snooze.bodyWithCompany", { title, company })
        : t("snooze.body", { title }),
      actionLabel: t("snooze.action"),
      actionPath: ROUTES.JOB_ANALYSIS(row.analysis.id),
    });

    if (delivered) sent += 1;
  }

  return sent;
}
