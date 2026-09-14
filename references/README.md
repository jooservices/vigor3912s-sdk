# Vendored evidence corpora

Read-only inputs for `tools/generate-capability-manifest.ts`.

| File                    | Source                                                 |
| ----------------------- | ------------------------------------------------------ |
| `cli-reference-raw.txt` | Part VIII CLI extract (same corpus as workspace skill) |
| `webui-index.md`        | Copy of `projects/vigor3912s/webui-capture/INDEX.md`   |

Do not embed capture page content into the generated manifest — only
structural citations. Regenerate with `npm run manifest:generate`.
