/**
 * ADR parser: YAML frontmatter + markdown body.
 *
 * Format:
 * ---
 * id: ADR-001
 * title: Use Zod for API input validation
 * status: approved
 * enforcement: blocking
 * scope:
 *   - src/api/**
 * supersedes: null
 * date: 2026-04-10
 * ---
 *
 * ## Context
 * ...
 * ## Decision
 * ...
 * ## Consequences
 * ...
 */

export const ADR_STATUSES = ["proposed", "approved", "superseded", "rejected"] as const;
export type AdrStatus = (typeof ADR_STATUSES)[number];

export const ADR_ENFORCEMENT = ["blocking", "warning"] as const;
export type AdrEnforcement = (typeof ADR_ENFORCEMENT)[number];

export interface ParsedAdr {
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
  /** Raw file content (for hashing) */
  rawContent: string;
}

/**
 * Parse an ADR file (YAML frontmatter + markdown body).
 * Returns null if the file is not a valid ADR.
 */
export function parseAdrMarkdown(content: string): ParsedAdr | null {
  const trimmed = content.trim();
  if (!trimmed.startsWith("---")) return null;

  const endIndex = trimmed.indexOf("---", 3);
  if (endIndex === -1) return null;

  const frontmatter = trimmed.slice(3, endIndex).trim();
  const body = trimmed.slice(endIndex + 3).trim();

  const fm = parseSimpleYaml(frontmatter);

  const id = stringVal(fm.id);
  const title = stringVal(fm.title);
  if (!id || !title) return null;

  const statusRaw = stringVal(fm.status)?.toLowerCase();
  const status: AdrStatus = ADR_STATUSES.includes(statusRaw as AdrStatus)
    ? (statusRaw as AdrStatus)
    : "proposed";

  const enforcementRaw = stringVal(fm.enforcement)?.toLowerCase();
  const enforcement: AdrEnforcement = ADR_ENFORCEMENT.includes(enforcementRaw as AdrEnforcement)
    ? (enforcementRaw as AdrEnforcement)
    : "warning";

  const scope = arrayVal(fm.scope);
  const supersedes = stringVal(fm.supersedes) || null;
  const date = stringVal(fm.date) || null;

  const sections = parseMarkdownSections(body);

  return {
    id,
    title,
    status,
    enforcement,
    scope,
    supersedes,
    date,
    context: sections.context ?? "",
    decision: sections.decision ?? "",
    consequences: sections.consequences ?? "",
    rawContent: content,
  };
}

// ── Minimal YAML parser for frontmatter ──

function parseSimpleYaml(yaml: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  const lines = yaml.split("\n");
  let currentKey = "";
  let currentArray: string[] | null = null;

  for (const line of lines) {
    const arrayItem = line.match(/^\s+-\s+(.+)$/);
    if (arrayItem && currentKey && currentArray) {
      currentArray.push(arrayItem[1].trim());
      continue;
    }

    if (currentArray && currentKey) {
      result[currentKey] = currentArray;
      currentArray = null;
    }

    const kv = line.match(/^(\w[\w-]*)\s*:\s*(.*)$/);
    if (kv) {
      currentKey = kv[1];
      const value = kv[2].trim();

      if (value === "" || value === "null") {
        currentArray = [];
        continue;
      }

      if (value.startsWith("[") && value.endsWith("]")) {
        result[currentKey] = value
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim().replace(/^["']|["']$/g, ""))
          .filter(Boolean);
        currentKey = "";
        continue;
      }

      result[currentKey] = value.replace(/^["']|["']$/g, "");
      currentKey = "";
      continue;
    }
  }

  if (currentArray && currentKey) {
    result[currentKey] = currentArray.length > 0 ? currentArray : null;
  }

  return result;
}

function stringVal(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  return undefined;
}

function arrayVal(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(String);
  return [];
}

function parseMarkdownSections(body: string): Record<string, string> {
  const sections: Record<string, string> = {};
  let current = "";

  for (const line of body.split("\n")) {
    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      current = h2[1].trim().toLowerCase();
      sections[current] = "";
      continue;
    }
    if (current) {
      sections[current] += (sections[current] ? "\n" : "") + line;
    }
  }

  for (const key of Object.keys(sections)) {
    sections[key] = sections[key].trim();
  }

  return sections;
}
