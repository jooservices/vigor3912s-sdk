# jooservices/vigor3912s-sdk

This file adds project-only rules.

- Node.js `>= 24.21.0 <25`, TypeScript ESM (`NodeNext`), npm `>= 12.0.2 <13`
- Typed DrayTek Vigor3912S CLI SDK only — no SSH, no MCP, no live router wire
- Public `Transport` is an injection contract; consumers implement the wire
- Unit tests use fake transport only; never commit `.env` or credentials
- Branch model: `master` + `develop` (no `main`)
