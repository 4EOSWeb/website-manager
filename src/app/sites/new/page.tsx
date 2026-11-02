import { notFound } from "next/navigation";
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
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium tracking-[0.14em] text-[var(--accent)] uppercase">New website</p>
      <h1 className="mt-3 font-serif text-5xl text-[var(--ink)]">Connect a website</h1>
      <form className="mt-10 border border-[var(--line)] bg-white p-6" aria-label="Connect a website" />
    </main>
  );
}
