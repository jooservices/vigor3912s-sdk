# Contributing

## Setup

```bash
nvm use
npm ci
git config core.hooksPath .githooks
npm run ci
```

## Commits

Conventional Commits, English only. Author/committer:
`Viet Vu <jooservices@gmail.com>`.

Hooks: `.githooks/commit-msg` (Conventional Commits), `pre-commit`
(whitespace, `.env` block, lint), `pre-push` (unit tests). Never use
`--no-verify`.

## Branches

`feature/*` / `fix/*` / … from `develop`, PR into `develop`. Release via
`release/<version>` → `master`.

## Quality gate

```bash
npm run ci
```

Must stay green before opening a PR.

## Domain operations

- Validation helpers shared by domains live in `src/internal/domain-support.ts`;
  never copy them into a domain file.
- JSDoc on an operation's `*Input` properties is published verbatim as the
  JSON Schema `description` (and shown to MCP/LLM clients). Write it for API
  consumers; never include secrets, hostnames, or internal notes.
- Numeric bounds in the published schema are read from
  `assertInteger` / `assertIntegerInRange` / `assertPositiveInteger` /
  `assertNonNegativeInteger` calls on `input.<property>`; validate numeric
  input with these helpers so the schema and runtime stay in sync.
- Every operation needs a unit test that executes both `buildFrames` and
  `parse` (`tests/support/operation-cases.ts` `describeOperation` does both);
  `npm test` fails otherwise (operation census).
