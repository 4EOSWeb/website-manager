# 4EOS Website Editor

A private editor for approved client websites. People sign in, open the website assigned to them, change approved text and images, and submit a review. The live site does not change until that review is merged.

The first website is the Quantum Age prototype at `https://testsite.4eos.com` (`4EOSWeb/quantum-age`). Its look is preserved. Editable words live in content files, not in component code.

See [docs/architecture.md](docs/architecture.md) for the decisions behind this slice.

## Run it locally

Requirements: Node.js 22, npm, and PostgreSQL.

```bash
npm ci
cp .env.example .env
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Open `http://127.0.0.1:3210`.

On Windows, double-click `start-site.bat`. It downloads Caddy if needed, trusts a local certificate, prepares `.env` and the database, and starts the editor. Open `https://localhost`. PostgreSQL must already be running. This launcher does not publish `https://testsite.4eos.com`.

On a development machine, the sign-in page offers two accounts:

- 4EOS administrator — `admin@4eos.test`
- Client editor — `editor@4eos.test`

These accounts exist only when `AUTH_DEV_MODE=true` and the app is not in production. They are not passwords and they are not available on the live editor.

## Checks

```bash
npm run verify
npm run typecheck
npm run lint
npm run build
```

## Not included until you add them

- Microsoft Entra application id, secret, and tenant issuer
- GitHub App id, private key, and webhook secret
- An Azure deployment pipeline (the test site is published with Caddy today)
