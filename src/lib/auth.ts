import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Username and password are required");
        }

        await dbConnect();

        const user = await User.findOne({
          username: (credentials.username as string).toLowerCase(),
        });

        if (!user) {
          throw new Error("Invalid credentials");
        }

        if (user.isDisabled) {
          throw new Error("Your account has been disabled. Contact admin.");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isPasswordValid) {
          throw new Error("Invalid credentials");
        }

        return {
          id: user._id.toString(),
          name: user.fullName,
          role: user.role,
        };
      },
    }),
  ],
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
        (session.user as { userId: string }).userId = token.userId as string;
        (session.user as { role: string }).role = token.role as string;
        (session.user as { fullName: string }).fullName = token.fullName as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
