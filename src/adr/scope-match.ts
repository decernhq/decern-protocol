/**
 * ADR scope matching: checks if any changed file matches the ADR's scope patterns.
 *
 * Scope patterns use minimatch-style globs:
 * - `*` matches anything except `/`
 * - `**` matches anything including `/`
 * - `?` matches single char except `/`
 *
 * If the ADR has no scope (empty array), it matches everything.
 */

/**
 * Check if any file in `changedFiles` matches any pattern in `scope`.
 * If scope is empty, returns true (ADR applies to everything).
 */
export function scopeMatchesFiles(scope: string[], changedFiles: string[]): boolean {
  if (scope.length === 0) return true;
  return changedFiles.some((file) => scope.some((pattern) => globMatch(pattern, file)));
}

/**
 * Minimal glob matcher. Supports `*`, `**`, `?`.
 * Patterns are matched against the full file path (no leading /).
 */
export function globMatch(pattern: string, filePath: string): boolean {
  // Normalize
  const p = pattern.replace(/\\/g, "/").replace(/\/+$/, "");
  const f = filePath.replace(/\\/g, "/");

  // Convert glob to regex
  let regex = "^";
  let i = 0;
  while (i < p.length) {
    if (p[i] === "*" && p[i + 1] === "*") {
      // ** matches anything including /
      if (p[i + 2] === "/") {
        regex += "(?:.*/)?";
        i += 3;
      } else {
        regex += ".*";
        i += 2;
      }
    } else if (p[i] === "*") {
      regex += "[^/]*";
      i++;
    } else if (p[i] === "?") {
      regex += "[^/]";
      i++;
    } else if (".+^${}()|[]\\".includes(p[i])) {
      regex += "\\" + p[i];
      i++;
    } else {
      regex += p[i];
      i++;
    }
  }
  // If pattern ends with /**, match everything under that dir
  if (!regex.endsWith(".*")) {
    regex += "$";
  }

  try {
    return new RegExp(regex).test(f);
  } catch {
    return false;
  }
}
