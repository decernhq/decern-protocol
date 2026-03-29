import { describe, it, expect } from "vitest";
import {
  formatAdrMarkdown,
  slugify,
  adrFilename,
  adrCommitMessageCreate,
  adrCommitMessageUpdate,
  adrCommitMessageRename,
  adrCommitMessageStatus,
  adrCommitMessageDelete,
  type AdrFields,
} from "./formatter";

const minimalFields: AdrFields = {
  title: "Use Redis for caching",
  status: "proposed",
  tags: [],
  context: "We need caching.",
  options: [],
  decision: "Use Redis.",
  consequences: "Faster responses.",
  pullRequestUrls: [],
  externalLinks: [],
  supersedes: null,
};

describe("formatAdrMarkdown", () => {
  it("formats minimal ADR correctly", () => {
    const md = formatAdrMarkdown(minimalFields);
    expect(md).toContain("# Use Redis for caching");
    expect(md).toContain("**Status:** Proposed");
    expect(md).toContain("## Context");
    expect(md).toContain("We need caching.");
    expect(md).toContain("## Decision");
    expect(md).toContain("Use Redis.");
    expect(md).toContain("## Consequences");
    expect(md).toContain("Faster responses.");
  });

  it("capitalizes status", () => {
    const md = formatAdrMarkdown({ ...minimalFields, status: "accepted" });
    expect(md).toContain("**Status:** Accepted");
  });

  it("includes author when present", () => {
    const md = formatAdrMarkdown({ ...minimalFields, author: "John Doe" });
    expect(md).toContain("**Author:** John Doe");
  });

  it("omits author when null", () => {
    const md = formatAdrMarkdown({ ...minimalFields, author: null });
    expect(md).not.toContain("**Author:**");
  });

  it("omits author when empty string", () => {
    const md = formatAdrMarkdown({ ...minimalFields, author: "   " });
    expect(md).not.toContain("**Author:**");
  });

  it("includes date when present", () => {
    const md = formatAdrMarkdown({ ...minimalFields, date: "2025-03-15" });
    expect(md).toContain("**Date:** 2025-03-15");
  });

  it("omits date when null", () => {
    const md = formatAdrMarkdown({ ...minimalFields, date: null });
    expect(md).not.toContain("**Date:**");
  });

  it("includes tags when present", () => {
    const md = formatAdrMarkdown({ ...minimalFields, tags: ["api", "caching"] });
    expect(md).toContain("**Tags:** api, caching");
  });

  it("omits tags section when empty", () => {
    const md = formatAdrMarkdown(minimalFields);
    expect(md).not.toContain("**Tags:**");
  });

  it("includes options when present", () => {
    const md = formatAdrMarkdown({ ...minimalFields, options: ["Redis", "Memcached"] });
    expect(md).toContain("## Options Considered");
    expect(md).toContain("- Redis");
    expect(md).toContain("- Memcached");
  });

  it("omits options section when empty", () => {
    const md = formatAdrMarkdown(minimalFields);
    expect(md).not.toContain("## Options Considered");
  });

  it("includes pull request URLs", () => {
    const md = formatAdrMarkdown({
      ...minimalFields,
      pullRequestUrls: ["https://github.com/org/repo/pull/1"],
    });
    expect(md).toContain("## Pull Requests");
    expect(md).toContain("- https://github.com/org/repo/pull/1");
  });

  it("includes external links with labels", () => {
    const md = formatAdrMarkdown({
      ...minimalFields,
      externalLinks: [{ url: "https://example.com", label: "Example" }],
    });
    expect(md).toContain("## External Links");
    expect(md).toContain("- [Example](https://example.com)");
  });

  it("includes external links without labels", () => {
    const md = formatAdrMarkdown({
      ...minimalFields,
      externalLinks: [{ url: "https://example.com" }],
    });
    expect(md).toContain("- https://example.com");
  });

  it("includes supersedes section", () => {
    const md = formatAdrMarkdown({ ...minimalFields, supersedes: "ADR-001" });
    expect(md).toContain("## Supersedes");
    expect(md).toContain("ADR-001");
  });

  it("omits supersedes when null", () => {
    const md = formatAdrMarkdown(minimalFields);
    expect(md).not.toContain("## Supersedes");
  });

  it("uses placeholder for empty context", () => {
    const md = formatAdrMarkdown({ ...minimalFields, context: "" });
    expect(md).toContain("_(no context provided)_");
  });

  it("uses placeholder for empty decision", () => {
    const md = formatAdrMarkdown({ ...minimalFields, decision: "" });
    expect(md).toContain("_(no decision provided)_");
  });

  it("uses placeholder for empty consequences", () => {
    const md = formatAdrMarkdown({ ...minimalFields, consequences: "" });
    expect(md).toContain("_(no consequences provided)_");
  });
});

/* ── slugify ──────────────────────────────────────────────────────── */

describe("slugify", () => {
  it("lowercases and replaces spaces with dashes", () => {
    expect(slugify("Use Redis for Caching")).toBe("use-redis-for-caching");
  });

  it("removes special characters", () => {
    expect(slugify("Hello! World? (Yes)")).toBe("hello-world-yes");
  });

  it("collapses multiple dashes", () => {
    expect(slugify("a---b")).toBe("a-b");
  });

  it("trims leading and trailing dashes", () => {
    expect(slugify("-hello-")).toBe("hello");
  });

  it("truncates to 60 characters", () => {
    const long = "a".repeat(100);
    expect(slugify(long).length).toBe(60);
  });

  it("handles empty string", () => {
    expect(slugify("")).toBe("");
  });
});

/* ── adrFilename ──────────────────────────────────────────────────── */

describe("adrFilename", () => {
  it("generates correct filename", () => {
    expect(adrFilename("ADR-001", "Use PostgreSQL")).toBe("adr/ADR-001-use-postgresql.md");
  });
});

/* ── commit message helpers ───────────────────────────────────────── */

describe("commit message helpers", () => {
  it("adrCommitMessageCreate", () => {
    expect(adrCommitMessageCreate("ADR-001", "Use Redis")).toBe("docs: add ADR-001 - Use Redis");
  });

  it("adrCommitMessageUpdate", () => {
    expect(adrCommitMessageUpdate("ADR-001", "Use Redis")).toBe("docs: update ADR-001 - Use Redis");
  });

  it("adrCommitMessageRename", () => {
    expect(adrCommitMessageRename("ADR-001")).toBe("docs: rename ADR-001");
  });

  it("adrCommitMessageStatus", () => {
    expect(adrCommitMessageStatus("ADR-001", "accepted")).toBe("docs: accepted ADR-001");
  });

  it("adrCommitMessageDelete", () => {
    expect(adrCommitMessageDelete("ADR-001", "Use Redis")).toBe("docs: remove ADR-001 - Use Redis");
  });
});
