/**
 * Database schema (Postgres on Aiven, Google europe-north1, Finland).
 *
 * How to read this file:
 * - Each `pgTable("name", { ... })` is one table. Each key inside is one column.
 * - `.primaryKey()` = unique id of a row. `.references(() => other.id)` = foreign key (link to another table).
 * - `.notNull()` = the column must have a value. `.default(...)` = value used when none is given.
 * - drizzle-kit reads this file and creates/updates the real tables ("migration"): `npm run db:push`.
 */
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  vector,
} from "drizzle-orm/pg-core";

const id = () => text("id").primaryKey().$defaultFn(() => crypto.randomUUID());
const createdAt = () => timestamp("created_at").notNull().defaultNow();

/* ------------------------------------------------------------------ *
 * 1. Login (managed by Better Auth). Users, sessions, password hashes.
 * ------------------------------------------------------------------ */
export const roleEnum = pgEnum("role", ["candidate", "company", "city"]);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(), // pseudonymous alias for candidates, e.g. "Candidate 7F2A"
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: roleEnum("role").notNull().default("candidate"), // our own field: decides which dashboard you see
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  token: text("token").notNull().unique(), // stored in a secure cookie in the browser
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(), // "credential" = email + password
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  password: text("password"), // hashed by Better Auth, never plain text
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: createdAt(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Signing keys for JWTs (Better Auth jwt plugin). Private key is encrypted at rest.
export const jwks = pgTable("jwks", {
  id: text("id").primaryKey(),
  publicKey: text("public_key").notNull(),
  privateKey: text("private_key").notNull(),
  alg: text("alg"), // signing algorithm, e.g. EdDSA
  crv: text("crv"), // curve, e.g. Ed25519
  createdAt: createdAt(),
  expiresAt: timestamp("expires_at"),
});

/* ------------------------------------------------------------------ *
 * 2. Companies and their needs
 * ------------------------------------------------------------------ */
export const companies = pgTable("companies", {
  id: id(),
  ownerId: text("owner_id").notNull().references(() => user.id),
  name: text("name").notNull(),
  website: text("website"),
  description: text("description"),
  sector: text("sector"),
  createdAt: createdAt(),
});

export const levelEnum = pgEnum("level", ["junior", "mid", "senior"]);

export type EscoSkill = { input: string; uri: string; label: { en: string; fi?: string; sv?: string } };

export const checkModeEnum = pgEnum("check_mode", ["required", "optional", "off"]);

/** Optional company questions per seniority level. The AI uses them as starting points. */
export type QuestionBank = { junior?: string[]; mid?: string[]; senior?: string[] };

export const needs = pgTable("needs", {
  id: id(),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  skills: jsonb("skills").$type<string[]>().notNull(),
  // Each skill linked to the EU ESCO taxonomy (labels in en/fi/sv) so needs are comparable across companies and languages.
  escoSkills: jsonb("esco_skills").$type<EscoSkill[]>(),
  level: levelEnum("level").notNull().default("mid"),
  checkMode: checkModeEnum("check_mode").notNull().default("required"), // required | optional | off (anyone can come)
  questionBank: jsonb("question_bank").$type<QuestionBank>(), // null = AI builds easy filter questions itself
  questionBankReview: jsonb("question_bank_review").$type<{ ok: boolean; problems: string[] }>(), // fairness screening
  // BARS: what a 1 / 3 / 5 answer looks like per skill, written before anyone is scored (see lib/ai/rubric.ts)
  anchors: jsonb("anchors").$type<{ skill: string; anchors: { "1": string; "3": string; "5": string }; checklist: string[] }[]>(),
  source: text("source").notNull().default("written"), // "written" | "ai_drafted"
  confirmedBy: text("confirmed_by").references(() => user.id), // a human confirmed the AI draft
  confirmedAt: timestamp("confirmed_at"),
  embedding: vector("embedding", { dimensions: 1024 }), // for matching (pgvector), filled later
  createdAt: createdAt(),
});

/** Company B accepts skill-check results from need A as equivalent (transferable checks). */
export const needEquivalences = pgTable("need_equivalences", {
  id: id(),
  needId: text("need_id").notNull().references(() => needs.id, { onDelete: "cascade" }), // B's need
  acceptsNeedId: text("accepts_need_id").notNull().references(() => needs.id, { onDelete: "cascade" }), // A's need
  acceptedBy: text("accepted_by").notNull().references(() => user.id),
  createdAt: createdAt(),
});

/* ------------------------------------------------------------------ *
 * 3. Recruitment events run by the City of Espoo
 * ------------------------------------------------------------------ */
export const events = pgTable("events", {
  id: id(),
  title: text("title").notNull(),
  startsAt: timestamp("starts_at").notNull(),
  rsvpDeadline: timestamp("rsvp_deadline"), // companies confirm attendance before this
  // "per_company" = each company chooses; "none" = open event, no skill checks needed for anyone
  checkPolicy: text("check_policy").notNull().default("per_company"),
  mode: text("mode").notNull().default("in_person"),
  location: text("location"),
  createdAt: createdAt(),
});

/**
 * A company at an event: applies → City approves → company confirms at least 1 week before.
 * checkMode = does this company need a skill check at this event (required / optional / off).
 */
export const eventCompanies = pgTable("event_companies", {
  id: id(),
  eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  checkMode: checkModeEnum("check_mode").notNull().default("required"),
  appliedAt: timestamp("applied_at").notNull().defaultNow(),
  approvedAt: timestamp("approved_at"),
  approvedBy: text("approved_by").references(() => user.id),
  confirmedAt: timestamp("confirmed_at"),
  confirmedBy: text("confirmed_by").references(() => user.id),
});

/** Which needs a company brings to an event. */
export const eventNeeds = pgTable("event_needs", {
  id: id(),
  eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  needId: text("need_id").notNull().references(() => needs.id, { onDelete: "cascade" }),
});

/** Rooms and 10-minute slots for company meetings at the event (not the testing rooms). */
export const meetingRooms = pgTable("meeting_rooms", {
  id: id(),
  eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
});

export const meetingSlots = pgTable("meeting_slots", {
  id: id(),
  eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  roomId: text("room_id").notNull().references(() => meetingRooms.id, { onDelete: "cascade" }),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at").notNull(),
});

/* ------------------------------------------------------------------ *
 * 4. Testing rooms (EXAM-room model): venue → room → workstation → 30 min slot
 * ------------------------------------------------------------------ */
export const venues = pgTable("venues", {
  id: id(),
  name: text("name").notNull(),
  address: text("address").notNull(),
});

export const testRooms = pgTable("test_rooms", {
  id: id(),
  venueId: text("venue_id").notNull().references(() => venues.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
});

/**
 * A City computer in a testing room, run as a locked kiosk. Enrolled by City staff: the computer gets a
 * secret cookie and only its SHA-256 hash is stored. It only lets in the person booked for the current slot.
 */
export const workstations = pgTable("workstations", {
  id: id(),
  roomId: text("room_id").notNull().references(() => testRooms.id, { onDelete: "cascade" }),
  label: text("label").notNull(), // e.g. "Workstation 3"
  tokenHash: text("token_hash").unique(),
  enrolledBy: text("enrolled_by").references(() => user.id),
  enrolledAt: timestamp("enrolled_at"),
  revokedAt: timestamp("revoked_at"),
});

export const testSlots = pgTable(
  "test_slots",
  {
    id: id(),
    workstationId: text("workstation_id").notNull().references(() => workstations.id, { onDelete: "cascade" }),
    startsAt: timestamp("starts_at").notNull(),
    endsAt: timestamp("ends_at").notNull(),
  },
  (t) => [index("test_slots_ws_time_idx").on(t.workstationId, t.startsAt)],
);

export const appointmentStatusEnum = pgEnum("appointment_status", [
  "booked", "in_progress", "completed", "rescheduled", "cancelled", "no_show",
]);

/** Who sits where and when. Up to 3 company needs per appointment. */
export const appointments = pgTable(
  "appointments",
  {
    id: id(),
    candidateId: text("candidate_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    slotId: text("slot_id").notNull().references(() => testSlots.id),
    needIds: jsonb("need_ids").$type<string[]>().notNull(),
    status: appointmentStatusEnum("status").notNull().default("booked"),
    rescheduleCount: integer("reschedule_count").notNull().default(0),
    previousAppointmentId: text("previous_appointment_id"),
    createdAt: createdAt(),
  },
  (t) => [index("appointments_slot_idx").on(t.slotId), index("appointments_candidate_idx").on(t.candidateId)],
);

/* ------------------------------------------------------------------ *
 * 5. Skill checks and AI evidence
 * ------------------------------------------------------------------ */
export const checkStatusEnum = pgEnum("check_status", ["in_progress", "evaluated", "needs_review", "withdrawn"]);

export type Difficulty = "low" | "medium" | "high";
export type StoredTurn = { question: string; said: string; seen: string; difficulty?: Difficulty };

export const skillChecks = pgTable(
  "skill_checks",
  {
    id: id(),
    candidateId: text("candidate_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    needId: text("need_id").notNull().references(() => needs.id, { onDelete: "cascade" }),
    appointmentId: text("appointment_id").references(() => appointments.id),
    workstationId: text("workstation_id").references(() => workstations.id), // the City computer it ran on
    language: text("language").notNull(),
    status: checkStatusEnum("status").notNull().default("in_progress"),
    // `said` = what the candidate wrote/said (stays in Finland). `seen` = pseudonymised text the AI got.
    turns: jsonb("turns").$type<StoredTurn[]>().notNull().default([]),
    pendingQuestion: text("pending_question"), // the question currently waiting for an answer
    pendingDifficulty: text("pending_difficulty").$type<Difficulty>(),
    showOnCard: boolean("show_on_card").notNull().default(false), // candidate opt-in: emblem on the event card
    shareWithEquivalent: boolean("share_with_equivalent").notNull().default(false), // opt-in: companies that accept this check
    codeResult: jsonb("code_result"),
    startedAt: createdAt(),
    finishedAt: timestamp("finished_at"),
    expiresAt: timestamp("expires_at"), // 12 months after finishing, then deleted (retention)
  },
  (t) => [index("skill_checks_need_idx").on(t.needId)],
);

export const evaluations = pgTable("evaluations", {
  id: id(),
  checkId: text("check_id").notNull().unique().references(() => skillChecks.id, { onDelete: "cascade" }),
  match: real("match").notNull(), // 0–10
  level: levelEnum("level").notNull(),
  confidence: real("confidence").notNull(), // 0–1
  difficulty: text("difficulty").$type<Difficulty>(), // highest question difficulty reached
  rubric: jsonb("rubric").notNull(),
  strengths: jsonb("strengths").$type<string[]>().notNull(),
  gaps: jsonb("gaps").$type<string[]>().notNull(),
  fairnessFlags: jsonb("fairness_flags").$type<string[]>().notNull(),
  fairnessNote: text("fairness_note"),
  model: text("model").notNull(), // which AI produced this (audit)
  method: jsonb("method"), // BARS: evidence coverage, agreement between the two scoring runs, raw run scores
  createdAt: createdAt(),
});

/* ------------------------------------------------------------------ *
 * 6. Human decisions = the audit log. Rows are only ever inserted, never updated.
 * ------------------------------------------------------------------ */
export const decisionEnum = pgEnum("decision", ["invite", "not_now", "needs_review", "approve", "reject"]);

export const decisions = pgTable("decisions", {
  id: id(),
  checkId: text("check_id").notNull().references(() => skillChecks.id, { onDelete: "cascade" }),
  decidedBy: text("decided_by").notNull().references(() => user.id),
  role: roleEnum("role").notNull(),
  decision: decisionEnum("decision").notNull(),
  companyId: text("company_id").references(() => companies.id), // which company this decision is about
  aiFollowed: boolean("ai_followed"), // did the human agree with the AI's suggestion?
  note: text("note"),
  createdAt: createdAt(),
});

/**
 * GDPR audit trail: every access to or change of personal data (Art. 5(2) accountability, Art. 30 records).
 * Append-only: a database trigger blocks UPDATE and DELETE (see src/db/sql/immutable-audit.sql).
 * actorId has no foreign key on purpose, so the trail survives account erasure.
 */
export const auditEvents = pgTable(
  "audit_events",
  {
    id: id(),
    at: timestamp("at").notNull().defaultNow(),
    actorId: text("actor_id"), // null = system (e.g. the AI agents)
    actorRole: text("actor_role").notNull(), // candidate | company | city | system
    action: text("action").notNull(), // e.g. check.viewed, decision.created, data.exported, account.erased
    subjectId: text("subject_id"), // whose personal data was touched (candidate user id)
    targetType: text("target_type"), // skill_check | booking | user | ...
    targetId: text("target_id"),
    purpose: text("purpose"), // why (GDPR purpose limitation), e.g. "recruitment event matching"
    meta: jsonb("meta"),
  },
  (t) => [index("audit_subject_idx").on(t.subjectId), index("audit_at_idx").on(t.at)],
);

export const bookings = pgTable("bookings", {
  id: id(),
  slotId: text("slot_id").notNull().references(() => meetingSlots.id),
  checkId: text("check_id").notNull().references(() => skillChecks.id, { onDelete: "cascade" }),
  candidateId: text("candidate_id").notNull().references(() => user.id),
  companyId: text("company_id").notNull().references(() => companies.id),
  status: text("status").notNull().default("booked"),
  qrToken: text("qr_token").notNull().$defaultFn(() => crypto.randomUUID()),
  createdAt: createdAt(),
});

/** Candidate chose to share their contact details with one company (consent, can be withdrawn). */
export const contactShares = pgTable("contact_shares", {
  id: id(),
  candidateId: text("candidate_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  companyId: text("company_id").notNull().references(() => companies.id, { onDelete: "cascade" }),
  createdAt: createdAt(),
  revokedAt: timestamp("revoked_at"),
});

export const videoSubmissions = pgTable("video_submissions", {
  id: id(),
  candidateId: text("candidate_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  needId: text("need_id").notNull().references(() => needs.id),
  url: text("url").notNull(),
  status: text("status").notNull().default("pending"),
  reviewedBy: text("reviewed_by").references(() => user.id),
  note: text("note"),
  createdAt: createdAt(),
});

