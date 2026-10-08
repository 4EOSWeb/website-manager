import "next-auth";

declare module "next-auth" {
  interface Session {
    sessionId: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    sessionId?: string;
    denied?: boolean;
    provider?: string;
  }
}
