<!-- generated-by: gsd-doc-writer -->

**⚠️ Disclaimer: This is a purely experimental project, not affiliated with SonarSource or SonarQube in any way. Use at your own risk. Please fork and modify for your own needs, but do not use this in production or share it without clearly stating that it's not an official SonarQube product. I am not responsible for any issues that arise from using this tool.**

# SonarQube Findings Enricher

[![Quality gate](https://sonarcloud.io/api/project_badges/quality_gate?project=sonar-solutions_sonarqube-findings-enricher)](https://sonarcloud.io/summary/new_code?id=sonar-solutions_sonarqube-findings-enricher) [![SonarQube Cloud](https://sonarcloud.io/images/project_badges/sonarcloud-light.svg)](https://sonarcloud.io/summary/new_code?id=sonar-solutions_sonarqube-findings-enricher)

A CLI tool that exports all findings from a SonarQube Enterprise project and enriches each finding with its full issue changelog history, then outputs a structured JSON or formatted table report.

## Installation

No package manager installation is required. Pre-built self-contained binaries are available in the `dist/` directory for all supported platforms:

| Platform | Binary |
|----------|--------|
| macOS (Apple Silicon) | `dist/sonarqube-enricher-darwin-arm64` |
| macOS (Intel) | `dist/sonarqube-enricher-darwin-x64` |
| Linux (ARM64) | `dist/sonarqube-enricher-linux-arm64` |
| Linux (x64) | `dist/sonarqube-enricher-linux-x64` |
| Windows (ARM64) | `dist/sonarqube-enricher-win-arm64.exe` |
| Windows (x64) | `dist/sonarqube-enricher-win-x64.exe` |

To run from source instead, Node.js >= 20 is required:

```bash
node src/main.js -p <project-key>
```

## Quick Start

Download the pre-built binary for your platform from the [latest GitHub release](https://github.com/sonar-solutions/sonarqube-findings-enricher/releases/latest), then make it executable:

```bash
chmod +x sonarqube-enricher-*
```

1. Create a credentials file at `./sonarqube_credentials.json`:

```json
{
  "sonar_url": "https://your-sonarqube-server.example.com",
  "sonar_token": "squ_your_token_here"
}
```

2. Run the enricher with your project key:

```bash
./dist/sonarqube-enricher-darwin-arm64 -p my-project-key
```

3. Find the enriched output file:

```bash
# Default output file: sonarqube-findings-<project-key>.json
cat sonarqube-findings-my-project-key.json
```

## Usage

```bash
sonarqube-enricher -p <project-key> [options]
```

### Required

| Flag | Description |
|------|-------------|
| `-p`, `--project <key>` | SonarQube project key |

### Authentication (pick one)

| Flag | Description |
|------|-------------|
| `-c`, `--credentials <path>` | Path to credentials JSON (default: `./sonarqube_credentials.json`) |
| `-s`, `--server <url>` | SonarQube server URL (overrides credentials file) |
| `-t`, `--token <token>` | Auth token (overrides credentials file) |

### Options

| Flag | Description |
|------|-------------|
| `-b`, `--branch <name>` | Branch name (defaults to the project's main branch) |
| `-f`, `--format <fmt>` | Output format: `json` (default) or `table` |
| `-o`, `--output <path>` | Output file path (default: `sonarqube-findings-<project>.json`) |
| `-h`, `--help` | Show help message |

### Examples

```bash
# Basic usage — reads credentials from ./sonarqube_credentials.json
./dist/sonarqube-enricher-darwin-arm64 -p my-project

# Specify a branch
./dist/sonarqube-enricher-darwin-arm64 -p my-project -b develop

# Pass server and token directly
./dist/sonarqube-enricher-darwin-arm64 -p my-project -s https://sonar.example.com -t squ_abc123

# Output as a formatted table to stdout
./dist/sonarqube-enricher-darwin-arm64 -p my-project -f table

# Write JSON output to a custom file path
./dist/sonarqube-enricher-darwin-arm64 -p my-project -o reports/findings.json
```

## How It Works

The tool runs two sequential steps:

1. **Export findings** — Calls the SonarQube Enterprise API (`GET /api/projects/export_findings?project=<key>`) to retrieve all issues and hotspots for the project in a single non-paginated dump.

2. **Enrich with changelogs** — For each finding, calls `GET /api/issues/changelog?issue=<key>` to fetch the full history of status transitions, resolution changes, and other field updates. Changelog fetch failures for individual issues are recorded as warnings and do not abort the report.

The enriched output includes each finding's original fields plus:

- `statusHistory` — all `issueStatus` and `status` field changes with timestamps and actors
- `resolutionHistory` — all `resolution` field changes
- `fullChangelog` — the complete ordered list of every field change recorded

## Building from Source

To build a binary for the current platform:

```bash
bash build/build.sh
```

The output binary is written to `dist/sonarqube-enricher`.

To build binaries for all six supported platform/architecture targets (darwin, linux, win on arm64 and x64):

```bash
bash build/build-all.sh
```

The build process bundles all source modules into a single `dist/bundle.js` file (using the custom bundler at `build/bundle.js`, which has no third-party dependencies), then produces a Node.js Single Executable Application (SEA) blob and injects it into a copy of the local Node.js binary using `postject`.

**Build requirements:**

- Node.js >= 20 (for `--experimental-sea-config` support)
- `npx` (for `postject` injection)
- `codesign` (macOS only — available in Xcode Command Line Tools)
