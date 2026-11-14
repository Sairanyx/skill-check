import { describe, expect, it } from "vitest";
import { allow } from "@/lib/rate-limit";
import { PROOF_TYPES, proofType } from "@/lib/proofs";

describe("rate limits", () => {
  it("allows up to the limit, then blocks", () => {
    const r = Array.from({ length: 12 }, () => allow("test-key", 10, 60_000));
    expect(r.filter(Boolean)).toHaveLength(10);
  });
  it("counts each key separately", () => {
    for (let i = 0; i < 10; i++) allow("a", 10, 60_000);
    expect(allow("b", 10, 60_000)).toBe(true);
  });
});

describe("official proofs catalogue", () => {
  it("codes are unique", () => expect(new Set(PROOF_TYPES.map((p) => p.code)).size).toBe(PROOF_TYPES.length));
  it("every proof says how City staff check it, in three languages", () =>
    PROOF_TYPES.forEach((p) => {
      expect(p.check.length).toBeGreaterThan(10);
      expect(p.label.fi && p.label.sv && p.label.en).toBeTruthy();
    }));
  it("health licences are checked in the public register", () => expect(proofType("licence-nurse")?.check).toMatch(/JulkiTerhikki/));
  it("unknown codes are rejected", () => expect(proofType("cv")).toBeUndefined());
});
