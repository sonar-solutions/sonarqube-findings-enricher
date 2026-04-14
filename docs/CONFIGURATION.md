<!-- generated-by: gsd-doc-writer -->
# Configuration

This tool has no environment variables. All configuration is passed either through CLI flags at invocation time or through a credentials JSON file on disk. There are no config files beyond the optional credentials file, and no `.env` file is used.

---

## CLI Flags

Every invocation of `sonarqube-enricher` accepts the following flags. Flags always take precedence over values loaded from the credentials file.

| Flag (short / long) | Required | Default | Description |
|---|---|---|---|
| `-p` / `--project <key>` | **Required** | — | SonarQube project key to export findings for |
| `-s` / `--server <url>` | Required if no credentials file | — | Base URL of the SonarQube server (e.g., `http://localhost:8998`) |
| `-t` / `--token <token>` | Required if no credentials file | — | SonarQube user token for authentication |
| `-c` / `--credentials <path>` | Optional | `./sonarqube_credentials.json` | Path to a credentials JSON file supplying server URL and token |
| `-b` / `--branch <name>` | Optional | *(main branch)* | Branch name to scope the findings export to |
| `-f` / `--format <fmt>` | Optional | `json` | Output format: `json` or `table` |
| `-o` / `--output <path>` | Optional | `sonarqube-findings-<project-key>.json` | File path to write the report to |
| `-h` / `--help` | Optional | — | Print usage information and exit |

### Required vs optional

The tool will fail at startup with a `ValidationError` if any of the following are absent after resolving both CLI flags and the credentials file:

- **Server URL** (`-s` / `--server` or `sonar_url` in credentials file) — error: `Server URL required. Use -s/--server or provide a credentials file.`
- **Project key** (`-p` / `--project`) — error: `Project key required. Use -p/--project.`
- **Auth token** (`-t` / `--token` or `sonar_token` in credentials file) — error: `Auth token required. Use -t/--token or provide a credentials file.`

The server URL is also validated as a well-formed URL. If it cannot be parsed, the tool exits with: `Invalid server URL: <value>`.

---

## Credentials File

The credentials file is a plain JSON file that supplies the server URL and auth token without requiring them on the command line. This is the recommended approach when running the tool repeatedly against the same SonarQube instance.

### Default location

```
./sonarqube_credentials.json
```

The tool looks for this file in the current working directory unless overridden with `-c`.

### File format

```json
{
  "sonar_url": "http://your-sonarqube-host:8998",
  "sonar_token": "squ_yourTokenHere"
}
```

| Field | Required | Description |
|---|---|---|
| `sonar_url` | Required (if not using `-s`) | Full base URL of the SonarQube server, including protocol and port |
| `sonar_token` | Required (if not using `-t`) | SonarQube user token (generated in SonarQube under My Account > Security) |

### Resolution order

1. If `-s` / `--server` is provided on the command line, it is used and `sonar_url` from the file is ignored.
2. If `-t` / `--token` is provided on the command line, it is used and `sonar_token` from the file is ignored.
3. For any value not provided via flags, the tool attempts to load the credentials file (at the default path or the path given by `-c`).
4. If the file does not exist and the required values are still missing, startup fails with a `ValidationError`.

---

## Output Format

The `-f` / `--format` flag controls how the report is rendered. Two values are accepted:

| Value | Description |
|---|---|
| `json` | Structured JSON array of enriched findings, written with 2-space indentation *(default)* |
| `table` | Human-readable text report with per-finding status timelines, formatted for terminal viewing |

Any other value causes the tool to exit with: `Invalid format "<value>". Use: table, json`.

---

## Output File Path

By default the tool writes its report to a file named after the project key:

```
sonarqube-findings-<project-key>.json
```

Use `-o` / `--output` to choose a different path:

```bash
sonarqube-enricher -p my-project -o /tmp/report.json
sonarqube-enricher -p my-project -f table -o findings.txt
```

---

## Hardcoded Defaults

The following values are fixed in the source code and cannot be changed through configuration:

| Setting | Value | Source file |
|---|---|---|
| HTTP request timeout | 30 seconds | `src/app/http/make-request.js` |
| Authentication scheme | HTTP Basic (token as username, empty password) | `src/app/http/helpers/build-auth-header.js` |
| Findings API endpoint path | `api/projects/export_findings` | `src/app/sonarqube/export-findings/handler.js` |
| Changelog API endpoint path | `api/issues/changelog` | `src/app/sonarqube/fetch-changelog/handler.js` |
| Trailing slash stripping | Server URL trailing slashes are removed before use | `src/app/setup.js` |

---

## Per-Environment Overrides

There are no per-environment configuration files (`.env.development`, `.env.production`, etc.). The tool is environment-agnostic by design — point it at any SonarQube instance using the server URL and token flags or a credentials file.

To target different environments, maintain separate credentials files and select between them with `-c`:

```bash
# Development SonarQube instance
sonarqube-enricher -p my-project -c ./creds-dev.json

# Production SonarQube instance
sonarqube-enricher -p my-project -c ./creds-prod.json
```
