import { createHash } from "node:crypto";

/**
 * Stable pseudonym shown to companies (and to City reviewers by default), derived from the user id.
 * Never the display name: people sometimes type their real name there.
 */
export const aliasFor = (userId: string) =>
  `Candidate ${createHash("sha256").update(`skillcheck:${userId}`).digest("hex").slice(0, 4).toUpperCase()}`;
