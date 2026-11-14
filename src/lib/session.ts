import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, type Role } from "./auth";

/** Current user (or null), read from the session cookie. */
export async function currentUser() {
  const s = await auth.api.getSession({ headers: await headers() });
  if (!s) return null;
  return { ...s.user, role: (s.user as { role?: Role }).role ?? "candidate" };
}

/** Use at the top of a protected page: sends you to login if you are not allowed in. */
export async function requireRole(lang: string, role: Role) {
  const u = await currentUser();
  if (!u) redirect(`/${lang}/login?next=/${lang}/${role}`);
  if (u.role !== role) redirect(`/${lang}/${u.role}`);
  return u;
}
