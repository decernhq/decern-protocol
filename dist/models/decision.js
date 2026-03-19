export const DECISION_STATUSES = ["proposed", "approved", "superseded", "rejected"];
export function isValidDecisionStatus(status) {
    return DECISION_STATUSES.includes(status);
}
/** Parse multiline "label | url" or plain URL text into ExternalLink[]. */
export function parseExternalLinks(raw) {
    if (!raw?.trim())
        return [];
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
        .filter((l) => l !== null);
}
/** Parse newline-separated options text into string[]. */
export function parseOptions(raw) {
    if (!raw?.trim())
        return [];
    return raw
        .split("\n")
        .map((o) => o.trim())
        .filter((o) => o.length > 0);
}
/** Parse comma-separated tags text into lowercase trimmed string[]. */
export function parseTags(raw) {
    if (!raw?.trim())
        return [];
    return raw
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter((t) => t.length > 0);
}
/** Parse newline-separated pull request URLs into string[]. */
export function parsePullRequestUrls(raw) {
    if (!raw)
        return [];
    return raw
        .split("\n")
        .map((u) => u.trim())
        .filter(Boolean);
}
/** Validate and normalize raw form input into structured decision data. */
export function prepareDecisionData(input) {
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
