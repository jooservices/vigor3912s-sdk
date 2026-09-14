# Security

## Reporting a vulnerability

Do **not** open a public issue. Report privately to
<jooservices@gmail.com>.

## Threat model

This SDK models DrayTek Vigor3912S CLI commands and can dispatch them through
an injected `Transport`. It does **not** open SSH sessions itself. Consumers
must:

- Own authorization / confirm gates for write and destructive operations
- Never log credentials, tokens, or raw router secrets
- Prefer management on a trusted LAN

## Operator guidance

- Keep secrets in a gitignored `.env`; never commit credentials
- Inject only trusted `Transport` implementations
- Use `LiveReadOnlyClient` only with an explicit read-only allowlist and
  `VIGOR_E2E_READ_ONLY=true` when live E2E is separately authorized
