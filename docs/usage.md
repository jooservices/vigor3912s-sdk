# Using `@jooservices/vigor3912s-sdk`

Guide for **embedders** that call the typed CLI SDK from Node. Every statement
here matches the implemented public API. Requirements: Node `>=24.21.0 <25`,
npm `>=12.0.2 <13`, ESM. Build output lives in `dist/` and is exposed through
the package `exports` map.

The package is **`"private": true`** (not on npm). Install from GitHub:

```bash
npm install github:jooservices/vigor3912s-sdk#v1.0.0
```

This SDK does **not** open SSH sessions, read `.env` credentials, or connect to
a router. Wire access belongs to a consumer-injected `Transport` (for example an
adapter over `@jooservices/ssh-client`). See [`transport.md`](./transport.md).

## Public surface

| Import                                   | What you get                                                |
| ---------------------------------------- | ----------------------------------------------------------- |
| `@jooservices/vigor3912s-sdk`            | `Vigor3912SClient`, errors, `sdkPackageName`, `sdkMetadata` |
| `@jooservices/vigor3912s-sdk/operations` | `operations.<family>.<op>` typed descriptors                |
| `@jooservices/vigor3912s-sdk/transport`  | `Transport` and related wire types                          |
| `@jooservices/vigor3912s-sdk/live`       | `LiveReadOnlyClient` (allowlisted reads only)               |

## Quick start

```ts
import { Vigor3912SClient } from "@jooservices/vigor3912s-sdk";
import { operations } from "@jooservices/vigor3912s-sdk/operations";
import type { Transport } from "@jooservices/vigor3912s-sdk/transport";

const transport: Transport = /* your implementor */;
const client = Vigor3912SClient.fromTransport(transport);

// Raw one-command envelope (caller owns effects)
const raw = await client.execute("sys version");
console.log(raw.stdout);

// Typed operation (canonical descriptor + parsed output)
const status = await client.invoke(operations.wan.wanStatus, undefined);
```

Without an injected runner / `Transport`, `execute()` and `invoke()` fail closed
with `OperationNotImplementedError`.

## `Vigor3912SClient`

### `fromTransport(transport, options?)`

Builds a client whose private runner dispatches framed DrayOS commands through
`transport.send(...)`. Optional `options.limits` may **lower** timeouts /
ceilings; it cannot raise them above SDK defaults.

### `execute(command, options?)`

- Sends **exactly one** DrayOS CLI command string.
- Shell chaining (`&&`, `;`, `|`, …) is rejected by framing before dispatch.
- Returns `{ command, stdout, stderr }` — **no fabricated exit code**.
- `options.signal` / `options.timeoutMs` are honored by the runner.

### `invoke(operation, input, options?)`

- `operation` must be the **canonical** registry descriptor (forged clones with
  the same `manifestId` are rejected: `forged_operation_rejected`).
- Builds frames via `operation.buildFrames(input)`, runs them in order, then
  returns `operation.parse(exchanges)`.
- Classification (`read` / `write` / `destructive`) is **metadata only**. This
  SDK does not authorize or confirm writes — the app / MCP / live client does.

Import operations from the public namespace:

```ts
import { operations } from "@jooservices/vigor3912s-sdk/operations";

operations.sys.sysVersion;
operations.wan.wanStatus;
operations.wan.wanEnable; // write — consumer policy still required
```

## Errors

Root exports: `Vigor3912SError`, `OperationNotImplementedError`, `sdkErrorCodes`.

| Code                        | Typical cause                                   |
| --------------------------- | ----------------------------------------------- |
| `operation_not_implemented` | No runner / transport injected                  |
| `command_framing_rejected`  | Empty command, control chars, or chaining       |
| `execution_timeout`         | Command exceeded timeout                        |
| `output_limit_exceeded`     | Transport output hit the byte ceiling           |
| `session_closed`            | Transport closed during / before send           |
| `forged_operation_rejected` | Descriptor is not the registry canonical object |
| `live_client_rejected`      | `LiveReadOnlyClient` guard failed               |

## `LiveReadOnlyClient`

Optional subpath for tightly gated **read-only** live work. It is **not** the
general typed API.

```ts
import { LiveReadOnlyClient } from "@jooservices/vigor3912s-sdk/live";

const live = LiveReadOnlyClient.create({
  operationIds: ["cli.sys.version", "cli.wan.status"],
  transportPolicy: {/* private-lan policy literals */},
  transport,
  env: { VIGOR_E2E_READ_ONLY: "true" },
});

const out = await live.invoke("cli.sys.version");
```

Guards run **before** any transport `send`: env flag exact `true`, id on the
allowlist with manifest/registry `read` + `implemented`, and transport policy.
There is no raw `execute` on this client.

Do not use live E2E against a real router without separate, explicit
authorization.

## Safety rules for consumers

1. Inject only a trusted `Transport`.
2. Treat `write` / `destructive` ops as dangerous even though `invoke()` will
   dispatch them when a transport is present.
3. Never commit credentials; keep secrets in a gitignored `.env`.
4. Prefer LAN-only management; do not expose router admin from the Internet.

## Related docs

- [`transport.md`](./transport.md) — implementor contract for `Transport`
- [`../CHANGELOG.md`](../CHANGELOG.md)
- [`../SECURITY.md`](../SECURITY.md)
