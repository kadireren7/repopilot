# RepoPilot

**Open-source CLI that scores repository ship-readiness and generates missing DevOps baseline files.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

RepoPilot is built for maintainers and platform-minded developers who want fast, consistent repository audits before release.

## Why This Project Exists

Most projects are feature-complete long before they are release-ready.  
RepoPilot closes that gap by checking for production essentials (build, deployment, env hygiene, docs, OSS readiness) and turning findings into actionable fixes.

## Features

- 0-100 **Ship Readiness Score** across five categories
- Fast **repo analysis** (language, framework, package manager, release artifacts)
- **Actionable recommendations** prioritized by impact
- **Generation mode** for missing `Dockerfile`, `.dockerignore`, `.env.example`, and CI workflow
- Clear, structured **terminal reports** designed for maintainers

## How It Works

1. Analyze a local repository path.
2. Detect baseline DevOps and OSS signals.
3. Compute weighted readiness score + category issues.
4. Print recommendations and deployment suggestions.
5. Optionally generate missing infrastructure files.

## Example Output

```text
RepoPilot Report
────────────────────────────────────────
Repository: C:\work\my-service
Ship Readiness: 72/100
Good baseline: a few infrastructure improvements are still needed.

┌──────────────────┬──────────┬──────────────────────────────────────────────────────────────┐
│ Category         │ Score    │ Issues                                                       │
├──────────────────┼──────────┼──────────────────────────────────────────────────────────────┤
│ Build            │ 100/100  │ No issues                                                    │
│ Deployment       │ 50/100   │ Missing Dockerfile for containerized deployment.             │
│ Environment      │ 100/100  │ No issues                                                    │
│ Documentation    │ 100/100  │ No issues                                                    │
│ OpenSource       │ 0/100    │ Missing LICENSE file.                                        │
└──────────────────┴──────────┴──────────────────────────────────────────────────────────────┘

Recommended actions
1. Add Dockerfile [HIGH]
   Action: Create a Dockerfile in the root directory.
2. Add LICENSE [MEDIUM]
   Action: Add an MIT or Apache-2.0 license file.
```

## Installation

```bash
git clone https://github.com/your-org/repopilot.git
cd repopilot
npm install
npm run build
```

Optional global link:

```bash
npm link
```

## Usage

Show help:

```bash
repopilot --help
```

Analyze current repo:

```bash
repopilot analyze .
```

Generate missing files (preview only):

```bash
repopilot fix . --dry-run
```

Generate and write files:

```bash
repopilot fix . --overwrite
```

## Developer Notes

- Current release supports **local path analysis**.
- Remote GitHub URL analysis/fix is intentionally not enabled in this release build.

## Open-Source Readiness

- License: MIT (`LICENSE`)
- Environment template: `.env.example` (placeholders only)
- Contributing guide: `CONTRIBUTING.md`
- Changelog: `CHANGELOG.md`

## Contributing

PRs are welcome. See [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## License

MIT — see [`LICENSE`](./LICENSE).
