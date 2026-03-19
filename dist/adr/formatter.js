export function formatAdrMarkdown(fields) {
    const lines = [];
    lines.push(`# ${fields.title}`);
    lines.push("");
    lines.push(`**Status:** ${capitalize(fields.status)}`);
    lines.push("");
    if (fields.author && fields.author.trim().length > 0) {
        lines.push(`**Author:** ${fields.author.trim()}`);
        lines.push("");
    }
    if (fields.date && fields.date.trim().length > 0) {
        lines.push(`**Date:** ${fields.date.trim()}`);
        lines.push("");
    }
    if (fields.tags.length > 0) {
        lines.push(`**Tags:** ${fields.tags.join(", ")}`);
        lines.push("");
    }
    lines.push("## Context");
    lines.push("");
    lines.push(fields.context || "_(no context provided)_");
    lines.push("");
    if (fields.options.length > 0) {
        lines.push("## Options Considered");
        lines.push("");
        for (const opt of fields.options) {
            lines.push(`- ${opt}`);
        }
        lines.push("");
    }
    lines.push("## Decision");
    lines.push("");
    lines.push(fields.decision || "_(no decision provided)_");
    lines.push("");
    lines.push("## Consequences");
    lines.push("");
    lines.push(fields.consequences || "_(no consequences provided)_");
    lines.push("");
    if (fields.pullRequestUrls.length > 0) {
        lines.push("## Pull Requests");
        lines.push("");
        for (const url of fields.pullRequestUrls) {
            lines.push(`- ${url}`);
        }
        lines.push("");
    }
    if (fields.externalLinks.length > 0) {
        lines.push("## External Links");
        lines.push("");
        for (const link of fields.externalLinks) {
            if (link.label) {
                lines.push(`- [${link.label}](${link.url})`);
            }
            else {
                lines.push(`- ${link.url}`);
            }
        }
        lines.push("");
    }
    if (fields.supersedes) {
        lines.push("## Supersedes");
        lines.push("");
        lines.push(fields.supersedes);
        lines.push("");
    }
    return lines.join("\n");
}
export function slugify(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60);
}
export function adrFilename(adrRef, title) {
    return `adr/${adrRef}-${slugify(title)}.md`;
}
function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}
export function adrCommitMessageCreate(adrRef, title) {
    return `docs: add ${adrRef} - ${title}`;
}
export function adrCommitMessageUpdate(adrRef, title) {
    return `docs: update ${adrRef} - ${title}`;
}
export function adrCommitMessageRename(adrRef) {
    return `docs: rename ${adrRef}`;
}
export function adrCommitMessageStatus(adrRef, status) {
    return `docs: ${status} ${adrRef}`;
}
export function adrCommitMessageDelete(adrRef, title) {
    return `docs: remove ${adrRef} - ${title}`;
}
