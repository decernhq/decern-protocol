# @decern/protocol

Stateless TypeScript library for Decern domain logic. Pure functions, no side effects, no database or network calls. Consumed by `decern-core`, `decern-gate`, and `decern-cloud`.

## Entry points

| Import | Contents |
|---|---|
| `@decern/protocol` | Re-exports everything |
| `@decern/protocol/adr` | ADR parsing, formatting, scope matching, verdict types |
| `@decern/protocol/evidence` | Evidence records, hash chain, Ed25519 signing, canonical JSON, verification |
| `@decern/protocol/models` | Decision status validation, field normalization |
| `@decern/protocol/policies` | Legacy policy helpers (v1, retained for compatibility) |

## ADR module (`@decern/protocol/adr`)

- `parseAdrMarkdown(content)` — parse YAML frontmatter + markdown body into structured `ParsedAdr`
- `formatAdrMarkdown(fields)` — serialize structured fields back to markdown
- `adrFilename(id, title)` — generate filename slug (`adr-007-use-postgres.md`)
- `scopeMatchesFiles(scope, files)` — glob matching for scope pre-filter
- `ADR_STATUSES`, `ADR_ENFORCEMENT` — type constants

## Evidence module (`@decern/protocol/evidence`)

- `EvidenceRecord`, `EvidenceRecordInput` — record types (schema version, timestamps, verdict, signature)
- `computeEvidenceHash(record)` — SHA-256 hash of canonical JSON (RFC 8785)
- `canonicalize(obj)` — deterministic JSON serialization
- `verifyChain(records)` — validate hash chain integrity
- `validateEvidenceRecord(record)` — schema validation
- `LocalSigner` — Ed25519 signing with Node.js crypto (32-byte seed, PKCS8 wrapping)
- `ExternalKmsSigner` — interface for AWS KMS / external HSM signing
- `Verdict`, `ReasonCode`, `Signature` — type definitions
- Deterministic checks: `path-denylist`, `dependency-denylist`, `regex-checks`, `file-type-denylist`, `size-threshold`

## Build

```bash
npm install
npm run build   # tsc → dist/
npm test        # vitest
```

## Local development with decern-core

Clone into the `protocol/` directory of decern-core:

```bash
cd /path/to/decern
git clone https://github.com/decernhq/decern-protocol.git protocol
```

Webpack and Vitest aliases resolve `@decern/protocol/*` to local source when present.

## License

MIT
