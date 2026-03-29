import { describe, it, expect } from "vitest";
import { parseAdrMarkdown, type ParsedAdr } from "./parser";

describe("parseAdrMarkdown", () => {
  const fullAdr = `# Use PostgreSQL for primary database

**Status:** Accepted

**Author:** John Doe

**Date:** 2025-01-15

**Tags:** database, infrastructure

## Context

We need a reliable database for our application.

## Options Considered

- PostgreSQL
- MySQL
- MongoDB

## Decision

We chose PostgreSQL for its reliability and JSON support.

## Consequences

Better reliability but more complex setup.

## Pull Requests

- https://github.com/org/repo/pull/1
- https://github.com/org/repo/pull/2

## External Links

- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- https://wiki.internal/db-decision

## Supersedes

ADR-001`;

  it("parses title from h1", () => {
    const result = parseAdrMarkdown(fullAdr);
    expect(result.title).toBe("Use PostgreSQL for primary database");
  });

  it("parses status (lowercased)", () => {
    const result = parseAdrMarkdown(fullAdr);
    expect(result.status).toBe("accepted");
  });

  it("parses author", () => {
    const result = parseAdrMarkdown(fullAdr);
    expect(result.author).toBe("John Doe");
  });

  it("parses date", () => {
    const result = parseAdrMarkdown(fullAdr);
    expect(result.date).toBe("2025-01-15");
  });

  it("parses tags as lowercase array", () => {
    const result = parseAdrMarkdown(fullAdr);
    expect(result.tags).toEqual(["database", "infrastructure"]);
  });

  it("parses context section", () => {
    const result = parseAdrMarkdown(fullAdr);
    expect(result.context).toBe("We need a reliable database for our application.");
  });

  it("parses options considered", () => {
    const result = parseAdrMarkdown(fullAdr);
    expect(result.options).toEqual(["PostgreSQL", "MySQL", "MongoDB"]);
  });

  it("parses decision section", () => {
    const result = parseAdrMarkdown(fullAdr);
    expect(result.decision).toBe("We chose PostgreSQL for its reliability and JSON support.");
  });

  it("parses consequences section", () => {
    const result = parseAdrMarkdown(fullAdr);
    expect(result.consequences).toBe("Better reliability but more complex setup.");
  });

  it("parses pull request URLs", () => {
    const result = parseAdrMarkdown(fullAdr);
    expect(result.pullRequestUrls).toEqual([
      "https://github.com/org/repo/pull/1",
      "https://github.com/org/repo/pull/2",
    ]);
  });

  it("parses external links with labels", () => {
    const result = parseAdrMarkdown(fullAdr);
    expect(result.externalLinks[0]).toEqual({
      url: "https://www.postgresql.org/docs/",
      label: "PostgreSQL Docs",
    });
  });

  it("parses external links without labels", () => {
    const result = parseAdrMarkdown(fullAdr);
    expect(result.externalLinks[1]).toEqual({
      url: "https://wiki.internal/db-decision",
    });
  });

  it("parses supersedes ref", () => {
    const result = parseAdrMarkdown(fullAdr);
    expect(result.supersedes).toBe("ADR-001");
  });

  /* ── Edge cases ─────────────────────────────────────────────────── */

  it("defaults status to proposed when missing", () => {
    const md = `# My Decision\n\n## Context\n\nSome context.`;
    const result = parseAdrMarkdown(md);
    expect(result.status).toBe("proposed");
  });

  it("returns null for missing author", () => {
    const md = `# My Decision\n\n**Status:** Draft`;
    const result = parseAdrMarkdown(md);
    expect(result.author).toBeNull();
  });

  it("returns null for missing date", () => {
    const md = `# My Decision\n\n**Status:** Draft`;
    const result = parseAdrMarkdown(md);
    expect(result.date).toBeNull();
  });

  it("returns empty arrays for missing optional sections", () => {
    const md = `# My Decision\n\n**Status:** Draft\n\n## Context\n\nJust context.`;
    const result = parseAdrMarkdown(md);
    expect(result.options).toEqual([]);
    expect(result.pullRequestUrls).toEqual([]);
    expect(result.externalLinks).toEqual([]);
  });

  it("returns null supersedes when section is missing", () => {
    const md = `# My Decision\n\n## Context\n\nContext here.`;
    const result = parseAdrMarkdown(md);
    expect(result.supersedes).toBeNull();
  });

  it("returns empty tags when not specified", () => {
    const md = `# My Decision\n\n## Context\n\nContext.`;
    const result = parseAdrMarkdown(md);
    expect(result.tags).toEqual([]);
  });

  it("handles empty markdown", () => {
    const result = parseAdrMarkdown("");
    expect(result.title).toBe("");
    expect(result.status).toBe("proposed");
    expect(result.context).toBe("");
  });

  it("handles author with empty value", () => {
    const md = `# Test\n\n**Author:** `;
    const result = parseAdrMarkdown(md);
    expect(result.author).toBeNull();
  });

  it("lowercases tags", () => {
    const md = `# Test\n\n**Tags:** API, Database, SECURITY`;
    const result = parseAdrMarkdown(md);
    expect(result.tags).toEqual(["api", "database", "security"]);
  });

  it("filters empty tags from comma-separated list", () => {
    const md = `# Test\n\n**Tags:** api,, ,security`;
    const result = parseAdrMarkdown(md);
    expect(result.tags).toEqual(["api", "security"]);
  });
});
