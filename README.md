# decern-protocol

Stateless TypeScript library for Decern domain logic. It provides pure functions for ADR content, decision normalization, and decision-gate policy/judge evaluation.

## Scope

`decern-protocol` is framework-agnostic and side-effect free:

- no database access
- no network calls
- no Next.js/Supabase dependencies

It is consumed by `decern-core` and `decern-cloud`.

## Package

- NPM name: `@decern/protocol`
- Entry points:
  - `@decern/protocol`
  - `@decern/protocol/adr`
  - `@decern/protocol/models`
  - `@decern/protocol/policies`

## Modules

- `src/adr`
  - Parse ADR markdown into structured data
  - Format structured ADR data back to markdown
  - Generate ADR filenames and commit message helpers
- `src/models`
  - Decision status validation
  - Normalize decision form fields (tags, links, options, PR refs)
- `src/policies`
  - Decision gate policy composition and capability checks
  - Validate decision state against policy requirements
  - Judge helpers (parse LLM output, compute confidence outcome)
  - Decision lookup utilities (`decisionId` vs `adrRef`)

## Build

```bash
npm install
npm run build
```

## Design Principles

- Pure functions with deterministic outputs
- Reusable across CLI, backend, and UI layers
- Easy to test and version independently

## License

Public package distributed with the Decern open ecosystem.
# decern-protocol

Stateless core library for the Decern ecosystem. Pure functions for ADR management, policy evaluation, and decision validation.

**Repository:** https://github.com/decernhq/decern-protocol

## Architecture

```
decern (open)       ← Next.js app (UI + API routes)
  ├── protocol/     ← THIS REPO (stateless core logic)
  └── cloud/        ← Private repo (Stripe, GitHub, Judge)
```

`decern-protocol` contains pure, database-independent functions used by both `decern-app` and `decern-cloud`.

## Setup

Clone this repo into the `protocol/` directory of the main Decern project:

```bash
cd /path/to/decern
git clone https://github.com/decernhq/decern-protocol.git protocol
```

The `protocol/` directory is git-ignored by the main repo.

## What belongs here

| Module | Description |
|--------|-------------|
| `src/adr/` | ADR markdown parsing and formatting |
| `src/policies/` | Decision Gate policy evaluation (pure functions) |
| `src/refs/` | ADR reference generation (`ADR-001`, `ADR-002`, ...) |
| `src/types/` | Shared TypeScript types (Decision, Project, Workspace) |

## Principles

- **Stateless**: no database queries, no side effects
- **Pure functions**: input → output, fully testable
- **Zero dependencies**: no Supabase, no Next.js, no framework
- **Reusable**: works in Node.js, browser, edge functions, CLI
