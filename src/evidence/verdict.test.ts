import { describe, it, expect } from "vitest";
import { computeVerdict } from "./verdict.js";
import type { CheckResult } from "./checks/types.js";

const passingCheck: CheckResult = {
  check_id: "path_denylist_0",
  check_type: "path_denylist",
  result: "pass",
  details: "No denied paths matched.",
  details_hash: "abc",
};

const failingCheck: CheckResult = {
  check_id: "path_denylist_0",
  check_type: "path_denylist",
  result: "fail",
  details: "Denied paths matched: terraform/main.tf",
  details_hash: "def",
};

describe("computeVerdict", () => {
  it("passes when all deterministic checks pass and no judge", () => {
    const result = computeVerdict({
      judgeOutcome: null,
      deterministicResults: [passingCheck],
      judgeMode: "advisory",
      advisory: false,
    });
    expect(result.verdict).toBe("pass");
    expect(result.reasonCode).toBe("PASS");
  });

  it("blocks on deterministic failure regardless of judge mode", () => {
    const result = computeVerdict({
      judgeOutcome: { allowed: true, reason: "Aligned.", confidence: 0.95 },
      deterministicResults: [failingCheck],
      judgeMode: "advisory",
      advisory: false,
    });
    expect(result.verdict).toBe("block");
    expect(result.reasonCode).toBe("DETERMINISTIC_RULE_VIOLATION");
  });

  it("blocks on deterministic failure even in deterministic_only mode", () => {
    const result = computeVerdict({
      judgeOutcome: null,
      deterministicResults: [failingCheck],
      judgeMode: "deterministic_only",
      advisory: false,
    });
    expect(result.verdict).toBe("block");
    expect(result.reasonCode).toBe("DETERMINISTIC_RULE_VIOLATION");
  });

  it("deterministic_only: passes even when judge says block (acceptance criteria #7)", () => {
    const result = computeVerdict({
      judgeOutcome: { allowed: false, reason: "Out of scope.", confidence: 0.3 },
      deterministicResults: [passingCheck],
      judgeMode: "deterministic_only",
      advisory: false,
    });
    expect(result.verdict).toBe("pass");
    expect(result.reasonCode).toBe("PASS");
    expect(result.reasonDetail).toContain("Judge (advisory)");
  });

  it("advisory mode: judge block becomes warn when advisory=true", () => {
    const result = computeVerdict({
      judgeOutcome: { allowed: false, reason: "Misaligned.", confidence: 0.2 },
      deterministicResults: [],
      judgeMode: "advisory",
      advisory: true,
    });
    expect(result.verdict).toBe("warn");
    expect(result.reasonCode).toBe("PASS_OBSERVATION");
  });

  it("advisory mode: judge block becomes block when advisory=false", () => {
    const result = computeVerdict({
      judgeOutcome: { allowed: false, reason: "Misaligned.", confidence: 0.2 },
      deterministicResults: [],
      judgeMode: "advisory",
      advisory: false,
    });
    expect(result.verdict).toBe("block");
    expect(result.reasonCode).toBe("JUDGE_BLOCKED");
  });

  it("advisory mode: judge pass is verdict pass", () => {
    const result = computeVerdict({
      judgeOutcome: { allowed: true, reason: "Aligned.", confidence: 0.95 },
      deterministicResults: [],
      judgeMode: "advisory",
      advisory: false,
    });
    expect(result.verdict).toBe("pass");
    expect(result.reasonCode).toBe("PASS");
  });

  it("truncates reason_detail to 2000 chars", () => {
    const longReason = "x".repeat(3000);
    const result = computeVerdict({
      judgeOutcome: { allowed: false, reason: longReason, confidence: null },
      deterministicResults: [],
      judgeMode: "advisory",
      advisory: false,
    });
    expect(result.reasonDetail.length).toBeLessThanOrEqual(2000);
  });
});
