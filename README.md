# jooservices/vigor3912s-sdk

[![CI](https://github.com/jooservices/vigor3912s-sdk/actions/workflows/ci.yml/badge.svg?branch=develop)](https://github.com/jooservices/vigor3912s-sdk/actions/workflows/ci.yml)
[![Node](https://img.shields.io/badge/Node-24.21-blue.svg)](https://nodejs.org/)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/jooservices/vigor3912s-sdk/badge)](https://scorecard.dev/viewer/?uri=github.com/jooservices/vigor3912s-sdk)
[![GitHub Release](https://img.shields.io/github/v/release/jooservices/vigor3912s-sdk?display_name=tag)](https://github.com/jooservices/vigor3912s-sdk/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Node 24 TypeScript SDK for typed DrayTek **Vigor3912S** CLI automation:
capability manifest, typed operations, parsers, and a public `Transport`
injection contract. The package does **not** open SSH sessions and does
**not** depend on `ssh-client` or MCP.

## Status

**v1.0.0.** The package stays `"private": true` and is not published to npm;
consume it from the checkout or a Git tag. See [`CHANGELOG.md`](./CHANGELOG.md).

## Features

- Typed CLI operations for every implementable DrayOS command (472 ops /
  42 families); blocked entries carry documented reasons
- `Vigor3912SClient.execute()` / `.invoke()` over an injected runner or
  `fromTransport(transport)`
- Public subpaths: `./operations`, `./transport`, `./live`
- Classification is metadata only — write policy belongs to the consumer
- Global unit coverage gate ≥ 90%

## Requirements

- Node.js `>= 24.21.0 <25`
- npm `>= 12.0.2 <13`

## Installation

Not published to npm. Install from GitHub (pin a tag or branch):

```bash
npm install github:jooservices/vigor3912s-sdk#v1.0.0
```

```json
{
  "dependencies": {
    "@jooservices/vigor3912s-sdk": "github:jooservices/vigor3912s-sdk#v1.0.0"
  }
}
```

Local JOOservices workspace only (another package under `projects/`):
`file:../vigor3912s-sdk` — that relative path is for sibling checkouts, not
for a clone of this repo alone.

## Quick start

```ts
import { Vigor3912SClient } from "@jooservices/vigor3912s-sdk";
import { operations } from "@jooservices/vigor3912s-sdk/operations";
import type { Transport } from "@jooservices/vigor3912s-sdk/transport";

const transport: Transport = /* consumer implements Transport */;
const client = Vigor3912SClient.fromTransport(transport);

const raw = await client.execute("sys version");
const parsed = await client.invoke(operations.wan.wanStatus, undefined);
```

Full embedder guide: [`docs/usage.md`](./docs/usage.md). Transport implementors:
[`docs/transport.md`](./docs/transport.md).

## Documentation

- [`docs/usage.md`](./docs/usage.md) — install, client API, operations, errors, live client
- [`docs/transport.md`](./docs/transport.md) — public `Transport` semantics
- [`CHANGELOG.md`](./CHANGELOG.md)
- [`CONTRIBUTING.md`](./CONTRIBUTING.md)
- [`SECURITY.md`](./SECURITY.md)
- [`WORKFLOWS.md`](./WORKFLOWS.md)

## Development

```bash
nvm use            # Node 24.21.0 (.nvmrc)
npm ci
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm run build
npm run ci         # full local gate (same bar as CI)
```

## License

MIT — see [`LICENSE`](LICENSE).
