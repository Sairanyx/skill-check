/**
 * Official proofs a job may require. No CV, no cover letter: only proofs the work itself needs.
 * A fixed catalogue (not free text), so "does the jobseeker have it?" is an exact match.
 * `check` tells City staff how to verify it when the jobseeker visits the testing room.
 */
export type ProofKind = "language" | "licence" | "card" | "degree";

export type ProofType = {
  code: string;
  kind: ProofKind;
  label: { en: string; fi: string; sv: string };
  check: string; // how City staff verify it
};

export const PROOF_TYPES: ProofType[] = [
  // Language: one entry per language, the level is stored on the proof (CEFR A1–C2 = YKI 1–6).
  { code: "language-fi", kind: "language", label: { en: "Finnish language certificate", fi: "Suomen kielen todistus", sv: "Intyg i finska" }, check: "See the original YKI certificate or equivalent (level 1–6 = A1–C2)" },
  { code: "language-sv", kind: "language", label: { en: "Swedish language certificate", fi: "Ruotsin kielen todistus", sv: "Intyg i svenska" }, check: "See the original YKI certificate or equivalent (level 1–6 = A1–C2)" },
  { code: "language-en", kind: "language", label: { en: "English language certificate", fi: "Englannin kielen todistus", sv: "Intyg i engelska" }, check: "See the original certificate (YKI, Cambridge, IELTS, TOEFL)" },
  // Regulated professions: the public register is the source of truth.
  { code: "licence-nurse", kind: "licence", label: { en: "Registered nurse", fi: "Sairaanhoitaja", sv: "Sjukskötare" }, check: "Search the public JulkiTerhikki register (Finnish Supervisory Agency)" },
  { code: "licence-practical-nurse", kind: "licence", label: { en: "Practical nurse", fi: "Lähihoitaja", sv: "Närvårdare" }, check: "Search the public JulkiTerhikki register (Finnish Supervisory Agency)" },
  { code: "licence-doctor", kind: "licence", label: { en: "Licensed doctor", fi: "Laillistettu lääkäri", sv: "Legitimerad läkare" }, check: "Search the public JulkiTerhikki register (Finnish Supervisory Agency)" },
  { code: "licence-attorney", kind: "licence", label: { en: "Attorney (asianajaja)", fi: "Asianajaja", sv: "Advokat" }, check: "Search the public register of the Finnish Bar Association" },
  // Work cards: shown in person.
  { code: "card-hygiene", kind: "card", label: { en: "Hygiene passport", fi: "Hygieniapassi", sv: "Hygienpass" }, check: "See the original card (Finnish Food Authority)" },
  { code: "card-safety", kind: "card", label: { en: "Occupational safety card", fi: "Työturvallisuuskortti", sv: "Arbetarskyddskort" }, check: "See the original card or the card register" },
  { code: "card-first-aid", kind: "card", label: { en: "First aid certificate", fi: "Ensiapukortti", sv: "Första hjälpen-intyg" }, check: "See the original certificate and its expiry date" },
  { code: "card-forklift", kind: "card", label: { en: "Forklift licence", fi: "Trukkikortti", sv: "Truckkort" }, check: "See the original card or the course certificate" },
  { code: "card-hot-work", kind: "card", label: { en: "Hot work licence", fi: "Tulityökortti", sv: "Heta arbeten-kort" }, check: "See the original card and its expiry date (valid 5 years)" },
  { code: "card-electrical-safety", kind: "card", label: { en: "Electrical safety card", fi: "Sähkötyöturvallisuuskortti", sv: "Elarbetssäkerhetskort" }, check: "See the original card and its expiry date" },
  { code: "card-driving-d", kind: "card", label: { en: "Driving licence, category D (bus)", fi: "Ajokortti, D-luokka (linja-auto)", sv: "Körkort, klass D (buss)" }, check: "See the original driving licence" },
  { code: "card-driver-cpc", kind: "card", label: { en: "Professional driver qualification (code 95)", fi: "Kuljettajan ammattipätevyys (koodi 95)", sv: "Yrkeskompetens för förare (kod 95)" }, check: "Code 95 on the driving licence, or the qualification card" },
  { code: "card-driving-c", kind: "card", label: { en: "Driving licence, category C", fi: "Ajokortti, C-luokka", sv: "Körkort, klass C" }, check: "See the original driving licence" },
  // Degrees: only when the law or the job truly requires one.
  { code: "degree-bachelor", kind: "degree", label: { en: "Bachelor's degree", fi: "Alempi korkeakoulututkinto", sv: "Lägre högskoleexamen" }, check: "See the original degree certificate (or a recognition decision for a foreign degree)" },
  { code: "degree-master", kind: "degree", label: { en: "Master's degree", fi: "Ylempi korkeakoulututkinto", sv: "Högre högskoleexamen" }, check: "See the original degree certificate (or a recognition decision for a foreign degree)" },
];

export const proofType = (code: string) => PROOF_TYPES.find((p) => p.code === code);
