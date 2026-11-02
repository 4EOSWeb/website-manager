import { signInAsAdministrator, signInAsEditor, signInAsHarborEditor, signInWithMicrosoft } from "@/app/signin/actions";
import { ProductButton } from "@/components/product/button";
import { ProductCard } from "@/components/product/card";
import { devAuthEnabled, entraConfigured } from "@/lib/dev-auth";

export default function SignInPage() {
  const dev = devAuthEnabled();
  const entra = entraConfigured();
  return (
    <main className="product-signin">
      <p className="product-kicker">4EOS</p>
      <h1 className="product-display">Website editor</h1>
      <p>Edit the pages, pictures, and navigation on a website you already work on.</p>
      {entra ? (
        <form action={signInWithMicrosoft}>
          <ProductButton type="submit">Sign in with Microsoft</ProductButton>
        </form>
      ) : (
        <ProductCard>
          <p className="product-unavailable">Sign-in is unavailable.</p>
        </ProductCard>
      )}
      {dev ? (
        <div className="product-dev">
          <form action={signInAsAdministrator}>
            <ProductButton type="submit" variant="quiet">Continue as 4EOS administrator</ProductButton>
          </form>
          <form action={signInAsEditor}>
            <ProductButton type="submit" variant="quiet">Continue as client editor</ProductButton>
          </form>
          <form action={signInAsHarborEditor}>
            <ProductButton type="submit" variant="quiet">Continue as Harbor editor</ProductButton>
          </form>
        </div>
      ) : null}
    </main>
  );
}
