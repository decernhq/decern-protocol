# decern-protocol

Stateless TypeScript library for Decern domain logic. It provides pure functions for ADR content, decision normalization, and decision-gate policy/judge evaluation.

## Scope

`decern-protocol` is framework-agnostic and side-effect free:

- no database access
- no network calls
- no Next.js/Supabase dependencies

It is consumed by `decern-core`, `decern-gate`, and `decern-cloud`.

## Package

- NPM name: `@decern/protocol`
- Current version: `0.1.1`
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

## Local Link In decern-core

Clone this repository into the `protocol/` directory of the main Decern project if you want to develop protocol locally:

```bash
cd /path/to/decern
git clone https://github.com/decernhq/decern-protocol.git protocol
```

In production build flows, `decern-core` resolves protocol from npm (`@decern/protocol`). A local `protocol/` directory is only needed when developing protocol side-by-side.

## Design Principles

- Pure functions with deterministic outputs
- Reusable across CLI, backend, and UI layers
- Easy to test and version independently
