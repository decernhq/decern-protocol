/**
 * Format structured ADR fields into YAML frontmatter + markdown.
 */

import type { AdrStatus, AdrEnforcement } from "./parser.js";

export interface AdrFields {
  id: string;
  title: string;
  status: AdrStatus;
  enforcement: AdrEnforcement;
  scope: string[];
  supersedes: string | null;
  date: string | null;
  context: string;
  decision: string;
  consequences: string;
}

export function formatAdrMarkdown(fields: AdrFields): string {
  const lines: string[] = [];

  // Frontmatter
  lines.push("---");
  lines.push(`id: ${fields.id}`);
  lines.push(`title: ${fields.title}`);
  lines.push(`status: ${fields.status}`);
  lines.push(`enforcement: ${fields.enforcement}`);
  if (fields.scope.length > 0) {
    lines.push("scope:");
    for (const s of fields.scope) {
      lines.push(`  - ${s}`);
    }
  } else {
    lines.push("scope:");
  }
  lines.push(`supersedes: ${fields.supersedes ?? "null"}`);
  lines.push(`date: ${fields.date ?? new Date().toISOString().slice(0, 10)}`);
  lines.push("---");
  lines.push("");

  // Body
  lines.push("## Context");
  lines.push("");
  lines.push(fields.context || "(no context provided)");
  lines.push("");
  lines.push("## Decision");
  lines.push("");
  lines.push(fields.decision || "(no decision provided)");
  lines.push("");
  lines.push("## Consequences");
  lines.push("");
  lines.push(fields.consequences || "(no consequences provided)");
  lines.push("");

  return lines.join("\n");
}

export function adrFilename(id: string, title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return `${id.toLowerCase()}-${slug}.md`;
}
