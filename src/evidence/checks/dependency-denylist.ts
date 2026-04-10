import type { DeterministicCheck, DiffInput, CheckConfig, CheckResult } from "./types.js";
import { hashDetails, makeCheckId } from "./types.js";

/**
 * dependency_denylist: blocks if the diff introduces a denied package/dependency.
 * Config params: { packages: string[] } — package names to deny.
 * Scans the raw diff for added lines containing the package name.
 */
export class DependencyDenylistCheck implements DeterministicCheck {
  readonly type = "dependency_denylist" as const;

  check(diff: DiffInput, config: CheckConfig): CheckResult {
    const packages = Array.isArray(config.params.packages) ? config.params.packages as string[] : [];
    const addedLines = diff.rawDiff
      .split("\n")
      .filter((line) => line.startsWith("+") && !line.startsWith("+++"));
    const found: string[] = [];
    for (const pkg of packages) {
      if (addedLines.some((line) => line.includes(pkg))) {
        found.push(pkg);
      }
    }
    const pass = found.length === 0;
    const details = pass
      ? "No denied dependencies introduced."
      : `Denied dependencies found in added lines: ${found.join(", ")}`;
    return {
      check_id: makeCheckId(this.type, 0),
      check_type: this.type,
      result: pass ? "pass" : "fail",
      details,
      details_hash: hashDetails(details),
    };
  }
}
