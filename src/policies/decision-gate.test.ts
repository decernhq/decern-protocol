import { describe, it, expect } from "vitest";
import {
  isBlockingRequired,
  isLinkedPRRequired,
  isApprovalRequired,
  defaultGatePolicyInput,
  dbRowToGatePolicyInput,
  mergeGatePolicyInput,
  isJudgeAdvisoryMode,
  isJudgeAvailable,
} from "./decision-gate";

const fullCaps = { canBlock: true, canRequireLinkedPR: true, canRequireApproved: true };
const noCaps = { canBlock: false, canRequireLinkedPR: false, canRequireApproved: false };

describe("isBlockingRequired", () => {
  it("returns true when canBlock=true and highImpact=true", () => {
    expect(isBlockingRequired(fullCaps, { highImpact: true, requireLinkedPR: false, requireApproved: false })).toBe(true);
  });

  it("returns false when canBlock=true and highImpact=false", () => {
    expect(isBlockingRequired(fullCaps, { highImpact: false, requireLinkedPR: false, requireApproved: false })).toBe(false);
  });

  it("returns false when canBlock=false even if highImpact=true", () => {
    expect(isBlockingRequired(noCaps, { highImpact: true, requireLinkedPR: false, requireApproved: false })).toBe(false);
  });

  it("returns false when both canBlock=false and highImpact=false", () => {
    expect(isBlockingRequired(noCaps, { highImpact: false, requireLinkedPR: false, requireApproved: false })).toBe(false);
  });
});

describe("isLinkedPRRequired", () => {
  it("returns true when canRequireLinkedPR=true and requireLinkedPR=true", () => {
    expect(isLinkedPRRequired(fullCaps, { highImpact: true, requireLinkedPR: true, requireApproved: false })).toBe(true);
  });

  it("returns false when canRequireLinkedPR=true but requireLinkedPR=false", () => {
    expect(isLinkedPRRequired(fullCaps, { highImpact: true, requireLinkedPR: false, requireApproved: false })).toBe(false);
  });

  it("returns false when canRequireLinkedPR=false even if requireLinkedPR=true", () => {
    expect(isLinkedPRRequired(noCaps, { highImpact: true, requireLinkedPR: true, requireApproved: false })).toBe(false);
  });
});

describe("isApprovalRequired", () => {
  it("returns true when canRequireApproved=true and requireApproved=true", () => {
    expect(isApprovalRequired(fullCaps, { highImpact: true, requireLinkedPR: false, requireApproved: true })).toBe(true);
  });

  it("returns false when canRequireApproved=false even if requireApproved=true", () => {
    expect(isApprovalRequired(noCaps, { highImpact: true, requireLinkedPR: false, requireApproved: true })).toBe(false);
  });

  it("returns false when canRequireApproved=true but requireApproved=false", () => {
    expect(isApprovalRequired(fullCaps, { highImpact: true, requireLinkedPR: false, requireApproved: false })).toBe(false);
  });
});

describe("defaultGatePolicyInput", () => {
  it("returns default values", () => {
    expect(defaultGatePolicyInput()).toEqual({
      highImpact: true,
      requireLinkedPR: false,
      requireApproved: true,
    });
  });
});

describe("dbRowToGatePolicyInput", () => {
  it("maps DB column names to camelCase", () => {
    const row = { high_impact: true, require_linked_pr: true, require_approved: false };
    expect(dbRowToGatePolicyInput(row)).toEqual({
      highImpact: true,
      requireLinkedPR: true,
      requireApproved: false,
    });
  });

  it("maps all false values correctly", () => {
    const row = { high_impact: false, require_linked_pr: false, require_approved: false };
    expect(dbRowToGatePolicyInput(row)).toEqual({
      highImpact: false,
      requireLinkedPR: false,
      requireApproved: false,
    });
  });
});

describe("mergeGatePolicyInput", () => {
  it("returns defaults when no DB row and no query params", () => {
    const result = mergeGatePolicyInput(null, new URLSearchParams());
    expect(result).toEqual({ highImpact: true, requireLinkedPR: false, requireApproved: true });
  });

  it("DB row overrides defaults", () => {
    const row = { high_impact: false, require_linked_pr: true, require_approved: false };
    const result = mergeGatePolicyInput(row, new URLSearchParams());
    expect(result).toEqual({ highImpact: false, requireLinkedPR: true, requireApproved: false });
  });

  it("query params override DB row", () => {
    const row = { high_impact: false, require_linked_pr: true, require_approved: false };
    const params = new URLSearchParams({ highImpact: "true", requireApproved: "true" });
    const result = mergeGatePolicyInput(row, params);
    expect(result.highImpact).toBe(true);
    expect(result.requireApproved).toBe(true);
    expect(result.requireLinkedPR).toBe(true); // from DB, not overridden
  });

  it("query param highImpact=false overrides default true", () => {
    const result = mergeGatePolicyInput(null, new URLSearchParams({ highImpact: "false" }));
    expect(result.highImpact).toBe(false);
  });

  it("query param highImpact=1 is truthy", () => {
    const result = mergeGatePolicyInput(null, new URLSearchParams({ highImpact: "1" }));
    expect(result.highImpact).toBe(true);
  });

  it("query param requireApproved=false => false", () => {
    const result = mergeGatePolicyInput(null, new URLSearchParams({ requireApproved: "false" }));
    expect(result.requireApproved).toBe(false);
  });

  it("query param requireApproved='' (empty) => true (special case)", () => {
    const params = new URLSearchParams();
    params.set("requireApproved", "");
    const result = mergeGatePolicyInput(null, params);
    expect(result.requireApproved).toBe(true);
  });

  it("query params not present => does not override DB row", () => {
    const row = { high_impact: false, require_linked_pr: false, require_approved: false };
    const result = mergeGatePolicyInput(row, new URLSearchParams());
    expect(result.requireApproved).toBe(false); // from DB, not default
  });

  it("query param requireLinkedPR=true overrides default false", () => {
    const result = mergeGatePolicyInput(null, new URLSearchParams({ requireLinkedPR: "true" }));
    expect(result.requireLinkedPR).toBe(true);
  });
});

describe("isJudgeAdvisoryMode", () => {
  it("returns false when judgeCanBlock=true", () => {
    expect(isJudgeAdvisoryMode({ judgeEnabled: true, judgeCanBlock: true })).toBe(false);
  });

  it("returns true when judgeCanBlock=false", () => {
    expect(isJudgeAdvisoryMode({ judgeEnabled: true, judgeCanBlock: false })).toBe(true);
  });
});

describe("isJudgeAvailable", () => {
  it("returns true when judgeEnabled=true", () => {
    expect(isJudgeAvailable({ judgeEnabled: true, judgeCanBlock: true })).toBe(true);
  });

  it("returns false when judgeEnabled=false", () => {
    expect(isJudgeAvailable({ judgeEnabled: false, judgeCanBlock: false })).toBe(false);
  });
});
