import type { DeterministicCheck, DiffInput, CheckConfig, CheckResult } from "./types.js";
import { hashDetails, makeCheckId } from "./types.js";

/**
 * path_denylist: blocks if any changed file matches a denied path pattern.
 * Config params: { paths: string[] } — glob-like path prefixes or exact matches.
 */
export class PathDenylistCheck implements DeterministicCheck {
  readonly type = "path_denylist" as const;

  check(diff: DiffInput, config: CheckConfig): CheckResult {
    const paths = Array.isArray(config.params.paths) ? config.params.paths as string[] : [];
    const matched = diff.files.filter((f) =>
      paths.some((p) => f === p || f.startsWith(p.endsWith("/") ? p : p + "/"))
    );
    const pass = matched.length === 0;
    const details = pass
      ? "No denied paths matched."
      : `Denied paths matched: ${matched.join(", ")}`;
    return {
      check_id: makeCheckId(this.type, 0),
      check_type: this.type,
      result: pass ? "pass" : "fail",
      details,
      details_hash: hashDetails(details),
    };
  }
}
