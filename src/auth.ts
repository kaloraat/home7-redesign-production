import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import Admin from "@/models/Admin";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      role?: string;
    } & DefaultSession["user"];
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/admin/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        await dbConnect();
        const admin = await Admin.findOne({ email: email.toLowerCase() });
        if (!admin) return null;

        const valid = await bcrypt.compare(password, admin.passwordHash);
        if (!valid) return null;

        return {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        // `sub` already carries the user id (NextAuth's own convention),
        // but stored explicitly too — relying on `sub` implicitly meaning
        // "the Admin's _id" is easy to break by accident in a future auth
        // change; an explicit field makes that dependency visible.
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string | undefined;
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
