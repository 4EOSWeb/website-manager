import Link from "next/link";
import { requirePageActor } from "@/lib/authorize";
import { websitesFor } from "@/lib/websites";

export default async function SitesPage() {
  const actor = await requirePageActor();
  const websites = await websitesFor(actor.user);
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium tracking-[0.14em] text-[var(--accent)] uppercase">Your websites</p>
      <h1 className="mt-3 font-serif text-5xl text-[var(--ink)]">Choose a website</h1>
      <ul className="mt-10 divide-y divide-[var(--line)] border-y border-[var(--line)]">
        {websites.map((website) => (
          <li key={website.id}>
            <Link className="flex items-baseline justify-between gap-6 py-5 hover:text-[var(--accent)]" href={`/sites/${website.id}/editor`}>
              <span className="font-serif text-2xl">{website.name}</span>
              <span className="text-sm text-[var(--muted)]">{website.productionUrl.replace("https://", "")}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
