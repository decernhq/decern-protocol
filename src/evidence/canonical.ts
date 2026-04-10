/**
 * JSON Canonicalization Scheme per RFC 8785.
 *
 * Produces a deterministic JSON string from any JSON-compatible value:
 * - Object keys sorted lexicographically (by UTF-16 code units, per the RFC)
 * - No whitespace
 * - Numbers serialized per ECMAScript (which matches RFC 8785 for finite numbers)
 * - Strings escaped per JSON spec
 * - null, boolean as-is
 *
 * Reference: https://datatracker.ietf.org/doc/html/rfc8785
 */

export function canonicalize(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") {
    // RFC 8785 §3.2.2.3: use ECMAScript number serialization.
    // JSON.stringify handles this correctly for finite numbers.
    if (!Number.isFinite(value)) {
      throw new Error("RFC 8785: cannot canonicalize non-finite numbers (NaN, Infinity)");
    }
    return JSON.stringify(value);
  }
  if (typeof value === "string") {
    // JSON.stringify handles proper escaping per RFC 8785 §3.2.2.2
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    const items = value.map((item) => canonicalize(item));
    return "[" + items.join(",") + "]";
  }
  if (typeof value === "object") {
    // RFC 8785 §3.2.3: sort keys by UTF-16 code unit comparison
    // JavaScript's default string comparison is by UTF-16 code units, which matches.
    const keys = Object.keys(value as Record<string, unknown>).sort();
    const pairs = keys.map((key) => {
      const v = (value as Record<string, unknown>)[key];
      // RFC 8785: keys with undefined values are omitted (same as JSON.stringify)
      if (v === undefined) return null;
      return JSON.stringify(key) + ":" + canonicalize(v);
    }).filter((p): p is string => p !== null);
    return "{" + pairs.join(",") + "}";
  }
  throw new Error(`RFC 8785: unsupported type: ${typeof value}`);
}
