import { signInAsAdministrator, signInAsEditor, signInWithMicrosoft } from "@/app/signin/actions";
import { devAuthEnabled, entraConfigured } from "@/lib/dev-auth";

export default function SignInPage() {
  const dev = devAuthEnabled();
  const entra = entraConfigured();
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium tracking-[0.14em] text-[var(--accent)] uppercase">4EOS</p>
      <h1 className="mt-3 font-serif text-5xl leading-none text-[var(--ink)]">Website Editor</h1>
      <p className="mt-4 text-lg leading-relaxed text-[var(--muted)]">
        Sign in to edit the website you have been given. You will not see code.
      </p>
      <div className="mt-10 flex flex-col gap-3">
        {entra ? (
          <form action={signInWithMicrosoft}>
            <button className="w-full bg-[var(--ink)] px-4 py-3 text-left text-white" type="submit">
              Sign in with Microsoft
            </button>
          </form>
        ) : (
          <p className="border border-[var(--line)] bg-white px-4 py-3 text-sm leading-relaxed">
            Microsoft sign-in is ready in the application, and it turns on when the Entra application id, secret, and
            tenant issuer are provided to the server. Multifactor authentication stays with Microsoft.
          </p>
        )}
        {dev ? (
          <div className="mt-6 border border-dashed border-[var(--line)] p-4">
            <p className="text-sm leading-relaxed text-[var(--muted)]">
              Development sign-in is on because this copy is not running in production. It does not ask for a password
              and it will not be available on the live editor.
            </p>
            <form action={signInAsAdministrator} className="mt-4">
              <button className="w-full border border-[var(--ink)] px-4 py-3 text-left" type="submit">
                Continue as 4EOS administrator
              </button>
            </form>
            <form action={signInAsEditor} className="mt-2">
              <button className="w-full border border-[var(--line)] px-4 py-3 text-left" type="submit">
                Continue as client editor
              </button>
            </form>
          </div>
        ) : null}
      </div>
    </main>
  );
}
