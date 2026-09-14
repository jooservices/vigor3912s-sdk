# Workflows

| Workflow          | File                                   | Triggers                               | Purpose                                                                  |
| ----------------- | -------------------------------------- | -------------------------------------- | ------------------------------------------------------------------------ |
| CI                | `.github/workflows/ci.yml`             | `pull_request` on `develop` / `master` | Node quality gate (`npm run ci`) + Gitleaks; final job `Coverage upload` |
| CI post-merge     | `.github/workflows/ci-post-merge.yml`  | `push` to `develop` / `master`         | Sanity re-run of `npm run ci` on integration/production heads            |
| Commitlint        | `.github/workflows/commitlint.yml`     | PR events                              | Validate commit messages                                                 |
| Semantic PR Title | `.github/workflows/semantic-pr.yml`    | PR events                              | Validate PR title shape                                                  |
| CodeQL            | `.github/workflows/codeql.yml`         | PR + push `develop`/`master` + weekly  | Analyze GitHub Actions YAML                                              |
| Workflow audit    | `.github/workflows/workflow-audit.yml` | `.github/**` changes + weekly          | actionlint + zizmor                                                      |
| OpenSSF Scorecard | `.github/workflows/scorecard.yml`      | push `develop` + weekly                | Supply-chain scorecard (badge is branchless)                             |
| Release           | `.github/workflows/release.yml`        | tags `v*`                              | Verify tag is on `master`, run `npm run ci`, create GitHub Release       |

All workflows use GitHub-hosted `ubuntu-latest`. Node is pinned to **24.21.0**.
Codecov / Sonar badges are omitted until those integrations exist.
