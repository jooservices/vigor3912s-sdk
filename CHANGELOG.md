# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-09-14

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
