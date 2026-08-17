import { createHmac, timingSafeEqual } from "node:crypto";
import { API } from "@/constants";
import { getAppUrl } from "./client";

const TOKEN_SEPARATOR = ".";

function getSecret(): string | null {
  return process.env.EMAIL_UNSUBSCRIBE_SECRET ?? null;
}

function sign(userId: string, secret: string): string {
  return createHmac("sha256", secret).update(userId).digest("base64url");
}

export function createUnsubscribeToken(userId: string): string | null {
  const secret = getSecret();
  if (!secret) return null;

  const encodedId = Buffer.from(userId, "utf8").toString("base64url");
  return `${encodedId}${TOKEN_SEPARATOR}${sign(userId, secret)}`;
}

export function readUnsubscribeToken(token: string): string | null {
  const secret = getSecret();
  if (!secret) return null;

  const [encodedId, signature] = token.split(TOKEN_SEPARATOR);
  if (!encodedId || !signature) return null;

  const userId = Buffer.from(encodedId, "base64url").toString("utf8");
  if (!userId) return null;

  const expected = Buffer.from(sign(userId, secret), "utf8");
  const received = Buffer.from(signature, "utf8");
  if (expected.length !== received.length) return null;
  if (!timingSafeEqual(expected, received)) return null;

  return userId;
}

export function createUnsubscribeUrl(userId: string): string | null {
  const token = createUnsubscribeToken(userId);
  if (!token) return null;

  const url = new URL(API.EMAIL_UNSUBSCRIBE, getAppUrl());
  url.searchParams.set("token", token);
  return url.toString();
}
