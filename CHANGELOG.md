# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `./schemas` export: JSON Schema (`inputSchemas`, `inputSchemaFor(manifestId)`,
  `JsonSchema`) for every implemented operation's input, keyed by
  `manifestId`, generated from the operations' TypeScript input types. Numeric
  bounds come from the domain validators; tuples carry `minItems`/`maxItems`.
  Zero new runtime dependencies.
- Full documented sub-forms for `ip arp`, `ip route`, `ip session` and
  `wan detect` (21 new operations, see ARCHITECTURE amendment 2026-09-29), and
  live-recon operations `cli.ddns.show.all` / `cli.ip.session.list` for the bare
  `ddns show` / `ip session` forms (raw text).
- `Transport.stream()` (optional): output-limit and idle-timeout enforcement
  while output arrives. `Transport.remoteEndpoint` (optional; required by
  `LiveReadOnlyClient`). Types `TransportChunk`, `TransportEndpoint`.
- `detectCliRejection()` and error code `command_rejected`.
- Full documented sub-form coverage (826 of 845 Part VIII syntax forms, the
  rest reasoned) and 50 firmware-only operations from fw 4.4.7_RC2 `?` help
  (`fs`, `vpn wg/udp/passAPM/dpdkctrl`, `mngt ssh_oldkex/lb_interface/
NoSecureL2TPMngt/ValidationCode`, `wan detect2/lbweight/voipdect/phymode/
drop/dpdk-port`, `sys ipfix_netflow/pwenc/mpage/con2tel`, `ip igmp_fl`,
  `ipf default/hash_analysis`, `qos setdefault`, `show ping`, `usb FTPusage`,
  `vlan map`) — 640 operations in total. New classification basis
  `live-help-syntax`.
- `LiveReadOnlyClientOptions.sessionPolicy`; `isPrivateLanAddress()` (`./live`).
- `InvalidInputError` (code `invalid_input`) for rejected operation input and
  error code `invalid_options` for rejected execution limits / `timeoutMs`.
- `CommandRunner.runWithOverride` (optional) as part of the runner contract.
- `schemaProblem(input, schema)` (`./schemas`): checks a value against a
  generated input schema; messages name the path and rule, never the value.

### Changed

- `invoke()` now rejects router-reported failures (non-empty `stderr` or an
  explicit `% Invalid|Unknown|Incomplete|Error|Command not found|Insufficient
arguments|input …|Valid (sub)commands are` line) with `command_rejected`
  instead of parsing them as results. `execute()` is unchanged (raw, unjudged).
- `commandTimeoutMs` is now a hard deadline even when the transport ignores
  `AbortSignal`; a timed-out session is invalidated via
  `Transport.close("execution_timeout")`.
- `LiveReadOnlyClient.create()` requires `transport.remoteEndpoint` to be a
  private-LAN IP on the policy port (re-checked before every command) and
  enforces `SessionPolicy.maxSessionMs` / `idleTimeoutMs`.
- `ip bandwidth` schedule `profiles` and `apm profile apply` `clientIndexes`
  now reject a wrong-length list at runtime.
- Test gates: runtime operation census (`npm test` fails unless every
  operation's `buildFrames` and `parse` run in a unit test), `tools/` coverage
  (≥ 85 % lines), 100 % function coverage for domains/parsers.

- `local_8021x` manifest entry now records `commandPath` / `command` as
  `local_8021x show` (id unchanged).

- **Breaking — input hardening.** A caller-supplied value can no longer add
  options to a command: values placed as one argument reject whitespace, `"`,
  shell metacharacters and a leading `-`; documented end-of-line text
  (`ip bindmac` comment, `csm ucf/wcf msg`, `swm search description`) rejects
  `"` and flag-like words; opaque `param` tails (`vpn setup/ovpn/dial_out/
l2lset/l2lDrop/dinset/option/trunk/sameSubnet`, `user set/edit/account`)
  are bounded to their documented keywords or flags; flag-style `args` must
  start with a documented flag. Validation errors are `InvalidInputError`
  and never echo the rejected value.
- **Breaking — input validated against its schema.** `invoke()` (and
  `LiveReadOnlyClient`) check the input against the operation's generated JSON
  Schema before building a command, so untyped input (JSON from an MCP tool)
  of the wrong shape, with an undocumented field or an unknown `action`
  rejects with `invalid_input` and sends nothing — previously e.g. `fs rm {}`
  built `fs rm undefined`. A builder crash on malformed input also surfaces as
  `invalid_input`.
- **Breaking — `ipf view` input** is `{ flags?: [...] }` (pass `{}`), no
  longer `undefined`.
- Schemas: a range check the code skips for a sentinel literal (e.g.
  `idleTimeout: -1`, `tagValue: -1`) is described as
  `oneOf: [{ const: -1 }, { type: "integer", minimum, maximum }]`.
- **Breaking — classification.** `cli.switch.i` is `write` (`traffic on/off`
  toggles the statistic function).
- **Breaking — parser output.** A field the output does not contain is now
  `null` instead of a guessed `false` / `""` (`linux` status/toggles,
  `switch status`, `vlan status`, `vigbrg` status/wanstatus/wlanstatus,
  `sys cc` / `cfg status` / `version`, `ldap view`, `ipf view`).
- A caller abort now settles an in-flight command immediately (even if the
  transport ignores `AbortSignal`) and invalidates the session, like a
  timeout. An output-limit failure no longer waits on `Transport.close()`.
- Execution limits and `timeoutMs` are validated (positive integers, timers
  ≤ 2³¹−1 ms) instead of silently disabling a guard.
- `LiveReadOnlyClient` refuses router rejections (`command_rejected`) like
  `invoke()`; `cli.sys.health` left its allowlist (it needs input).
- `isPrivateLanAddress()` no longer treats short first hextets (`fc::1`,
  `fe8::1`) as private.
- Fixture redaction (`fixture-redaction-v2`) also covers dash / dotted / bare
  MACs and `secret`, `psk`, `pre-shared key`, `community`, `passphrase` labels.
- `npm run build` cleans `dist/` first, so removed modules are never shipped.

### Deprecated

- `TransportPolicy.connectTimeoutMs` — not enforced by the SDK; the transport
  owns connecting.

### Internal

- Generator split into `tools/manifest/*`; 152 duplicated domain validator
  copies replaced by `src/internal/domain-support.ts`.

## [1.0.0] - 2026-09-14

### Added

- Consumer usage guide at `docs/usage.md`.

### Changed

- README installation uses GitHub tags; sibling `file:../` is documented as
  workspace-only.
- GitHub Actions pinned to commit SHAs; CI activates npm 12 via Corepack;
  Dependabot cooldown set to 7 days.

### Removed

- Internal `HANDOVER.md` (superseded by README + `docs/usage.md` +
  `ARCHITECTURE.md`).

### Added

- First stable release of `@jooservices/vigor3912s-sdk`.
- Typed CLI operations for every implementable DrayOS command (472 ops /
  42 domain modules); six entries remain `blocked-by-documentation` with
  recorded reasons.
- Public package surface: `Vigor3912SClient` (`execute`, `invoke`,
  `fromTransport`), `./operations`, `./transport`, and `./live`
  (`LiveReadOnlyClient` guards).
- Capability manifest generator with `manifest:check` drift gate and
  vendored CLI / WebUI evidence under `references/`.
- Local verify / CI gate: format, lint, typecheck, build, tests, manifest
  check, coverage (≥90%), and `npm audit --audit-level=moderate`.

### Notes

- The package stays `"private": true` and is not published to npm; consume
  from the checkout or a Git tag.
- SSH / live network transport is intentionally out of scope — inject a
  consumer `Transport` implementation.
