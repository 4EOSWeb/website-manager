import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { additionLine, commandLines, capabilityLines, levelLine } from "@/app/sites/[websiteId]/settings/settings-model";
import { AuthzError, authorize } from "@/lib/authorize";
import { editorAdapterForSite } from "@/lib/editor-adapter";

export default async function SiteSettingsPage({ params }: { params: Promise<{ websiteId: string }> }) {
  const { websiteId } = await params;
  let actor;
  try {
    actor = await authorize(websiteId, "view");
  } catch (error) {
    if (error instanceof AuthzError && error.reason === "no-membership") redirect(`/sites/${websiteId}/denied`);
    if (error instanceof AuthzError) notFound();
    throw error;
  }
  if (actor.platformRole !== "SUPER_ADMIN" && actor.membershipRole !== "CLIENT_ADMIN") {
    redirect(`/sites/${websiteId}/denied`);
  }
  const adapter = await editorAdapterForSite(websiteId);
  const fields = adapter?.fields ?? null;
  const capabilities = fields && typeof fields.capabilities === "object" ? (fields.capabilities as Record<string, unknown>) : null;
  const commands = fields && typeof fields.commands === "object" ? (fields.commands as Record<string, unknown>) : null;
  return (
    <main className="product-form">
      <p className="product-quiet">
        <Link href={`/sites/${websiteId}`}>Back to {actor.website.name}</Link>
      </p>
      <h1>Settings</h1>
      <p className="product-quiet">These details come from the site adapter. This page does not change them.</p>
      <section className="product-card" aria-label="Adapter">
        <h2>Adapter</h2>
        <dl className="product-facts">
          <div>
            <dt>Level</dt>
            <dd>{levelLine(fields?.level)}</dd>
          </div>
          <div>
            <dt>Can add</dt>
            <dd>{additionLine(fields)}</dd>
          </div>
          {capabilityLines(capabilities).map((line) => (
            <div key={line.label}>
              <dt>{line.label}</dt>
              <dd>{line.value}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="product-card" aria-label="Commands">
        <h2>Commands</h2>
        <dl className="product-facts">
          {commandLines(commands).map((line) => (
            <div key={line.label}>
              <dt>{line.label}</dt>
              <dd>{line.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
