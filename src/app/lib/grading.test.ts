import { describe, it, expect } from "vitest";
import { isGraded, gradingBadge, gradingColor, gradingSummary, RAW_COLOR, RAW_LABEL } from "./grading";

const graded = { grader: "PSA", grade: "10", gradeLabel: "Gem Mint" };
const raw = { grader: "", grade: "", gradeLabel: "" };

describe("isGraded", () => {
  it("requires both a grader and a grade", () => {
    expect(isGraded(graded)).toBe(true);
    expect(isGraded(raw)).toBe(false);
    // A half-filled card is not meaningfully graded.
    expect(isGraded({ grader: "PSA", grade: "" })).toBe(false);
    expect(isGraded({ grader: "", grade: "10" })).toBe(false);
  });

  it("treats whitespace as absent", () => {
    expect(isGraded({ grader: "   ", grade: "  " })).toBe(false);
  });
});

describe("gradingBadge", () => {
  // The badge used to render as `{grader} {grade}`, which for a raw card came
  // out as an empty coloured pill.
  it("labels a graded card with grader and grade", () => {
    expect(gradingBadge(graded)).toBe("PSA 10");
  });

  it("labels an ungraded card rather than rendering blank", () => {
    expect(gradingBadge(raw)).toBe(RAW_LABEL);
    expect(gradingBadge({ grader: "PSA", grade: "" })).toBe(RAW_LABEL);
  });
});

describe("gradingColor", () => {
  it("uses the grader's brand colour when graded", () => {
    expect(gradingColor(graded)).toBe("#E01F26");
  });

  it("falls back to the raw slate, never to an empty string", () => {
    expect(gradingColor(raw)).toBe(RAW_COLOR);
  });

  it("gives an unknown grader a real colour instead of undefined", () => {
    expect(gradingColor({ grader: "NOPE", grade: "9" })).toBe("#111111");
  });
});

describe("gradingSummary", () => {
  it("includes the condition label when there is one", () => {
    expect(gradingSummary(graded)).toBe("PSA 10 · Gem Mint");
  });

  it("omits a missing condition label", () => {
    expect(gradingSummary({ grader: "BGS", grade: "9", gradeLabel: "" })).toBe("BGS 9");
  });

  it("says Ungraded for a raw card", () => {
    expect(gradingSummary(raw)).toBe("Ungraded");
  });
});
