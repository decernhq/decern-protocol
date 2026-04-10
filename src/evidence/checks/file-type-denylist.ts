import type { DeterministicCheck, DiffInput, CheckConfig, CheckResult } from "./types.js";
import { hashDetails, makeCheckId } from "./types.js";

/**
 * file_type_denylist: blocks if any changed file has a denied extension.
 * Config params: { extensions: string[] } — e.g. [".exe", ".dll", ".so"]
 */
export class FileTypeDenylistCheck implements DeterministicCheck {
  readonly type = "file_type_denylist" as const;

  check(diff: DiffInput, config: CheckConfig): CheckResult {
    const extensions = Array.isArray(config.params.extensions)
      ? (config.params.extensions as string[]).map((e) => e.toLowerCase())
      : [];
    const matched = diff.files.filter((f) => {
      const dot = f.lastIndexOf(".");
      if (dot === -1) return false;
      return extensions.includes(f.substring(dot).toLowerCase());
    });
    const pass = matched.length === 0;
    const details = pass
      ? "No denied file types found."
      : `Denied file types matched: ${matched.join(", ")}`;
    return {
      check_id: makeCheckId(this.type, 0),
      check_type: this.type,
      result: pass ? "pass" : "fail",
      details,
      details_hash: hashDetails(details),
    };
  }
}
