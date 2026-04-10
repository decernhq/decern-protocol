import { describe, it, expect } from "vitest";
import { parseAdrMarkdown } from "./parser.js";

const VALID_ADR = `---
id: ADR-001
title: Use Zod for API input validation
status: approved
enforcement: blocking
scope:
  - src/api/**
  - src/middleware/**
supersedes: null
date: 2026-04-10
---

## Context
We need consistent input validation across all API endpoints.

## Decision
Use Zod for all API input validation.

## Consequences
All endpoints must define a Zod schema for request bodies.
`;

describe("parseAdrMarkdown", () => {
  it("parses a valid ADR with all fields", () => {
    const adr = parseAdrMarkdown(VALID_ADR);
    expect(adr).not.toBeNull();
    expect(adr!.id).toBe("ADR-001");
    expect(adr!.title).toBe("Use Zod for API input validation");
    expect(adr!.status).toBe("approved");
    expect(adr!.enforcement).toBe("blocking");
    expect(adr!.scope).toEqual(["src/api/**", "src/middleware/**"]);
    expect(adr!.supersedes).toBeNull();
    expect(adr!.date).toBe("2026-04-10");
    expect(adr!.context).toContain("consistent input validation");
    expect(adr!.decision).toContain("Use Zod");
    expect(adr!.consequences).toContain("Zod schema");
  });

  it("returns null for non-frontmatter content", () => {
    expect(parseAdrMarkdown("# Just a header\nSome text")).toBeNull();
  });

  it("returns null for missing id", () => {
    expect(parseAdrMarkdown("---\ntitle: Test\nstatus: approved\n---\n## Decision\ntest")).toBeNull();
  });

  it("returns null for missing title", () => {
    expect(parseAdrMarkdown("---\nid: ADR-001\nstatus: approved\n---\n## Decision\ntest")).toBeNull();
  });

  it("defaults status to proposed", () => {
    const adr = parseAdrMarkdown("---\nid: ADR-001\ntitle: Test\n---\n## Decision\ntest");
    expect(adr!.status).toBe("proposed");
  });

  it("defaults enforcement to warning", () => {
    const adr = parseAdrMarkdown("---\nid: ADR-001\ntitle: Test\nstatus: approved\n---\n## Decision\ntest");
    expect(adr!.enforcement).toBe("warning");
  });

  it("handles empty scope", () => {
    const adr = parseAdrMarkdown("---\nid: ADR-001\ntitle: Test\nstatus: approved\nscope:\n---\n## Decision\ntest");
    expect(adr!.scope).toEqual([]);
  });

  it("handles inline array scope", () => {
    const adr = parseAdrMarkdown("---\nid: ADR-001\ntitle: Test\nscope: [src/**, lib/**]\n---\n## Decision\ntest");
    expect(adr!.scope).toEqual(["src/**", "lib/**"]);
  });

  it("preserves rawContent", () => {
    const adr = parseAdrMarkdown(VALID_ADR);
    expect(adr!.rawContent).toBe(VALID_ADR);
  });

  it("parses supersedes field", () => {
    const adr = parseAdrMarkdown("---\nid: ADR-002\ntitle: Use gRPC\nstatus: approved\nsupersedes: ADR-001\n---\n## Decision\nMigrate to gRPC");
    expect(adr!.supersedes).toBe("ADR-001");
  });
});
