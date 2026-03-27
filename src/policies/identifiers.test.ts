import { describe, it, expect } from "vitest";
import {
  validateDecisionId,
  validateAdrRef,
  resolveDecisionLookup,
  resolveExclusiveDecisionLookup,
  DECISION_ID_MAX_LENGTH,
} from "./identifiers";

describe("validateDecisionId", () => {
  it("accepts a valid UUID", () => {
    const result = validateDecisionId("550e8400-e29b-41d4-a716-446655440000");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.id).toBe("550e8400-e29b-41d4-a716-446655440000");
  });

  it("accepts alphanumeric with hyphens", () => {
    const result = validateDecisionId("my-decision-001");
    expect(result.ok).toBe(true);
  });

  it("accepts alphanumeric with underscores", () => {
    const result = validateDecisionId("my_decision_001");
    expect(result.ok).toBe(true);
  });

  it("accepts mixed case", () => {
    const result = validateDecisionId("MyDecisionABC");
    expect(result.ok).toBe(true);
  });

  it("rejects null", () => {
    expect(validateDecisionId(null).ok).toBe(false);
  });

  it("rejects undefined", () => {
    expect(validateDecisionId(undefined).ok).toBe(false);
  });

  it("rejects empty string", () => {
    expect(validateDecisionId("").ok).toBe(false);
  });

  it("rejects whitespace-only string", () => {
    expect(validateDecisionId("   ").ok).toBe(false);
  });

  it("rejects string with path traversal slash", () => {
    expect(validateDecisionId("../../../etc/passwd").ok).toBe(false);
  });

  it("rejects string with spaces", () => {
    expect(validateDecisionId("my decision").ok).toBe(false);
  });

  it("rejects string with @", () => {
    expect(validateDecisionId("user@domain").ok).toBe(false);
  });

  it("rejects string longer than max length", () => {
    const long = "a".repeat(DECISION_ID_MAX_LENGTH + 1);
    expect(validateDecisionId(long).ok).toBe(false);
  });

  it("accepts string of exactly max length", () => {
    const exact = "a".repeat(DECISION_ID_MAX_LENGTH);
    expect(validateDecisionId(exact).ok).toBe(true);
  });

  it("trims whitespace before validating", () => {
    const result = validateDecisionId("  my-id  ");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.id).toBe("my-id");
  });
});

describe("validateAdrRef", () => {
  it("accepts ADR-001", () => {
    const result = validateAdrRef("ADR-001");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.id).toBe("ADR-001");
  });

  it("accepts ADR-1 (single digit)", () => {
    expect(validateAdrRef("ADR-1").ok).toBe(true);
  });

  it("accepts ADR-123", () => {
    expect(validateAdrRef("ADR-123").ok).toBe(true);
  });

  it("accepts lowercase adr-001 (case-insensitive)", () => {
    expect(validateAdrRef("adr-001").ok).toBe(true);
  });

  it("accepts mixed case Adr-042", () => {
    expect(validateAdrRef("Adr-042").ok).toBe(true);
  });

  it("rejects ADR- with no digits", () => {
    expect(validateAdrRef("ADR-").ok).toBe(false);
  });

  it("rejects ADR-abc (non-numeric suffix)", () => {
    expect(validateAdrRef("ADR-abc").ok).toBe(false);
  });

  it("rejects ADR-001-extra (extra suffix)", () => {
    expect(validateAdrRef("ADR-001-extra").ok).toBe(false);
  });

  it("rejects empty string", () => {
    expect(validateAdrRef("").ok).toBe(false);
  });

  it("rejects null", () => {
    expect(validateAdrRef(null).ok).toBe(false);
  });

  it("rejects undefined", () => {
    expect(validateAdrRef(undefined).ok).toBe(false);
  });

  it("rejects plain number string", () => {
    expect(validateAdrRef("001").ok).toBe(false);
  });

  it("rejects decision ID format", () => {
    expect(validateAdrRef("550e8400-e29b-41d4-a716-446655440000").ok).toBe(false);
  });
});

describe("resolveDecisionLookup", () => {
  it("returns by=adrRef when valid adrRef provided", () => {
    const result = resolveDecisionLookup("ADR-001", null);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.by).toBe("adrRef");
      expect(result.id).toBe("ADR-001");
    }
  });

  it("returns by=decisionId when valid decisionId and no adrRef", () => {
    const result = resolveDecisionLookup(null, "my-decision-id");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.by).toBe("decisionId");
      expect(result.id).toBe("my-decision-id");
    }
  });

  it("adrRef takes priority over decisionId when both provided", () => {
    const result = resolveDecisionLookup("ADR-042", "my-decision-id");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.by).toBe("adrRef");
    }
  });

  it("falls back to decisionId when adrRef is invalid", () => {
    const result = resolveDecisionLookup("ADR-abc", "my-decision-id");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.by).toBe("decisionId");
    }
  });

  it("returns ok=false when both are invalid", () => {
    expect(resolveDecisionLookup("invalid!", "../bad").ok).toBe(false);
  });

  it("returns ok=false when both are null", () => {
    expect(resolveDecisionLookup(null, null).ok).toBe(false);
  });
});

describe("resolveExclusiveDecisionLookup", () => {
  it("returns ok=true when only adrRef provided", () => {
    const result = resolveExclusiveDecisionLookup("ADR-001", null);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.by).toBe("adrRef");
  });

  it("returns ok=true when only decisionId provided", () => {
    const result = resolveExclusiveDecisionLookup(null, "my-decision-id");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.by).toBe("decisionId");
  });

  it("returns ok=false when both are provided", () => {
    expect(resolveExclusiveDecisionLookup("ADR-001", "my-decision-id").ok).toBe(false);
  });

  it("returns ok=false when neither is provided", () => {
    expect(resolveExclusiveDecisionLookup(null, null).ok).toBe(false);
  });

  it("returns ok=false when both are empty strings", () => {
    expect(resolveExclusiveDecisionLookup("", "").ok).toBe(false);
  });

  it("returns ok=false when adrRef present but invalid format, decisionId absent", () => {
    // hasAdrRef=true, hasDecisionId=false → calls resolveDecisionLookup("ADR-abc", null)
    // validateAdrRef("ADR-abc") fails, validateDecisionId(null) fails → ok=false
    expect(resolveExclusiveDecisionLookup("ADR-abc", null).ok).toBe(false);
  });

  it("treats whitespace-only as absent", () => {
    // "   ".trim() = "" → hasAdrRef=false, hasDecisionId=false → both absent → ok=false
    expect(resolveExclusiveDecisionLookup("   ", "   ").ok).toBe(false);
  });
});
