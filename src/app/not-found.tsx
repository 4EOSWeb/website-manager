import Link from "next/link";
import { auth } from "@/auth";

export default async function NotFound() {
  const session = await auth();
  const signedIn = Boolean(session?.user);
  return (
    <main className="product-form">
      <h1>This page is not here.</h1>
      <p className="product-quiet">
        {signedIn ? <Link href="/sites">Your websites</Link> : <Link href="/signin">Sign in</Link>}
      </p>
    </main>
  );
}
