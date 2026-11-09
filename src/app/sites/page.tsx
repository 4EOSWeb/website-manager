import Link from "next/link";
import { ProductCard } from "@/components/product/card";
import { ProductEmpty } from "@/components/product/empty";
import { requirePageActor } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";
import { canConnectWebsite } from "@/lib/roles";
import { devPause } from "@/lib/dev-pause";
import { websitesFor } from "@/lib/websites";

function siteHost(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url.replace(/^https?:\/\//, "");
  }
}

export default async function SitesPage({ searchParams }: { searchParams: Promise<{ slow?: string }> }) {
  const query = await searchParams;
  await devPause(query.slow);
  const actor = await requirePageActor();
  const [websites, memberships] = await Promise.all([
    websitesFor(actor.user),
    prisma.websiteMembership.findMany({
      where: { userId: actor.user.id },
      select: { role: true },
    }),
  ]);
  const connect = canConnectWebsite(
    actor.platformRole,
    memberships.map((membership) => membership.role),
  );
  return (
    <main className="product-sites">
      <div className="product-sites-bar">
        <h1 className="product-display">Your websites</h1>
        {connect && websites.length > 0 ? (
          <Link className="product-button product-button-primary product-button-inline" href="/sites/new">
            Connect a website
          </Link>
        ) : null}
      </div>
      {websites.length === 0 ? (
        <ProductEmpty label={connect ? "No websites" : "No website assigned"}>
          <p>{connect ? "Nothing is connected yet." : "No website is assigned to you."}</p>
          {connect ? (
            <Link className="product-button product-button-primary product-button-inline" href="/sites/new">
              Connect a website
            </Link>
          ) : null}
        </ProductEmpty>
      ) : (
        <ul className="product-sites-list">
          {websites.map((website) => (
            <li key={website.id}>
              <ProductCard title={website.name} className="product-site-card">
                <p className="product-quiet">{siteHost(website.productionUrl)}</p>
                <Link className="product-button product-button-quiet product-button-inline" href={`/sites/${website.id}/editor`} aria-label={`Edit ${website.name}`}>
                  Edit
                </Link>
              </ProductCard>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
