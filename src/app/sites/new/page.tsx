import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteIdentity } from "@/app/sites/new/identity";
import { requirePageActor } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";
import { canConnectWebsite } from "@/lib/roles";

export default async function NewSitePage() {
  const actor = await requirePageActor();
  const memberships = await prisma.websiteMembership.findMany({
    where: { userId: actor.user.id },
    select: { role: true },
  });
  if (!canConnectWebsite(actor.platformRole, memberships.map((membership) => membership.role))) notFound();
  return (
    <main className="product-form">
      <p className="product-quiet">
        <Link href="/sites">Your websites</Link>
      </p>
      <h1 className="product-display">Connect a website</h1>
      <SiteIdentity />
    </main>
  );
}
