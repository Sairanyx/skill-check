import { describe, expect, it } from "vitest";
import { isAccepted, stepDifficulty, median, computeScores, cefrAtLeast } from "@/lib/rules";

describe("accept rule (D11)", () => {
  it("company yes is accepted", () => expect(isAccepted("invite", undefined)).toBe(true));
  it("City yes is accepted when the company has not decided", () => expect(isAccepted(undefined, "invite")).toBe(true));
  it("company no overrides a City yes, for that company", () => expect(isAccepted("not_now", "invite")).toBe(false));
  it("company yes wins over a City no", () => expect(isAccepted("invite", "not_now")).toBe(true));
  it("nobody decided is not accepted", () => expect(isAccepted()).toBe(false));
});

describe("interview difficulty", () => {
  const base = { start: "medium", ceiling: "high", first: false } as const;
  it("first question uses the start level", () => expect(stepDifficulty({ ...base, proposed: "high", previous: "low", first: true })).toBe("medium"));
  it("moves at most one step up", () => expect(stepDifficulty({ ...base, proposed: "high", previous: "low" })).toBe("medium"));
  it("moves at most one step down", () => expect(stepDifficulty({ ...base, proposed: "low", previous: "high" })).toBe("medium"));
  it("never goes above the ceiling", () => expect(stepDifficulty({ ...base, ceiling: "medium", proposed: "high", previous: "medium" })).toBe("medium"));
  it("keeps the level when the model returns nonsense", () => expect(stepDifficulty({ ...base, proposed: "extreme", previous: "medium" })).toBe("medium"));
});

describe("median", () => {
  it("odd", () => expect(median([1, 5, 3])).toBe(3));
  it("even is the mean of the middle two", () => expect(median([2, 4])).toBe(3));
  it("one outlier judge cannot move it", () => expect(median([3, 3, 5])).toBe(3));
});

describe("scores (BARS)", () => {
  const run = (...s: number[]) => s.map((score) => ({ score }));
  it("match is computed over shown skills only", () => {
    const c = computeScores([run(4, 4, 0), run(4, 4, 0)], "medium");
    expect(c.match).toBe(8);
    expect(c.coverage).toBe(0.67);
  });
  it("a skill not shown lowers confidence, not the match", () => {
    const all = computeScores([run(4, 4, 4), run(4, 4, 4)], "medium");
    const two = computeScores([run(4, 4, 0), run(4, 4, 0)], "medium");
    expect(two.match).toBe(all.match);
    expect(two.confidence).toBeLessThan(all.confidence);
  });
  it("judges that disagree lower confidence", () => {
    const same = computeScores([run(3, 3), run(3, 3), run(3, 3)], "medium");
    const split = computeScores([run(1, 1), run(3, 3), run(5, 5)], "medium");
    expect(split.match).toBe(same.match);
    expect(split.confidence).toBeLessThan(same.confidence);
  });
  it("senior only after high difficulty", () => {
    expect(computeScores([run(5, 5)], "medium").level).toBe("mid");
    expect(computeScores([run(5, 5)], "high").level).toBe("senior");
  });
  it("no evidence at all gives 0", () => expect(computeScores([run(0, 0)], "low").match).toBe(0));
});

describe("CEFR levels", () => {
  it("B2 meets B2", () => expect(cefrAtLeast("B2", "B2")).toBe(true));
  it("C1 meets B2", () => expect(cefrAtLeast("C1", "B2")).toBe(true));
  it("B1 does not meet B2", () => expect(cefrAtLeast("B1", "B2")).toBe(false));
  it("unknown level never meets", () => expect(cefrAtLeast("native", "A1")).toBe(false));
});
