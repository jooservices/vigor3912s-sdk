# Transport Contract

The SDK exposes its client-facing wire contract from
`@jooservices/vigor3912s-sdk/transport`. A separate client package can
implement this contract and pass it to `Vigor3912SClient.fromTransport()`.

The SDK does not create SSH sessions, open sockets, read `.env`, or connect to a
router. A caller-injected transport can be backed by a live connection, but that
authorization and implementation live outside this package.

## Public Types

```ts
import type {
  CommandExchange,
  CommandFrame,
  ExecutionLimits,
  Transport,
  TransportExchange,
} from "@jooservices/vigor3912s-sdk/transport";
```

- `Transport` is the interface implementors satisfy.
- `CommandFrame` is created by the SDK; implementors receive it in `send()` and
  read `frame.command`.
- `ExecutionLimits` describes the limits the SDK runner resolved for that
  exchange.
- `TransportExchange` is the transport response shape.
- `CommandExchange` is the parser-facing response shape. It is identical to
  `TransportExchange` today and carries no exit code.

## Semantics

`Transport.send(frame, limits, signal)` is one frame to one exchange. The SDK
frames one DrayOS CLI command per call and rejects shell chaining before
dispatch. A transport implementation must not split one frame into multiple
independent SDK exchanges, and it must not combine multiple SDK frames into one
router exchange.

Implementors must honor `AbortSignal` and `ExecutionLimits`:

- `signal` cancellation means stop the in-flight exchange as promptly as the
  underlying wire allows.
- `commandTimeoutMs`, `idleTimeoutMs`, `maxCommandBytes`, and `maxOutputBytes`
  are effective limits selected by the SDK runner for this exchange.

### Timeouts are hard

`commandTimeoutMs` does not depend on transport cooperation. When it elapses
the runner aborts `signal`, rejects the command with `execution_timeout`
immediately (even if `send()` never settles), and calls `close("execution_timeout")`
without awaiting it. The abandoned command may still produce output, so the
session must not be reused as-is: after that `close`, report `isOpen === false`
or reconnect before the next `send()`. Queued commands never wait on a hung
exchange.

A caller abort (`ExecuteOptions.signal`) of a command already on the wire is
handled the same way: the command rejects with the abort reason at once and
the session is closed with `close("aborted")`. A command aborted while still
queued is simply skipped.

### Output limit

A response over `maxOutputBytes` rejects with `output_limit_exceeded`, closes
the runner for good (no truncation) and calls `close("output_limit_exceeded")`
without awaiting it, so a transport that also hangs on close cannot delay the
error. Create a new client to continue.

### Limit values

Limits and `ExecuteOptions.timeoutMs` must be positive integers (timers at
most 2³¹−1 ms); anything else rejects with `invalid_options` rather than
silently disabling a guard.

### Streaming (`stream`) — optional, recommended

`Transport.stream(frame, limits, signal)` yields `{ stream: "stdout" | "stderr",
data }` chunks as they arrive and finishes when the prompt returns. When it is
implemented the runner uses it instead of `send()` and enforces, while output is
still arriving:

- `maxOutputBytes` — the response is stopped at the first chunk that crosses the
  limit (see "Output limit"); nothing beyond the limit is buffered;
- `idleTimeoutMs` — no chunk for that long rejects with `execution_timeout`;
- `commandTimeoutMs` — as above.

With `send()` alone the SDK can only check `maxOutputBytes` after the transport
has buffered the whole response, and cannot enforce `idleTimeoutMs`.

### Endpoint (`remoteEndpoint`)

`Transport.remoteEndpoint` reports the peer the session is actually connected
to: the resolved IP literal and port. It is optional for general use and
required by `LiveReadOnlyClient`, which verifies it is a private-LAN address on
the policy port at `create()` and again before every command.

### Router-reported failures

DrayOS reports most failures as a `%`-prefixed stdout line and still returns the
prompt. `Vigor3912SClient.invoke` and `LiveReadOnlyClient.invoke` treat non-empty `stderr` or an explicit
failure line (`% Invalid`, `% Unknown`, `% Incomplete`, `% Error`, `% Command
not found`, `% Insufficient arguments`, `% input …`, `% Valid (sub)commands
are`) as `command_rejected` and never parses it as a result. The error message
names the rejection kind only, never router output. `detectCliRejection` is
exported for consumers of the raw `execute()` API, which returns output
unjudged.

`Transport.isOpen` must reflect whether the session can accept another
exchange. If `isOpen` is `false`, the SDK runner reports `session_closed` before
calling `send()`.

`Transport.close(reason)` must close the underlying session and make future
`isOpen` checks return `false`. The `reason` is a diagnostic string from the
SDK, not a router command.

## DrayOS Session Responsibilities

DrayOS is an interactive CLI, not a shell exec channel. A live implementor is
responsible for session mechanics such as:

- login and prompt detection;
- command echo handling;
- pager prompts and continuation;
- collecting output until the command's prompt-delimited exchange is complete;
- mapping transport/session failures to rejected promises without embedding
  sensitive command output in error messages.

The SDK does not fabricate exit codes. `CommandExchange` and
`TransportExchange` intentionally contain only `stdout` and `stderr`. If a live
session reports command failure as text, the transport should return that text;
typed parsers or callers decide what it means.

## Fake Reference

`tests/support/fake-transport.ts` is the reference test implementation of the
contract. It is deterministic, in-memory, and intentionally not exported as
production wire code.

Use it as an example of the TypeScript shape and test behavior, not as a real
router transport.
