import { redirect } from "next/navigation";
import { requirePageActor } from "@/lib/authorize";
import { landingPath, websitesFor } from "@/lib/websites";

export default async function Home() {
  const actor = await requirePageActor();
  const websites = await websitesFor(actor.user);
  redirect(landingPath(websites.length, websites[0]?.id));
}
