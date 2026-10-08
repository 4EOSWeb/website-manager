import { Webhooks } from "@octokit/webhooks";
import { recordAudit } from "@/lib/audit";
import { githubAppConfigured } from "@/lib/dev-auth";
import { redact } from "@/lib/redact";

export async function POST(request: Request) {
  if (!githubAppConfigured()) {
    return Response.json({ message: "GitHub is not connected yet." }, { status: 503 });
  }
  const payload = await request.text();
  const signature = request.headers.get("x-hub-signature-256") ?? "";
  const webhooks = new Webhooks({ secret: process.env.GITHUB_APP_WEBHOOK_SECRET! });
  try {
    await webhooks.verifyAndReceive({
      id: request.headers.get("x-github-delivery") ?? "",
      name: request.headers.get("x-github-event") ?? "",
      signature,
      payload,
    });
  } catch (error) {
    console.error(redact(error instanceof Error ? error.message : "webhook"));
    return Response.json({ message: "The GitHub signature was not accepted." }, { status: 401 });
  }
  let event: { action?: string; repository?: { full_name?: string } } = {};
  try {
    event = JSON.parse(payload) as typeof event;
  } catch {
    event = {};
  }
  await recordAudit({
    action: "github.webhook",
    target: event.repository?.full_name ?? "unknown",
    metadata: { event: request.headers.get("x-github-event"), action: event.action ?? null },
  });
  return Response.json({ ok: true });
}
