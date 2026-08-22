// src/auth.config.ts
// Edge-safe config shared by middleware and the full auth setup.
// NO Prisma / bcrypt imports here — middleware runs on the Edge runtime.
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  callbacks: {
    jwt({ token, user }) {
      // On sign-in, copy id + role into the JWT so every request knows the role
      if (user) {
        token.id = (user as { id: string }).id;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  providers: [], // real providers added in src/auth.ts (server-only)
} satisfies NextAuthConfig;
