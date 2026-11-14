import "server-only";
import { NextResponse } from "next/server";
import { auth, type Role } from "./auth";

/** Error with an HTTP status. Throw it anywhere in a service; `api()` turns it into JSON. */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export type ApiUser = { id: string; name: string; email: string; role: Role };

/**
 * Who is calling? Works with the browser session cookie AND with
 * `Authorization: Bearer <session token>` (bearer plugin) for other systems.
 */
export async function caller(req: Request, roles?: Role[]): Promise<ApiUser> {
  const s = await auth.api.getSession({ headers: req.headers });
  if (!s) throw new ApiError(401, "Not logged in");
  const u = { ...s.user, role: ((s.user as { role?: Role }).role ?? "candidate") as Role };
  if (roles && !roles.includes(u.role)) throw new ApiError(403, `Only for: ${roles.join(", ")}`);
  return { id: u.id, name: u.name, email: u.email, role: u.role };
}

/** Wrap a route handler: consistent JSON errors, never leaks stack traces. */
export function api<C>(fn: (req: Request, ctx: C) => Promise<unknown>) {
  return async (req: Request, ctx: C) => {
    try {
      const data = await fn(req, ctx);
      return NextResponse.json(data ?? { ok: true });
    } catch (e) {
      if (e instanceof ApiError) return NextResponse.json({ error: e.message }, { status: e.status });
      console.error(e);
      return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
  };
}
