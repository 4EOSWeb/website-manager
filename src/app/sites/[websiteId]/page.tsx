import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductCard } from "@/components/product/card";
import { dashboardActions } from "@/app/sites/[websiteId]/dashboard-actions";
import { AuthzError, authorize } from "@/lib/authorize";
import { editorAdapterForSite } from "@/lib/editor-adapter";

function siteHost(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url.replace(/^https?:\/\//, "");
  }
}

export default async function SiteDashboardPage({ params }: { params: Promise<{ websiteId: string }> }) {
  const { websiteId } = await params;
  let actor;
  try {
    actor = await authorize(websiteId, "view");
  } catch (error) {
    if (error instanceof AuthzError) notFound();
    throw error;
  }
  const adapter = await editorAdapterForSite(websiteId);
  const capabilities = adapter?.fields.capabilities;
  const supportsReview = Boolean(capabilities && typeof capabilities === "object" && (capabilities as { supportsReviewPublishing?: unknown }).supportsReviewPublishing);
  const actions = dashboardActions(websiteId, supportsReview);
  return (
    <main className="product-sites">
      <p className="product-quiet">
        <Link href="/sites">Your websites</Link>
      </p>
      <h1 className="product-display">{actor.website.name}</h1>
      <p className="product-quiet">{siteHost(actor.website.productionUrl)}</p>
      <ul className="product-sites-list">
        {actions.map((action) => (
          <li key={action.id}>
            <ProductCard title={action.label} href={action.href} className="product-site-card">
              <p className="product-quiet">{action.detail}</p>
            </ProductCard>
          </li>
        ))}
      </ul>
    </main>
  );
}
