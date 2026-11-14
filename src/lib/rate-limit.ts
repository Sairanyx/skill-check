import "server-only";
import { ApiError } from "./api";

/**
 * Simple in-memory rate limits (one app server, so memory is enough).
 * Protects against password guessing and against burning GPU time or AI credits.
 * Limits are generous: at events many people share one network address.
 */
const hits = new Map<string, { count: number; resetAt: number }>();

export function allow(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const h = hits.get(key);
  if (!h || h.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    if (hits.size > 10_000) for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k); // keep memory small
    return true;
  }
  h.count++;
  return h.count <= max;
}

/** Throws 429 "Too many requests" when over the limit. */
export function limit(key: string, max: number, windowMs: number) {
  if (!allow(key, max, windowMs)) throw new ApiError(429, "Too many requests. Please wait a moment and try again.");
}

const MIN = 60_000;
export const LIMITS = {
  loginPerIp: [60, 10 * MIN], // a whole event venue can share one address
  loginPerEmail: [10, 10 * MIN], // password guessing on one account
  signupPerIp: [30, 60 * MIN],
  answerPerUser: [20, MIN], // AI interview turns
  startPerUser: [10, 10 * MIN],
  transcribePerUser: [30, MIN], // speech to text
  newNeedPerUser: [20, 60 * MIN], // ESCO + anchors generation
} as const;

/** The visitor's network address (Caddy sets X-Forwarded-For). */
export const clientIp = (h: Headers) => h.get("x-forwarded-for")?.split(",")[0].trim() || h.get("x-real-ip") || "unknown";
