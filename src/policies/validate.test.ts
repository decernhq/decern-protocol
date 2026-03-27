import { describe, it, expect } from "vitest";
import { normalizePullRequestUrls, validateDecisionAgainstPolicy } from "./validate";

describe("normalizePullRequestUrls", () => {
  it("returns empty array for null", () => {
    expect(normalizePullRequestUrls(null)).toEqual([]);
  });

  it("returns empty array for undefined", () => {
    expect(normalizePullRequestUrls(undefined)).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    expect(normalizePullRequestUrls("")).toEqual([]);
  });

  it("returns empty array for number", () => {
    expect(normalizePullRequestUrls(42)).toEqual([]);
  });

  it("handles JS array of strings", () => {
    const result = normalizePullRequestUrls(["https://github.com/pr/1", "https://github.com/pr/2"]);
    expect(result).toEqual(["https://github.com/pr/1", "https://github.com/pr/2"]);
  });

  it("filters non-string entries from JS array", () => {
    const result = normalizePullRequestUrls(["https://github.com/pr/1", 42, null, "https://github.com/pr/2"]);
    expect(result).toEqual(["https://github.com/pr/1", "https://github.com/pr/2"]);
  });

  it("filters empty strings from JS array", () => {
    const result = normalizePullRequestUrls(["https://github.com/pr/1", "", "   "]);
    expect(result).toEqual(["https://github.com/pr/1"]);
  });

  it("trims whitespace from array entries", () => {
    const result = normalizePullRequestUrls(["  https://github.com/pr/1  "]);
    expect(result).toEqual(["https://github.com/pr/1"]);
  });

  it("handles JSON string array", () => {
    const result = normalizePullRequestUrls('["https://github.com/pr/1","https://github.com/pr/2"]');
    expect(result).toEqual(["https://github.com/pr/1", "https://github.com/pr/2"]);
  });

  it("returns empty for non-array JSON string", () => {
    const result = normalizePullRequestUrls('"https://github.com/pr/1"');
    expect(result).toEqual([]);
  });

  it("handles Postgres text array without quotes", () => {
    const result = normalizePullRequestUrls("{https://github.com/pr/1,https://github.com/pr/2}");
    expect(result).toEqual(["https://github.com/pr/1", "https://github.com/pr/2"]);
  });

  it("handles Postgres text array with double quotes", () => {
    const result = normalizePullRequestUrls('{"https://github.com/pr/1","https://github.com/pr/2"}');
    expect(result).toEqual(["https://github.com/pr/1", "https://github.com/pr/2"]);
  });

  it("returns empty array for invalid JSON non-Postgres-array string", () => {
    const result = normalizePullRequestUrls("not-json-not-postgres");
    expect(result).toEqual([]);
  });

  it("returns empty array for empty JS array", () => {
    expect(normalizePullRequestUrls([])).toEqual([]);
  });
});

describe("validateDecisionAgainstPolicy", () => {
  const base = {
    decisionId: "dec-001",
    adrRef: null,
    status: "approved",
    pullRequestUrlsRaw: null,
    blocking: true,
    requireLinkedPR: false,
    requireApproved: false,
  };

  it("returns valid=true with observation=false in blocking mode", () => {
    const result = validateDecisionAgainstPolicy({ ...base, blocking: true });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.observation).toBe(false);
      expect(result.status).toBe("approved");
    }
  });

  it("returns valid=true with observation=true in non-blocking mode", () => {
    const result = validateDecisionAgainstPolicy({ ...base, blocking: false, status: "proposed" });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.observation).toBe(true);
      expect(result.status).toBe("proposed");
    }
  });

  it("blocking=true normalizes status to 'approved' in output", () => {
    const result = validateDecisionAgainstPolicy({ ...base, blocking: true, status: "proposed", requireApproved: false });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.status).toBe("approved");
    }
  });

  it("blocking=false returns original status in output", () => {
    const result = validateDecisionAgainstPolicy({ ...base, blocking: false, status: "proposed" });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.status).toBe("proposed");
    }
  });

  it("requireLinkedPR=true with no PRs => linked_pr_required", () => {
    const result = validateDecisionAgainstPolicy({
      ...base,
      requireLinkedPR: true,
      pullRequestUrlsRaw: [],
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe("linked_pr_required");
    }
  });

  it("requireLinkedPR=true with null PRs => linked_pr_required", () => {
    const result = validateDecisionAgainstPolicy({
      ...base,
      requireLinkedPR: true,
      pullRequestUrlsRaw: null,
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe("linked_pr_required");
    }
  });

  it("requireLinkedPR=true with a valid PR => passes", () => {
    const result = validateDecisionAgainstPolicy({
      ...base,
      requireLinkedPR: true,
      pullRequestUrlsRaw: ["https://github.com/org/repo/pull/1"],
    });
    expect(result.valid).toBe(true);
  });

  it("requireLinkedPR=false with no PRs => passes", () => {
    const result = validateDecisionAgainstPolicy({
      ...base,
      requireLinkedPR: false,
      pullRequestUrlsRaw: [],
    });
    expect(result.valid).toBe(true);
  });

  it("requireApproved=true with status=proposed => not_approved", () => {
    const result = validateDecisionAgainstPolicy({
      ...base,
      requireApproved: true,
      status: "proposed",
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe("not_approved");
      expect(result.status).toBe("proposed");
    }
  });

  it("requireApproved=true with status=rejected => not_approved", () => {
    const result = validateDecisionAgainstPolicy({
      ...base,
      requireApproved: true,
      status: "rejected",
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe("not_approved");
      expect(result.status).toBe("rejected");
    }
  });

  it("requireApproved=true with status=superseded => not_approved", () => {
    const result = validateDecisionAgainstPolicy({
      ...base,
      requireApproved: true,
      status: "superseded",
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe("not_approved");
      expect(result.status).toBe("superseded");
    }
  });

  it("requireApproved=true with status=approved => passes", () => {
    const result = validateDecisionAgainstPolicy({
      ...base,
      requireApproved: true,
      status: "approved",
    });
    expect(result.valid).toBe(true);
  });

  it("requireApproved=false with status=proposed => passes", () => {
    const result = validateDecisionAgainstPolicy({
      ...base,
      requireApproved: false,
      status: "proposed",
    });
    expect(result.valid).toBe(true);
  });

  it("requireLinkedPR checked before requireApproved", () => {
    // Both would fail; linkedPR is checked first
    const result = validateDecisionAgainstPolicy({
      ...base,
      requireLinkedPR: true,
      requireApproved: true,
      pullRequestUrlsRaw: [],
      status: "proposed",
    });
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.reason).toBe("linked_pr_required");
    }
  });

  it("returns decisionId and adrRef in valid result", () => {
    const result = validateDecisionAgainstPolicy({ ...base, adrRef: "ADR-001" });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.decisionId).toBe("dec-001");
      expect(result.adrRef).toBe("ADR-001");
    }
  });

  it("all policies pass: requireLinkedPR=true + requireApproved=true + approved + PR", () => {
    const result = validateDecisionAgainstPolicy({
      ...base,
      requireLinkedPR: true,
      requireApproved: true,
      pullRequestUrlsRaw: ["https://github.com/org/repo/pull/42"],
      status: "approved",
      blocking: true,
    });
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.observation).toBe(false);
    }
  });

  it("handles Postgres text array for pullRequestUrlsRaw", () => {
    const result = validateDecisionAgainstPolicy({
      ...base,
      requireLinkedPR: true,
      pullRequestUrlsRaw: "{https://github.com/org/repo/pull/1}",
    });
    expect(result.valid).toBe(true);
  });

  it("handles JSON string array for pullRequestUrlsRaw", () => {
    const result = validateDecisionAgainstPolicy({
      ...base,
      requireLinkedPR: true,
      pullRequestUrlsRaw: '["https://github.com/org/repo/pull/1"]',
    });
    expect(result.valid).toBe(true);
  });
});
