import { describe, it, expect } from "vitest";
import { runDeterministicChecks } from "./index.js";
import type { DiffInput, CheckConfig } from "./types.js";

const baseDiff: DiffInput = {
  files: ["src/main.ts", "package.json", "terraform/main.tf"],
  rawDiff: [
    "+import express from 'express';",
    "+import lodash from 'lodash';",
    "+const SECRET = 'hardcoded';",
    " unchanged line",
    "-old line",
  ].join("\n"),
  sizeBytes: 2048,
};

describe("path_denylist", () => {
  it("passes when no files match", () => {
    const configs: CheckConfig[] = [{ type: "path_denylist", params: { paths: ["migrations/"] } }];
    const results = runDeterministicChecks(baseDiff, configs);
    expect(results[0].result).toBe("pass");
  });

  it("fails when a file matches", () => {
    const configs: CheckConfig[] = [{ type: "path_denylist", params: { paths: ["terraform/"] } }];
    const results = runDeterministicChecks(baseDiff, configs);
    expect(results[0].result).toBe("fail");
    expect(results[0].details).toContain("terraform/main.tf");
  });
});

describe("dependency_denylist", () => {
  it("passes when no denied packages found", () => {
    const configs: CheckConfig[] = [{ type: "dependency_denylist", params: { packages: ["moment"] } }];
    const results = runDeterministicChecks(baseDiff, configs);
    expect(results[0].result).toBe("pass");
  });

  it("fails when denied package found in added lines", () => {
    const configs: CheckConfig[] = [{ type: "dependency_denylist", params: { packages: ["lodash"] } }];
    const results = runDeterministicChecks(baseDiff, configs);
    expect(results[0].result).toBe("fail");
    expect(results[0].details).toContain("lodash");
  });
});

describe("regex_required", () => {
  it("passes when required pattern is found", () => {
    const configs: CheckConfig[] = [{ type: "regex_required", params: { pattern: "import express" } }];
    const results = runDeterministicChecks(baseDiff, configs);
    expect(results[0].result).toBe("pass");
  });

  it("fails when required pattern is NOT found", () => {
    const configs: CheckConfig[] = [{ type: "regex_required", params: { pattern: "import fastify" } }];
    const results = runDeterministicChecks(baseDiff, configs);
    expect(results[0].result).toBe("fail");
  });
});

describe("regex_forbidden", () => {
  it("passes when forbidden pattern is NOT found", () => {
    const configs: CheckConfig[] = [{ type: "regex_forbidden", params: { pattern: "eval\\(" } }];
    const results = runDeterministicChecks(baseDiff, configs);
    expect(results[0].result).toBe("pass");
  });

  it("fails when forbidden pattern IS found", () => {
    const configs: CheckConfig[] = [{ type: "regex_forbidden", params: { pattern: "hardcoded" } }];
    const results = runDeterministicChecks(baseDiff, configs);
    expect(results[0].result).toBe("fail");
  });
});

describe("file_type_denylist", () => {
  it("passes when no denied file types found", () => {
    const configs: CheckConfig[] = [{ type: "file_type_denylist", params: { extensions: [".exe", ".dll"] } }];
    const results = runDeterministicChecks(baseDiff, configs);
    expect(results[0].result).toBe("pass");
  });

  it("fails when denied file type found", () => {
    const configs: CheckConfig[] = [{ type: "file_type_denylist", params: { extensions: [".tf"] } }];
    const results = runDeterministicChecks(baseDiff, configs);
    expect(results[0].result).toBe("fail");
    expect(results[0].details).toContain("terraform/main.tf");
  });
});

describe("size_threshold", () => {
  it("passes when diff is within threshold", () => {
    const configs: CheckConfig[] = [{ type: "size_threshold", params: { maxBytes: 4096 } }];
    const results = runDeterministicChecks(baseDiff, configs);
    expect(results[0].result).toBe("pass");
  });

  it("fails when diff exceeds threshold", () => {
    const configs: CheckConfig[] = [{ type: "size_threshold", params: { maxBytes: 1024 } }];
    const results = runDeterministicChecks(baseDiff, configs);
    expect(results[0].result).toBe("fail");
  });
});

describe("runDeterministicChecks", () => {
  it("runs multiple checks and returns all results", () => {
    const configs: CheckConfig[] = [
      { type: "path_denylist", params: { paths: ["terraform/"] } },
      { type: "dependency_denylist", params: { packages: ["moment"] } },
      { type: "size_threshold", params: { maxBytes: 4096 } },
    ];
    const results = runDeterministicChecks(baseDiff, configs);
    expect(results).toHaveLength(3);
    expect(results[0].result).toBe("fail");  // terraform/ matched
    expect(results[1].result).toBe("pass");  // moment not found
    expect(results[2].result).toBe("pass");  // within size
  });

  it("each result has a details_hash", () => {
    const configs: CheckConfig[] = [{ type: "size_threshold", params: { maxBytes: 4096 } }];
    const results = runDeterministicChecks(baseDiff, configs);
    expect(results[0].details_hash).toMatch(/^[a-f0-9]{64}$/);
  });
});
