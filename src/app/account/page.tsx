import Link from "next/link";
import { signOutUser } from "@/app/signin/actions";
import { requirePageActor } from "@/lib/authorize";
import { prisma } from "@/lib/prisma";
import { roleLabel } from "@/lib/roles";

export default async function AccountPage() {
  const actor = await requirePageActor();
  const membership = await prisma.websiteMembership.findFirst({ where: { userId: actor.user.id } });
  const role = roleLabel(actor.platformRole, membership?.role ?? null);
  return (
    <main className="product-form">
      <p className="product-quiet">
        <Link href="/sites">Your websites</Link>
      </p>
      <h1>Account</h1>
      <section className="product-card" aria-label="Signed-in person">
        <h2>{actor.user.displayName}</h2>
        <p>{actor.user.email}</p>
        <p className="product-quiet">{role}</p>
      </section>
      <form action={signOutUser}>
        <button type="submit" className="product-button product-button-primary product-button-inline">
          Sign out
        </button>
      </form>
    </main>
  );
}
