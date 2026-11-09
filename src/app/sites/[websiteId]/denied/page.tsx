import Link from "next/link";
import { requirePageActor } from "@/lib/authorize";

export default async function DeniedPage() {
  await requirePageActor();
  return (
    <main className="product-form">
      <h1>You do not have access to this website.</h1>
      <p className="product-quiet">
        <Link href="/sites">Your websites</Link>
      </p>
    </main>
  );
}
