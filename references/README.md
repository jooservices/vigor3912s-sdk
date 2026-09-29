# Vendored evidence corpora

Read-only inputs for `tools/generate-capability-manifest.ts` and the census tests.

The DrayTek online command manuals v4.3.6 and v4.4.5 are byte-identical and
differ from the vendored 4.3.5.1 corpus only by `srv dhcp relay 2nd_servip`
(already modelled) and a doc-only removal of `ipf view -c`
(`projects/vigor3912s/docs/command-ref-version-diff.md`).

| File                               | Source                                                                                              |
| ---------------------------------- | --------------------------------------------------------------------------------------------------- |
| `cli-reference-raw.txt`            | Part VIII CLI extract (same corpus as workspace skill)                                              |
| `webui-index.md`                   | Copy of `projects/vigor3912s/webui-capture/INDEX.md`                                                |
| `live-help-fw-4.4.7_RC2.txt`       | Owner capture of `<command> ?` help on fw 4.4.7_RC2 (2026-09-29): syntax for firmware-only commands |
| `live-inventory-fw-4.4.7_RC2.json` | fw 4.4.7_RC2 `?` command tree (families + subcommands) for the live-inventory census                |

Do not embed capture page content into the generated manifest — only
structural citations. Regenerate with `npm run manifest:generate`.
