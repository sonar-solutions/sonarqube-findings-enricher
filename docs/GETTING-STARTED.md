<!-- generated-by: gsd-doc-writer -->
# Getting Started

This guide walks you through everything you need to run the SonarQube Findings Enricher for the first time, whether you use a pre-built binary or run from source.

---

## Prerequisites

### Using a pre-built binary

No prerequisites. The binaries in `dist/` are fully self-contained Node.js Single Executable Applications — no Node.js installation is required on the target machine.

### Running from source

| Requirement | Version | Notes |
|---|---|---|
| Node.js | >= 20 | Required for `--experimental-sea-config` SEA support |
| npx | Bundled with Node.js >= 20 | Only needed if building a binary (`build/build.sh`) |
| codesign | macOS only | Available in Xcode Command Line Tools; required for binary signing during builds |

Check your Node.js version:

```bash
node --version
```

If your version is below 20, update via [nodejs.org](https://nodejs.org) or a version manager such as `nvm`.

---

## Installation Steps

### Option A — Use a pre-built binary (recommended)

The `dist/` directory contains binaries for all supported platforms. No cloning or installation step is needed beyond making the binary executable.

1. Pick the binary for your platform:

   | Platform | Binary |
   |---|---|
   | macOS (Apple Silicon) | `dist/sonarqube-enricher-darwin-arm64` |
   | macOS (Intel) | `dist/sonarqube-enricher-darwin-x64` |
   | Linux (ARM64) | `dist/sonarqube-enricher-linux-arm64` |
   | Linux (x64) | `dist/sonarqube-enricher-linux-x64` |
   | Windows (ARM64) | `dist/sonarqube-enricher-win-arm64.exe` |
   | Windows (x64) | `dist/sonarqube-enricher-win-x64.exe` |

2. Make it executable (macOS / Linux):

   ```bash
   chmod +x dist/sonarqube-enricher-darwin-arm64
   ```

3. Optionally copy it to a directory on your `$PATH` so it is available system-wide:

   ```bash
   cp dist/sonarqube-enricher-darwin-arm64 /usr/local/bin/sonarqube-enricher
   ```

### Option B — Run from source

1. Clone or download this repository and enter the project directory:

   ```bash
   git clone <repository-url> pipeline_enriched_data
   cd pipeline_enriched_data
   ```

2. Confirm Node.js >= 20 is available:

   ```bash
   node --version
   # Expected: v20.x.x or higher
   ```

3. No `npm install` or package manager step is needed — the tool uses Node.js stdlib only and has zero third-party dependencies.

---

## First Run

### Step 1 — Create a credentials file

Create `./sonarqube_credentials.json` in the directory where you will run the tool:

```json
{
  "sonar_url": "http://your-sonarqube-host:8998",
  "sonar_token": "squ_yourTokenHere"
}
```

The `sonar_token` is a SonarQube user token generated under **My Account > Security** in the SonarQube UI.

### Step 2 — Run the enricher

Using a pre-built binary:

```bash
./dist/sonarqube-enricher-darwin-arm64 -p my-project-key
```

Using source directly:

```bash
node src/main.js -p my-project-key
```

### Step 3 — Check the output

On success, the tool prints progress to the terminal and writes the report to a file in the current directory:

```
sonarqube-findings-my-project-key.json
```

Open the file to see the enriched findings:

```bash
cat sonarqube-findings-my-project-key.json
```

Each entry in the JSON array is a finding from the SonarQube project, extended with `statusHistory`, `resolutionHistory`, and `fullChangelog` fields from the issue changelog API.

---

## Common Setup Issues

### "Server URL required" or "Auth token required" on startup

The tool could not find a credentials file and no `-s`/`-t` flags were supplied. Check that `./sonarqube_credentials.json` exists in the current working directory and contains valid `sonar_url` and `sonar_token` fields. Alternatively, pass them directly:

```bash
./dist/sonarqube-enricher-darwin-arm64 \
  -p my-project \
  -s http://your-sonarqube-host:8998 \
  -t squ_yourTokenHere
```

### "Invalid server URL" on startup

The value supplied for the server URL could not be parsed as a valid URL. Ensure it includes the protocol (`http://` or `https://`) and the correct port if it is not the default for that protocol.

### "cannot be opened because the developer cannot be verified" (macOS)

macOS Gatekeeper blocks unsigned binaries downloaded from the internet. The binaries in `dist/` are signed with a local ad-hoc signature (`codesign --sign -`) during the build, but this may still trigger on first launch. To allow the binary to run:

```bash
# Remove the quarantine attribute added by macOS
xattr -d com.apple.quarantine dist/sonarqube-enricher-darwin-arm64
```

### Connection errors or timeout (30 s) during findings export

The tool has a fixed 30-second HTTP timeout per request. If your SonarQube server is slow or the findings export is large, verify the server is reachable from your machine:

```bash
curl -u "squ_yourTokenHere:" http://your-sonarqube-host:8998/api/system/status
```

If the server is behind a VPN or proxy, ensure your network connection to it is active.

### Individual changelog fetch warnings in the output

If the tool prints warnings such as `Warning:      Changelog fetch failed: <error message>`, it means the changelog API returned an error for that specific finding. The report is still written — the affected findings will include a `changelogError` field instead of changelog data. This is non-fatal by design.

---

## Next Steps

- See **[docs/CONFIGURATION.md](CONFIGURATION.md)** for the full list of CLI flags, credentials file options, and output format settings.
- See **[docs/ARCHITECTURE.md](ARCHITECTURE.md)** for how the three-stage pipeline works and how the source is structured.
- See **[docs/DEVELOPMENT.md](DEVELOPMENT.md)** for how to build binaries from source and contribute changes.
