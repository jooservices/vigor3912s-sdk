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
- `maxOutputBytes` overflow is owned by the SDK runner after the exchange is
  returned; transports should still avoid unbounded buffering while reading.

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
