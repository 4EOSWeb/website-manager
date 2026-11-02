import { signInAsAdministrator, signInAsEditor, signInAsHarborEditor, signInWithMicrosoft } from "@/app/signin/actions";
import { SignInSubmit } from "@/app/signin/callback-status";
import { developmentAccess } from "@/app/signin/development-access";
import { ProductCard } from "@/components/product/card";
import { devAuthEnabled, entraConfigured } from "@/lib/dev-auth";

export default async function SignInPage({ searchParams }: PageProps<"/signin">) {
  const dev = developmentAccess(devAuthEnabled());
  const entra = entraConfigured();
  const params = await searchParams;
  const failed = typeof params.error === "string" && params.error.length > 0;
  return (
    <main className="product-signin">
      <p className="product-kicker">4EOS</p>
      <h1 className="product-display">Website editor</h1>
      <p>Edit the pages, pictures, and navigation on a website you already work on.</p>
      {failed ? <p className="product-error" role="alert">Sign-in did not complete. Try again.</p> : null}
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
          <h2>{dev.title}</h2>
          <p>{dev.note}</p>
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
