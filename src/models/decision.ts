export const DECISION_STATUSES = ["proposed", "approved", "superseded", "rejected"] as const;
export type DecisionStatus = (typeof DECISION_STATUSES)[number];

export function isValidDecisionStatus(status: string): status is DecisionStatus {
  return DECISION_STATUSES.includes(status as DecisionStatus);
}

export interface ExternalLink {
  url: string;
  label?: string;
}

/** Parse multiline "label | url" or plain URL text into ExternalLink[]. */
export function parseExternalLinks(raw: string | null | undefined): ExternalLink[] {
  if (!raw?.trim()) return [];
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const sep = " | ";
      const idx = line.indexOf(sep);
      if (idx !== -1) {
        const label = line.slice(0, idx).trim();
        const url = line.slice(idx + sep.length).trim();
        return url ? { url, label: label || undefined } : null;
      }
      return line.startsWith("http") ? { url: line } : null;
    })
    .filter((l): l is ExternalLink => l !== null);
}

/** Parse newline-separated options text into string[]. */
export function parseOptions(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split("\n")
    .map((o) => o.trim())
    .filter((o) => o.length > 0);
}

/** Parse comma-separated tags text into lowercase trimmed string[]. */
export function parseTags(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0);
}

/** Parse newline-separated pull request URLs into string[]. */
export function parsePullRequestUrls(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split("\n")
    .map((u) => u.trim())
    .filter(Boolean);
}

export interface PreparedDecisionData {
  title: string;
  status: DecisionStatus;
  context: string;
  options: string[];
  decision: string;
  consequences: string;
  tags: string[];
  externalLinks: ExternalLink[];
  pullRequestUrls: string[];
  linkedDecisionId: string | null;
}

export interface RawDecisionFormInput {
  title: string | null | undefined;
  status: string | null | undefined;
  context: string | null | undefined;
  options: string | null | undefined;
  decision: string | null | undefined;
  consequences: string | null | undefined;
  tags: string | null | undefined;
  externalLinks: string | null | undefined;
  pullRequestUrls: string | null | undefined;
  linkedDecisionId: string | null | undefined;
}

export type PrepareDecisionResult =
  | { ok: true; data: PreparedDecisionData }
  | { ok: false; error: string };

/** Validate and normalize raw form input into structured decision data. */
export function prepareDecisionData(input: RawDecisionFormInput): PrepareDecisionResult {
  const title = input.title?.trim() ?? "";
  if (title.length === 0) {
    return { ok: false, error: "Title is required" };
  }

  const status = input.status?.trim() ?? "proposed";
  if (!isValidDecisionStatus(status)) {
    return { ok: false, error: "Invalid status" };
  }

  return {
    ok: true,
    data: {
      title,
      status,
      context: input.context?.trim() ?? "",
      options: parseOptions(input.options),
      decision: input.decision?.trim() ?? "",
      consequences: input.consequences?.trim() ?? "",
      tags: parseTags(input.tags),
      externalLinks: parseExternalLinks(input.externalLinks),
      pullRequestUrls: parsePullRequestUrls(input.pullRequestUrls),
      linkedDecisionId: input.linkedDecisionId?.trim() || null,
    },
  };
}
