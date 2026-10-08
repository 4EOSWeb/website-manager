export function redact(message: string) {
  return message
    .replace(/gh[pousr]_[A-Za-z0-9_]+/g, "[redacted]")
    .replace(/x-access-token:[^@\s]+/g, "x-access-token:[redacted]")
    .replace(/-----BEGIN [A-Z ]+-----[\s\S]*?-----END [A-Z ]+-----/g, "[redacted key]");
}
