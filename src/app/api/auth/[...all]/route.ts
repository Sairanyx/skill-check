import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

// All Better Auth endpoints (/api/auth/sign-in/email, /api/auth/sign-out, …) are handled here.
export const { GET, POST } = toNextJsHandler(auth);
