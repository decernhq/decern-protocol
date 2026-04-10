import { describe, it, expect } from "vitest";
import { computeVerdict } from "./verdict.js";
import type { CheckResult } from "./checks/types.js";

const passingCheck: CheckResult = {
  check_id: "path_denylist_0", check_type: "path_denylist", result: "pass",
  details: "No denied paths matched.", details_hash: "abc",
};
const failingCheck: CheckResult = {
  check_id: "path_denylist_0", check_type: "path_denylist", result: "fail",
  details: "Denied paths matched: terraform/main.tf", details_hash: "def",
};

describe("computeVerdict", () => {
  it("passes when all deterministic checks pass and no judge", () => {
    const r = computeVerdict({ judgeOutcome: null, deterministicResults: [passingCheck], judgeMode: "blocking" });
    expect(r.verdict).toBe("pass");
    expect(r.reasonCode).toBe("PASS");
  });

  it("blocks on deterministic failure regardless of judge mode", () => {
    const r = computeVerdict({ judgeOutcome: { allowed: true, reason: "ok", confidence: 0.95 }, deterministicResults: [failingCheck], judgeMode: "blocking" });
    expect(r.verdict).toBe("block");
    expect(r.reasonCode).toBe("DETERMINISTIC_RULE_VIOLATION");
  });

  it("blocks on deterministic failure even in deterministic_only mode", () => {
    const r = computeVerdict({ judgeOutcome: null, deterministicResults: [failingCheck], judgeMode: "deterministic_only" });
    expect(r.verdict).toBe("block");
    expect(r.reasonCode).toBe("DETERMINISTIC_RULE_VIOLATION");
  });

  it("deterministic_only: passes even when judge says block", () => {
    const r = computeVerdict({ judgeOutcome: { allowed: false, reason: "Out of scope.", confidence: 0.3 }, deterministicResults: [passingCheck], judgeMode: "deterministic_only" });
    expect(r.verdict).toBe("pass");
    expect(r.reasonCode).toBe("PASS");
    expect(r.reasonDetail).toContain("Judge (advisory)");
  });

  it("advisory mode: judge block becomes warn", () => {
    const r = computeVerdict({ judgeOutcome: { allowed: false, reason: "Misaligned.", confidence: 0.2 }, deterministicResults: [], judgeMode: "advisory" });
    expect(r.verdict).toBe("warn");
    expect(r.reasonCode).toBe("PASS_OBSERVATION");
  });

  it("blocking mode: judge block becomes block", () => {
    const r = computeVerdict({ judgeOutcome: { allowed: false, reason: "Misaligned.", confidence: 0.2 }, deterministicResults: [], judgeMode: "blocking" });
    expect(r.verdict).toBe("block");
    expect(r.reasonCode).toBe("JUDGE_BLOCKED");
  });

  it("blocking mode: judge pass is verdict pass", () => {
    const r = computeVerdict({ judgeOutcome: { allowed: true, reason: "Aligned.", confidence: 0.95 }, deterministicResults: [], judgeMode: "blocking" });
    expect(r.verdict).toBe("pass");
    expect(r.reasonCode).toBe("PASS");
  });

  it("truncates reason_detail to 2000 chars", () => {
    const r = computeVerdict({ judgeOutcome: { allowed: false, reason: "x".repeat(3000), confidence: null }, deterministicResults: [], judgeMode: "blocking" });
    expect(r.reasonDetail.length).toBeLessThanOrEqual(2000);
  });
});
