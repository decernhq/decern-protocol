import { describe, it, expect } from "vitest";
import { canonicalize } from "./canonical.js";

describe("canonicalize (RFC 8785)", () => {
  it("serializes null", () => {
    expect(canonicalize(null)).toBe("null");
  });

  it("serializes booleans", () => {
    expect(canonicalize(true)).toBe("true");
    expect(canonicalize(false)).toBe("false");
  });

  it("serializes integers", () => {
    expect(canonicalize(42)).toBe("42");
    expect(canonicalize(0)).toBe("0");
    expect(canonicalize(-1)).toBe("-1");
  });

  it("serializes floats without trailing zeros", () => {
    expect(canonicalize(1.5)).toBe("1.5");
    expect(canonicalize(1.0)).toBe("1"); // 1.0 === 1 in JS
  });

  it("throws on non-finite numbers", () => {
    expect(() => canonicalize(NaN)).toThrow("non-finite");
    expect(() => canonicalize(Infinity)).toThrow("non-finite");
  });

  it("serializes strings with escaping", () => {
    expect(canonicalize("hello")).toBe('"hello"');
    expect(canonicalize('say "hi"')).toBe('"say \\"hi\\""');
    expect(canonicalize("line\nnew")).toBe('"line\\nnew"');
  });

  it("serializes arrays in order", () => {
    expect(canonicalize([3, 1, 2])).toBe("[3,1,2]");
    expect(canonicalize([])).toBe("[]");
  });

  it("sorts object keys lexicographically", () => {
    expect(canonicalize({ b: 2, a: 1 })).toBe('{"a":1,"b":2}');
    expect(canonicalize({ z: null, a: true })).toBe('{"a":true,"z":null}');
  });

  it("handles nested objects with sorted keys", () => {
    const input = { outer: { beta: 2, alpha: 1 }, first: "yes" };
    expect(canonicalize(input)).toBe('{"first":"yes","outer":{"alpha":1,"beta":2}}');
  });

  it("omits undefined values in objects", () => {
    expect(canonicalize({ a: 1, b: undefined, c: 3 })).toBe('{"a":1,"c":3}');
  });

  it("handles empty objects", () => {
    expect(canonicalize({})).toBe("{}");
  });

  it("is deterministic across multiple calls", () => {
    const obj = { z: [3, 2, 1], a: { y: "hello", x: 42 } };
    const result1 = canonicalize(obj);
    const result2 = canonicalize(obj);
    expect(result1).toBe(result2);
  });

  // RFC 8785 §3.2.3: keys with special characters
  it("handles keys with special characters", () => {
    expect(canonicalize({ "\n": 1, "": 2 })).toBe('{"":2,"\\n":1}');
  });
});
