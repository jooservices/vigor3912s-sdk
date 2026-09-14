# Redacted Fixtures

Fixtures in this directory must be synthetic or imported through the explicit
redacted fixture importer. Never place raw router captures, credentials, cookies,
session tokens, private hostnames, MAC addresses, or real network addresses here.

Use the importer only as a manual command:

```bash
npm run fixtures:import -- --input <source-outside-tests-fixtures> --output tests/fixtures/<name>.txt --provenance tests/fixtures/<name>.provenance.json
```

The importer never modifies the source file. It writes a redacted fixture and a
provenance JSON file containing only the constant source kind, SHA-256 hashes,
redaction counts, and the redaction rule version. Provenance must not retain the
source path, file name, or any derived source identifier.
