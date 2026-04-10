import { describe, it, expect } from "vitest";
import { formatAdrMarkdown, adrFilename } from "./formatter.js";
import { parseAdrMarkdown } from "./parser.js";

describe("formatAdrMarkdown", () => {
  it("produces valid frontmatter + body", () => {
    const md = formatAdrMarkdown({
      id: "ADR-001",
      title: "Use Zod",
      status: "approved",
      enforcement: "blocking",
      scope: ["src/api/**"],
      supersedes: null,
      date: "2026-04-10",
      context: "Need validation",
      decision: "Use Zod",
      consequences: "All endpoints need schemas",
    });
    expect(md).toContain("---");
    expect(md).toContain("id: ADR-001");
    expect(md).toContain("enforcement: blocking");
    expect(md).toContain("## Context");
    expect(md).toContain("## Decision");
  });

  it("round-trips through parser", () => {
    const original = {
      id: "ADR-005",
      title: "Service layer pattern",
      status: "approved" as const,
      enforcement: "warning" as const,
      scope: ["src/services/**", "src/controllers/**"],
      supersedes: "ADR-002",
      date: "2026-03-15",
      context: "Controllers should not access DB directly",
      decision: "All DB access goes through service layer",
      consequences: "More files, cleaner separation",
    };
    const md = formatAdrMarkdown(original);
    const parsed = parseAdrMarkdown(md);
    expect(parsed).not.toBeNull();
    expect(parsed!.id).toBe(original.id);
    expect(parsed!.title).toBe(original.title);
    expect(parsed!.status).toBe(original.status);
    expect(parsed!.enforcement).toBe(original.enforcement);
    expect(parsed!.scope).toEqual(original.scope);
    expect(parsed!.supersedes).toBe(original.supersedes);
    expect(parsed!.decision).toContain("service layer");
  });
});

describe("adrFilename", () => {
  it("creates slug from title", () => {
    expect(adrFilename("ADR-001", "Use Zod for validation")).toBe("adr-001-use-zod-for-validation.md");
  });

  it("handles special characters", () => {
    expect(adrFilename("ADR-002", "Don't use ORM!")).toBe("adr-002-don-t-use-orm.md");
  });
});
