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
