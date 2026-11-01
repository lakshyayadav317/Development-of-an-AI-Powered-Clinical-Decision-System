import Credentials from "@auth/core/providers/credentials";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { env } from "./env.js";

/**
 * Auth.js (via @auth/express) configuration.
 * - Credentials provider (email + password), JWT sessions stored in an httpOnly cookie.
 * - The application role (patient | doctor) lives on the User document and is copied
 *   into the JWT and the session so route guards can read it without a DB hit.
 */
export const authConfig = {
  secret: env.authSecret,
  trustHost: true,
  session: { strategy: "jwt", maxAge: 7 * 24 * 60 * 60 },
  pages: { signIn: "/", error: "/" },
  providers: [
    Credentials({
      name: "Email and password",
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const email = String(credentials?.email || "").toLowerCase().trim();
        const password = String(credentials?.password || "");
        if (!email || !password) return null;

        const user = await User.findOne({ email }).select("+passwordHash");
        if (!user || !user.isActive) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return { id: user._id.toString(), name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
};
