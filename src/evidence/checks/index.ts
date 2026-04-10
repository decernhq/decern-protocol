export * from "./types.js";
export { PathDenylistCheck } from "./path-denylist.js";
export { DependencyDenylistCheck } from "./dependency-denylist.js";
export { RegexRequiredCheck, RegexForbiddenCheck } from "./regex-checks.js";
export { FileTypeDenylistCheck } from "./file-type-denylist.js";
export { SizeThresholdCheck } from "./size-threshold.js";

import type { DeterministicCheck, DiffInput, CheckConfig, CheckResult } from "./types.js";
import { PathDenylistCheck } from "./path-denylist.js";
import { DependencyDenylistCheck } from "./dependency-denylist.js";
import { RegexRequiredCheck, RegexForbiddenCheck } from "./regex-checks.js";
import { FileTypeDenylistCheck } from "./file-type-denylist.js";
import { SizeThresholdCheck } from "./size-threshold.js";
import type { CheckType } from "../record.js";

const CHECK_REGISTRY: Record<CheckType, DeterministicCheck> = {
  path_denylist: new PathDenylistCheck(),
  dependency_denylist: new DependencyDenylistCheck(),
  regex_required: new RegexRequiredCheck(),
  regex_forbidden: new RegexForbiddenCheck(),
  file_type_denylist: new FileTypeDenylistCheck(),
  size_threshold: new SizeThresholdCheck(),
};

/**
 * Run all configured deterministic checks against a diff.
 * @param diff - The diff to check.
 * @param configs - Array of check configurations from the decision record.
 * @returns Array of check results.
 */
export function runDeterministicChecks(diff: DiffInput, configs: CheckConfig[]): CheckResult[] {
  return configs.map((config) => {
    const check = CHECK_REGISTRY[config.type];
    if (!check) {
      return {
        check_id: `unknown_${config.type}`,
        check_type: config.type,
        result: "fail" as const,
        details: `Unknown check type: ${config.type}`,
        details_hash: "",
      };
    }
    return check.check(diff, config);
  });
}
