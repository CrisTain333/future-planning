import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  providers: [], // Providers are configured in auth.ts (needs Node.js runtime)
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.role = (user as { role: string }).role;
        token.fullName = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        const user = session.user as unknown as { userId: string; role: string; fullName: string };
        user.userId = token.userId as string;
        user.role = token.role as string;
        user.fullName = token.fullName as string;
      }
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth;
      const userRole = (auth?.user as { role?: string })?.role;

      // Public routes
      if (pathname === "/login") {
        return true; // Always allow access to login
      }

      // Admin-only routes
      if (pathname.startsWith("/admin") && userRole !== "admin") {
        return false;
      }

      // All other matched routes require auth
      return isLoggedIn;
    },
  },
  pages: {
    signIn: "/login",
  },
};
