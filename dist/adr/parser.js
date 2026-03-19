export function parseAdrMarkdown(markdown) {
    const lines = markdown.split("\n");
    let title = "";
    let status = "proposed";
    let author = null;
    let date = null;
    let tags = [];
    let supersedes = null;
    const sections = {};
    let currentSection = "__header";
    sections[currentSection] = [];
    for (const line of lines) {
        const h1 = line.match(/^#\s+(.+)$/);
        if (h1 && !title) {
            title = h1[1].trim();
            continue;
        }
        const statusMatch = line.match(/^\*\*Status:\*\*\s*(.+)$/i);
        if (statusMatch) {
            status = statusMatch[1].trim().toLowerCase();
            continue;
        }
        const tagsMatch = line.match(/^\*\*Tags:\*\*\s*(.+)$/i);
        if (tagsMatch) {
            tags = tagsMatch[1]
                .split(",")
                .map((t) => t.trim().toLowerCase())
                .filter(Boolean);
            continue;
        }
        const authorMatch = line.match(/^\*\*Author:\*\*\s*(.+)$/i);
        if (authorMatch) {
            const parsed = authorMatch[1].trim();
            author = parsed.length > 0 ? parsed : null;
            continue;
        }
        const dateMatch = line.match(/^\*\*Date:\*\*\s*(.+)$/i);
        if (dateMatch) {
            const parsed = dateMatch[1].trim();
            date = parsed.length > 0 ? parsed : null;
            continue;
        }
        const h2 = line.match(/^##\s+(.+)$/);
        if (h2) {
            currentSection = h2[1].trim().toLowerCase();
            sections[currentSection] = [];
            continue;
        }
        if (sections[currentSection]) {
            sections[currentSection].push(line);
        }
    }
    const getSection = (key) => (sections[key] || []).join("\n").trim();
    const getListItems = (key) => (sections[key] || [])
        .map((l) => l.replace(/^[-*]\s+/, "").trim())
        .filter(Boolean);
    const pullRequestUrls = getListItems("pull requests").filter((u) => u.startsWith("http"));
    const externalLinks = getListItems("external links").map((item) => {
        const mdLink = item.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (mdLink)
            return { url: mdLink[2], label: mdLink[1] };
        if (item.startsWith("http"))
            return { url: item };
        return { url: item };
    });
    const supersedesRaw = getSection("supersedes");
    if (supersedesRaw) {
        const ref = supersedesRaw.match(/ADR-\d+/i);
        supersedes = ref ? ref[0] : supersedesRaw.trim() || null;
    }
    const options = sections["options considered"] ? getListItems("options considered") : [];
    return {
        title,
        status,
        author,
        date,
        tags,
        context: getSection("context"),
        options,
        decision: getSection("decision"),
        consequences: getSection("consequences"),
        pullRequestUrls,
        externalLinks,
        supersedes,
    };
}
