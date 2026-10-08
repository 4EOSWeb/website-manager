"use server";

import { headers } from "next/headers";
import { signIn, signOut } from "@/auth";
import { devAuthEnabled, entraConfigured, isDevEmail } from "@/lib/dev-auth";
import { recordAudit } from "@/lib/audit";

const attempts = new Map<string, { count: number; reset: number }>();

async function rateLimit() {
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const now = Date.now();
  const current = attempts.get(ip);
  if (!current || current.reset < now) {
    attempts.set(ip, { count: 1, reset: now + 60_000 });
    return;
  }
  current.count += 1;
  if (current.count > 10) {
    throw new Error("Too many sign-in attempts. Wait a minute and try again.");
  }
}

export async function signOutUser() {
  await signOut({ redirectTo: "/signin" });
}

export async function signInWithMicrosoft() {
  if (!entraConfigured()) throw new Error("Microsoft sign-in is not configured yet.");
  await rateLimit();
  await signIn("microsoft-entra-id", { redirectTo: "/" });
}

async function developmentSignIn(email: string) {
  if (!devAuthEnabled()) throw new Error("Development sign-in is turned off.");
  if (!isDevEmail(email)) throw new Error("That development account is not available.");
  await rateLimit();
  await recordAudit({ action: "auth.dev_sign_in_attempt", target: email });
  await signIn("dev-login", { email, redirectTo: "/" });
}

export async function signInAsAdministrator() {
  await developmentSignIn("admin@4eos.test");
}

export async function signInAsEditor() {
  await developmentSignIn("editor@4eos.test");
}
