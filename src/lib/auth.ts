import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { bearer, jwt } from "better-auth/plugins";
import { db, user, session, account, verification, jwks } from "@/db";

/**
 * Login for all three roles. Users, sessions and password hashes are stored in OUR Postgres (Finland).
 * `role` is an extra field on the user. It cannot be set by the browser (input: false):
 * the server sets it at sign-up (candidate or company only). City accounts are seeded.
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema: { user, session, account, verification, jwks } }),
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "candidate", input: false },
    },
  },
  plugins: [
    jwt(), // GET /api/auth/token → short-lived JWT for platform API clients. Public keys at /api/auth/jwks
    bearer(), // lets API clients send "Authorization: Bearer <token>" instead of a cookie
    nextCookies(), // lets server actions set the login cookie (keep last)
  ],
});

export type Role = "candidate" | "company" | "city";
