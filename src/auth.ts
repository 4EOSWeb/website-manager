import { randomBytes } from "node:crypto";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import { recordAudit } from "@/lib/audit";
import { devAuthEnabled, entraConfigured, isDevEmail } from "@/lib/dev-auth";
import { prisma } from "@/lib/prisma";

const providers = [];

if (entraConfigured()) {
  providers.push(
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET,
      issuer: process.env.AUTH_MICROSOFT_ENTRA_ID_ISSUER,
    }),
  );
}

if (devAuthEnabled()) {
  providers.push(
    Credentials({
      id: "dev-login",
      name: "Development sign-in",
      credentials: { email: { label: "Email", type: "email" } },
      authorize: async (credentials) => {
        const email = String(credentials?.email ?? "");
        if (!isDevEmail(email)) return null;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || user.status !== "ACTIVE") return null;
        return { id: user.id, email: user.email, name: user.displayName };
      },
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/signin" },
  providers,
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (!user?.email) return token;
      const record = await prisma.user.findUnique({ where: { email: user.email } });
      if (!record || record.status !== "ACTIVE") {
        token.denied = true;
        return token;
      }
      if (account?.provider === "microsoft-entra-id" && profile && "oid" in profile) {
        const providerId = String((profile as { oid?: string }).oid ?? "");
        if (providerId && record.identityProviderId !== providerId) {
          await prisma.user.update({
            where: { id: record.id },
            data: { identityProviderId: providerId },
          });
        }
      }
      const amr = profile && "amr" in profile ? (profile as { amr?: string[] }).amr : undefined;
      const mfa = Array.isArray(amr) && amr.includes("mfa");
      const sessionRow = await prisma.editorSession.create({
        data: {
          id: `sess_${randomBytes(8).toString("hex")}`,
          userId: record.id,
          userAgent: account?.provider ?? "unknown",
          stepUpAt: mfa ? new Date() : null,
        },
      });
      token.userId = record.id;
      token.sessionId = sessionRow.id;
      token.denied = false;
      token.provider = account?.provider;
      await recordAudit({
        userId: record.id,
        action: "auth.sign_in",
        target: record.email,
        metadata: { provider: account?.provider ?? "unknown", mfa },
      });
      return token;
    },
    async session({ session, token }) {
      if (token.denied || !token.userId || !token.sessionId) {
        session.user.id = "";
        session.sessionId = "";
        return session;
      }
      session.user.id = String(token.userId);
      session.sessionId = String(token.sessionId);
      return session;
    },
  },
});
