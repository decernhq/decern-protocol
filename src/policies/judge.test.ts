import { describe, it, expect } from "vitest";
import { buildJudgeDecisionText, parseJudgeResponse, computeJudgeOutcome } from "./judge";

describe("buildJudgeDecisionText", () => {
  it("includes title as h1", () => {
    const result = buildJudgeDecisionText({
      title: "Use PostgreSQL",
      context: "We need a DB.",
      options: [],
      decision: "We chose PostgreSQL.",
      consequences: "",
    });
    expect(result).toContain("# Use PostgreSQL");
  });

  it("includes context", () => {
    const result = buildJudgeDecisionText({
      title: "T",
      context: "Context here.",
      options: [],
      decision: "D",
      consequences: "",
    });
    expect(result).toContain("Context here.");
  });

  it("includes options when present", () => {
    const result = buildJudgeDecisionText({
      title: "T",
      context: "C",
      options: ["Option A", "Option B"],
      decision: "D",
      consequences: "",
    });
    expect(result).toContain("Options considered:");
    expect(result).toContain("- Option A");
    expect(result).toContain("- Option B");
  });

  it("omits Options section when options is empty", () => {
    const result = buildJudgeDecisionText({
      title: "T",
      context: "C",
      options: [],
      decision: "D",
      consequences: "",
    });
    expect(result).not.toContain("Options considered:");
  });

  it("includes consequences when present", () => {
    const result = buildJudgeDecisionText({
      title: "T",
      context: "C",
      options: [],
      decision: "D",
      consequences: "ACID compliance.",
    });
    expect(result).toContain("## Consequences");
    expect(result).toContain("ACID compliance.");
  });

  it("omits consequences section when empty", () => {
    const result = buildJudgeDecisionText({
      title: "T",
      context: "C",
      options: [],
      decision: "D",
      consequences: "",
    });
    expect(result).not.toContain("## Consequences");
  });

  it("includes decision section", () => {
    const result = buildJudgeDecisionText({
      title: "T",
      context: "C",
      options: [],
      decision: "We chose PostgreSQL.",
      consequences: "",
    });
    expect(result).toContain("## Decision");
    expect(result).toContain("We chose PostgreSQL.");
  });
});

describe("parseJudgeResponse", () => {
  it("parses valid JSON with all fields", () => {
    const raw = JSON.stringify({
      allowed: true,
      reason: "Change aligns.",
      score: 80,
      advisoryNotes: "Minor improvements possible.",
    });
    const result = parseJudgeResponse(raw);
    expect(result.allowed).toBe(true);
    expect(result.reason).toBe("Change aligns.");
    expect(result.score).toBe(80);
    expect(result.advisoryNotes).toBe("Minor improvements possible.");
  });

  it("parses fenced ```json block", () => {
    const raw = "```json\n{\"allowed\": true, \"reason\": \"ok\", \"score\": 90}\n```";
    const result = parseJudgeResponse(raw);
    expect(result.allowed).toBe(true);
    expect(result.score).toBe(90);
  });

  it("parses fenced ``` block without json label", () => {
    const raw = "```\n{\"allowed\": false, \"reason\": \"no\"}\n```";
    const result = parseJudgeResponse(raw);
    expect(result.allowed).toBe(false);
  });

  it("defaults allowed to false when not true", () => {
    const result = parseJudgeResponse(JSON.stringify({ allowed: "yes" }));
    expect(result.allowed).toBe(false);
  });

  it("defaults reason when missing and allowed=true", () => {
    const result = parseJudgeResponse(JSON.stringify({ allowed: true }));
    expect(result.reason).toBe("Change aligns with the decision.");
  });

  it("defaults reason when missing and allowed=false", () => {
    const result = parseJudgeResponse(JSON.stringify({ allowed: false }));
    expect(result.reason).toBe("Change does not align with the decision.");
  });

  it("clamps score above 100 to 100", () => {
    const result = parseJudgeResponse(JSON.stringify({ allowed: true, score: 150 }));
    expect(result.score).toBe(100);
  });

  it("clamps score below 0 to 0", () => {
    const result = parseJudgeResponse(JSON.stringify({ allowed: false, score: -10 }));
    expect(result.score).toBe(0);
  });

  it("score exactly 0 is preserved", () => {
    const result = parseJudgeResponse(JSON.stringify({ allowed: false, score: 0 }));
    expect(result.score).toBe(0);
  });

  it("score exactly 100 is preserved", () => {
    const result = parseJudgeResponse(JSON.stringify({ allowed: true, score: 100 }));
    expect(result.score).toBe(100);
  });

  it("parses string score", () => {
    const result = parseJudgeResponse(JSON.stringify({ allowed: true, score: "75" }));
    expect(result.score).toBe(75);
  });

  it("clamps string score above 100", () => {
    const result = parseJudgeResponse(JSON.stringify({ allowed: true, score: "200" }));
    expect(result.score).toBe(100);
  });

  it("sets score to null when NaN string", () => {
    const result = parseJudgeResponse(JSON.stringify({ allowed: true, score: "not-a-number" }));
    expect(result.score).toBeNull();
  });

  it("sets score to null when boolean", () => {
    const result = parseJudgeResponse(JSON.stringify({ allowed: true, score: true }));
    expect(result.score).toBeNull();
  });

  it("sets advisoryNotes to null when empty string", () => {
    const result = parseJudgeResponse(JSON.stringify({ allowed: true, advisoryNotes: "" }));
    expect(result.advisoryNotes).toBeNull();
  });

  it("sets advisoryNotes to null when whitespace only", () => {
    const result = parseJudgeResponse(JSON.stringify({ allowed: true, advisoryNotes: "   " }));
    expect(result.advisoryNotes).toBeNull();
  });

  it("sets advisoryNotes to null when not a string", () => {
    const result = parseJudgeResponse(JSON.stringify({ allowed: true, advisoryNotes: 42 }));
    expect(result.advisoryNotes).toBeNull();
  });

  it("trims advisoryNotes", () => {
    const result = parseJudgeResponse(JSON.stringify({ allowed: true, advisoryNotes: "  note  " }));
    expect(result.advisoryNotes).toBe("note");
  });

  it("returns invalid result for invalid JSON", () => {
    const result = parseJudgeResponse("not json at all");
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("Judge response invalid.");
    expect(result.score).toBeNull();
    expect(result.advisoryNotes).toBeNull();
  });

  it("returns invalid result for empty string", () => {
    const result = parseJudgeResponse("");
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("Judge response invalid.");
  });

  it("returns invalid result for partial JSON", () => {
    const result = parseJudgeResponse('{"allowed": true');
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe("Judge response invalid.");
  });
});

describe("computeJudgeOutcome", () => {
  it("score >= threshold => allowed=true, confidence=score/100", () => {
    const result = computeJudgeOutcome({
      parsed: { allowed: true, reason: "ok", score: 85, advisoryNotes: null },
      thresholdPercent: 70,
    });
    expect(result.allowed).toBe(true);
    expect(result.confidence).toBeCloseTo(0.85);
  });

  it("score < threshold => allowed=false even if allowed=true in parsed", () => {
    const result = computeJudgeOutcome({
      parsed: { allowed: true, reason: "ok", score: 60, advisoryNotes: null },
      thresholdPercent: 70,
    });
    expect(result.allowed).toBe(false);
    expect(result.confidence).toBeCloseTo(0.60);
  });

  it("score exactly at threshold => allowed=true", () => {
    const result = computeJudgeOutcome({
      parsed: { allowed: true, reason: "ok", score: 70, advisoryNotes: null },
      thresholdPercent: 70,
    });
    expect(result.allowed).toBe(true);
  });

  it("score=0, threshold=0 => allowed=true", () => {
    const result = computeJudgeOutcome({
      parsed: { allowed: true, reason: "ok", score: 0, advisoryNotes: null },
      thresholdPercent: 0,
    });
    expect(result.allowed).toBe(true);
    expect(result.confidence).toBe(0);
  });

  it("score=null, allowed=true => confidence=1", () => {
    const result = computeJudgeOutcome({
      parsed: { allowed: true, reason: "ok", score: null, advisoryNotes: null },
      thresholdPercent: 70,
    });
    expect(result.allowed).toBe(true);
    expect(result.confidence).toBe(1);
  });

  it("score=null, allowed=false => confidence=0", () => {
    const result = computeJudgeOutcome({
      parsed: { allowed: false, reason: "no", score: null, advisoryNotes: null },
      thresholdPercent: 70,
    });
    expect(result.allowed).toBe(false);
    expect(result.confidence).toBe(0);
  });

  it("score=100 => no advisoryMessage (not < 100)", () => {
    const result = computeJudgeOutcome({
      parsed: { allowed: true, reason: "ok", score: 100, advisoryNotes: "note" },
      thresholdPercent: 70,
    });
    expect(result.advisoryMessage).toBeUndefined();
  });

  it("score=85, advisoryNotes set => advisoryMessage=advisoryNotes", () => {
    const result = computeJudgeOutcome({
      parsed: { allowed: true, reason: "ok", score: 85, advisoryNotes: "review error handling" },
      thresholdPercent: 70,
    });
    expect(result.advisoryMessage).toBe("review error handling");
  });

  it("score=85, no advisoryNotes => advisoryMessage=reason", () => {
    const result = computeJudgeOutcome({
      parsed: { allowed: true, reason: "Could be better.", score: 85, advisoryNotes: null },
      thresholdPercent: 70,
    });
    expect(result.advisoryMessage).toBe("Could be better.");
  });

  it("score=60 (blocked) => no advisoryMessage", () => {
    const result = computeJudgeOutcome({
      parsed: { allowed: true, reason: "ok", score: 60, advisoryNotes: "note" },
      thresholdPercent: 70,
    });
    expect(result.allowed).toBe(false);
    expect(result.advisoryMessage).toBeUndefined();
  });

  it("score=null, allowed=true => no advisoryMessage", () => {
    const result = computeJudgeOutcome({
      parsed: { allowed: true, reason: "ok", score: null, advisoryNotes: "note" },
      thresholdPercent: 70,
    });
    expect(result.advisoryMessage).toBeUndefined();
  });

  it("uses parsed.reason in output", () => {
    const result = computeJudgeOutcome({
      parsed: { allowed: true, reason: "Custom reason.", score: null, advisoryNotes: null },
      thresholdPercent: 70,
    });
    expect(result.reason).toBe("Custom reason.");
  });

  it("falls back to default reason when reason is empty string", () => {
    const result = computeJudgeOutcome({
      parsed: { allowed: true, reason: "", score: null, advisoryNotes: null },
      thresholdPercent: 70,
    });
    expect(result.reason).toBe("Change aligns with the decision.");
  });

  it("falls back to default not-allowed reason when allowed=false and reason empty", () => {
    const result = computeJudgeOutcome({
      parsed: { allowed: false, reason: "", score: null, advisoryNotes: null },
      thresholdPercent: 70,
    });
    expect(result.reason).toBe("Change does not align with the decision.");
  });
});
