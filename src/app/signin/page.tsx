import { signInAsAdministrator, signInAsEditor, signInAsHarborEditor, signInWithMicrosoft } from "@/app/signin/actions";
import { SignInSubmit } from "@/app/signin/callback-status";
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
          <SignInSubmit label="Sign in with Microsoft" variant="primary" />
        </form>
      ) : (
        <ProductCard>
          <p className="product-unavailable">Sign-in is unavailable.</p>
        </ProductCard>
      )}
      {dev ? (
        <div className="product-dev">
          <form action={signInAsAdministrator}>
            <SignInSubmit label="Continue as 4EOS administrator" />
          </form>
          <form action={signInAsEditor}>
            <SignInSubmit label="Continue as client editor" />
          </form>
          <form action={signInAsHarborEditor}>
            <SignInSubmit label="Continue as Harbor editor" />
          </form>
        </div>
      ) : null}
    </main>
  );
}
