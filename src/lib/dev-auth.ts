export function devAuthEnabled() {
  return process.env.NODE_ENV !== "production" && process.env.AUTH_DEV_MODE === "true";
}

export function entraConfigured() {
  return Boolean(
    process.env.AUTH_MICROSOFT_ENTRA_ID_ID &&
      process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET &&
      process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
  );
}

export function githubAppConfigured() {
  return Boolean(
    process.env.GITHUB_APP_ID && process.env.GITHUB_APP_PRIVATE_KEY && process.env.GITHUB_APP_WEBHOOK_SECRET,
  );
}

const DEV_EMAILS = new Set(["admin@4eos.test", "editor@4eos.test"]);

export function isDevEmail(email: string) {
  return DEV_EMAILS.has(email);
}
