# 4EOS Website Editor

This is the editing hub. Client websites stay in their own GitHub repositories. People edit words, links, and approved images here. They do not see code.

## What is real in this first slice

- Sign-in can use Microsoft Entra when the server has an application id, secret, and tenant issuer. Entra owns passwords, authenticator apps, and password reset. This app does not store passwords.
- Until those values exist, a development-only sign-in is available when `AUTH_DEV_MODE=true` and the app is not in production. It accepts two seeded accounts and nothing else.
- One website is seeded: Quantum Age, the site served at `https://testsite.4eos.com` from `4EOSWeb/quantum-age`.
- A client editor assigned to that website is taken straight into the editor. A person with more than one website sees a chooser. The check happens on the server.
- The editor saves a draft, can create one Insights draft, and can place one image in an approved slot. The geometric logo is not editable.
- Submit for publish creates a git branch and a commit in an isolated workspace. It opens a GitHub pull request only when a GitHub App is configured. It never commits to `main`.

## What this site is not using today

`testsite.4eos.com` is published by a Windows script and Caddy. There is no Azure pipeline in that repository. The hub does not invent one. The live site changes only after a person merges the review and the existing publish process rebuilds it.

## Where the preview runs

The hub does not import the client site into its own process. It clones the repository into `.workspaces`, copies an approved overlay, and starts `npm run dev` with an environment that contains no database password and no GitHub key. The preview listens on `127.0.0.1` and rejects requests that do not carry a per-workspace token. If that process stops answering, the next preview request replaces it instead of waiting on the old one.

This machine has no container runtime, so the first slice uses a separate process instead of a container. A container with CPU, memory, and disk limits should replace that process before the hub is offered to clients.

The preview frame is sandboxed. Its scripts cannot read the editor’s cookies, so styles, images, and scripts are loaded with a short-lived signed address instead of the sign-in cookie. That address only opens the preview. It cannot save or publish.

## Content

Editable home fields live in `src/content/pages/home.json` on the editing branch. New Insights posts are structured JSON, rendered as text by the existing article styles. The 115 existing articles stay as they are and are not opened for HTML editing.

## Permissions

Every website request checks the signed-in user, the website, the membership, the role, and the action. A super administrator can open every approved website. Everyone else only sees websites assigned to them. A wrong website id is answered as not available.

Publishing, audit review, membership changes, repository connection, and restore ask for a fresh identity check. In production that check is a new Microsoft sign-in. In development, the editor has a “Confirm it’s you” button that expires after 10 minutes.
