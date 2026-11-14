import { describe, expect, it } from "vitest";
import { patternPass } from "@/lib/ai/guard";
import { aliasFor } from "@/lib/alias";

describe("privacy guard, first pass (patterns)", () => {
  it("removes email addresses", () => expect(patternPass("Mail me at aino.makela@example.fi please")).not.toContain("@example.fi"));
  it("removes web addresses", () => expect(patternPass("See https://github.com/aino")).not.toContain("github.com/aino"));
  it("removes phone numbers", () => expect(patternPass("Call +358 40 123 4567")).not.toMatch(/123 ?4567/));
  it("keeps technical content", () => expect(patternPass("I used Python 3.12 and cut costs 30%.")).toBe("I used Python 3.12 and cut costs 30%."));
});

describe("alias shown to companies", () => {
  it("is stable for the same person", () => expect(aliasFor("user-1")).toBe(aliasFor("user-1")))
  it("differs between people", () => expect(aliasFor("user-1")).not.toBe(aliasFor("user-2")));
  it("looks like 'Candidate XXXX' and contains no id", () => {
    expect(aliasFor("user-1")).toMatch(/^Candidate [0-9A-F]{4}$/);
    expect(aliasFor("user-1")).not.toContain("user-1");
  });
});
