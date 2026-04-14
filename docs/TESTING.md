<!-- generated-by: gsd-doc-writer -->
# Testing

The SonarQube Findings Enricher has no automated test suite at this time. This document describes the recommended testing approach: what to test, how to exercise each layer manually, what good output looks like, and a suggested structure for adding unit tests when the project is ready for them.

---

## Test Framework and Setup

No test framework is currently configured. The project uses no third-party dependencies (including no test runners), and there are no `test/`, `tests/`, or `__tests__/` directories in the source tree.

When adding tests, the following apply:

- **Runtime requirement:** Node.js >= 20 (required for the `--experimental-sea-config` flag used in the build; same version constraint applies to any test runner used).
- **Recommended approach:** Write tests using only Node.js built-in modules (`node:test` and `node:assert`, introduced in Node.js 18 and stable from Node.js 20) to stay consistent with the project's no-third-party-library policy.
- **No install step required:** The project has no `package.json` and no dependency installation. Tests can be run directly with `node`.

---

## Running Tests

### Current state (no automated tests)

There is no `test` script configured. To verify the tool works end-to-end, run it against a live SonarQube instance:

```bash
node src/main.js -p <project-key> -s http://localhost:8998 -t <your-token>
```

Or using a pre-built binary:

```bash
./dist/sonarqube-enricher-darwin-arm64 -p <project-key>
```

### If unit tests are added

Using Node.js built-in test runner (Node.js >= 20):

```bash
# Run all test files
node --test

# Run a specific test file
node --test src/app/cli/parse-args.test.js

# Run with verbose output
node --test --reporter=spec
```

---

## Manual Testing Guide

The pipeline has three stages and six independently testable units. Test them in the order below — earlier layers are prerequisites for later ones.

### 1. CLI argument parsing (`src/app/cli/parse-args.js`)

**What to test:**

| Scenario | Command | Expected result |
|---|---|---|
| All flags provided | `node src/main.js -p key -s http://host -t token` | Runs normally |
| Credentials file used | `node src/main.js -p key` (with valid `./sonarqube_credentials.json`) | Reads URL and token from file |
| Custom credentials path | `node src/main.js -p key -c ./creds-dev.json` | Reads from specified file |
| Help flag | `node src/main.js -h` | Prints usage and exits cleanly (exit code 0) |
| Unknown flag | `node src/main.js --unknown value -p key` | Flag is silently ignored; run continues |

**Credentials file format for manual tests:**

```json
{
  "sonar_url": "http://localhost:8998",
  "sonar_token": "squ_yourTokenHere"
}
```

---

### 2. Validation (`src/app/cli/validate-args.js`)

**What to test:**

| Scenario | Command | Expected error message |
|---|---|---|
| Missing server URL | `node src/main.js -p key -t token` (no credentials file) | `Server URL required. Use -s/--server or provide a credentials file.` |
| Missing project key | `node src/main.js -s http://host -t token` | `Project key required. Use -p/--project.` |
| Missing auth token | `node src/main.js -p key -s http://host` (no credentials file) | `Auth token required. Use -t/--token or provide a credentials file.` |
| Invalid server URL | `node src/main.js -p key -s not-a-url -t token` | `Invalid server URL: not-a-url` |
| Invalid format | `node src/main.js -p key -f xml` | `Invalid format "xml". Use: table, json` |

All validation failures exit with a non-zero exit code and print `Error: <message>` to stderr.

---

### 3. HTTP layer (`src/app/http/make-request.js`)

The HTTP client uses only Node.js stdlib (`http`/`https`). Test the following behaviours against a real or mock server:

| Scenario | How to trigger | Expected behaviour |
|---|---|---|
| Successful 2xx response | Valid credentials and project | Returns parsed JSON body |
| 401 Unauthorized | Wrong token | Throws `ApiError` with `statusCode: 401` and SonarQube error message |
| 404 Not Found | Non-existent project key | Throws `ApiError` with `statusCode: 404` |
| Network unreachable | Use `-s http://127.0.0.1:9` (no server at that port) | Throws `ApiError` with message `Network error: connect ECONNREFUSED` |
| Request timeout | Use a server that hangs (e.g., `nc -l 9999`) | Throws `ApiError` with message `Request timed out (30s)` after 30 seconds |

**Auth header sanity check** (`src/app/http/helpers/build-auth-header.js`):

The tool authenticates using HTTP Basic with the SonarQube token as the username and an empty password. Verify the header is correct by inspecting a captured request:

```
Authorization: Basic <base64 of "squ_yourToken:">
```

To decode manually:

```bash
node -e "console.log(Buffer.from('Basic ', '').toString())"
# Or decode the value after 'Basic ':
node -e "console.log(Buffer.from('<encoded-value>', 'base64').toString())"
```

---

### 4. Findings export (`src/app/sonarqube/export-findings/handler.js`)

This module calls `GET /api/projects/export_findings?project=<key>`.

**What to verify:**

- The response's `export_findings` array is returned directly.
- If the project has a branch, pass `-b <branch>` and confirm the request URL includes `&branch=<name>`.
- If the API returns an empty `export_findings` array, the tool should print `Found 0 findings.` and write an empty JSON array `[]` to the output file.

```bash
# Verify the output file is valid JSON
node -e "const f = require('fs'); JSON.parse(f.readFileSync('sonarqube-findings-<project>.json', 'utf-8')); console.log('Valid JSON');"
```

---

### 5. Changelog fetch and enrichment (`src/app/sonarqube/fetch-changelog/` and `src/app/sonarqube/enrich-findings/`)

The enrichment step fetches one changelog per finding. Key behaviours to verify:

| Scenario | How to trigger | Expected behaviour |
|---|---|---|
| Finding with changelog history | Any finding whose status changed | `statusHistory`, `resolutionHistory`, and `fullChangelog` are non-empty arrays |
| Finding with no history | A newly created, untouched finding | All three history arrays are empty; `changelogError` is `null` |
| Changelog API failure for one finding | Temporarily block `api/issues/changelog` for one key (firewall rule or mock) | `changelogError` is set to the error message; other findings are unaffected; pipeline completes |
| Progress display | Run against a project with many findings | Console prints `Enriching findings with changelogs... N / total` and updates in-place |

**Verify the enriched JSON shape:**

```json
{
  "key": "AYz...",
  "statusHistory": [
    { "date": "2024-01-15T09:30:00+0000", "user": "alice", "field": "issueStatus", "oldValue": "OPEN", "newValue": "CONFIRMED" }
  ],
  "resolutionHistory": [],
  "fullChangelog": [
    { "date": "2024-01-15T09:30:00+0000", "user": "alice", "field": "issueStatus", "oldValue": "OPEN", "newValue": "CONFIRMED" }
  ],
  "changelogError": null
}
```

---

### 6. Output formatting (`src/app/output/format-report.js`)

**JSON format** (`-f json`, the default):

```bash
node src/main.js -p <key> -f json -o /tmp/test-output.json
# Verify it is valid, parseable JSON
node -e "JSON.parse(require('fs').readFileSync('/tmp/test-output.json', 'utf-8')); console.log('OK');"
```

**Table format** (`-f table`):

```bash
node src/main.js -p <key> -f table -o /tmp/test-output.txt
# Verify the report header and finding blocks are present
head -5 /tmp/test-output.txt
# Expected: first line is a row of '=' characters, second line contains "SONARQUBE FINDINGS REPORT"
```

**Table format — status timeline:**

For findings with history, the table output should contain a `History:` section with lines formatted as:

```
  History:
    2024-01-15 09:30  IssueStatus: OPEN -> CONFIRMED  (by alice)
```

For findings with no history:

```
  History:      (no status changes recorded)
```

---

## Writing New Tests

If automated tests are introduced, the recommended file naming convention and placement:

```
src/
  app/
    cli/
      parse-args.test.js       Unit tests for parseArgs()
      validate-args.test.js    Unit tests for validateArgs()
    http/
      make-request.test.js     Tests for makeRequest() with a local mock server
      helpers/
        build-auth-header.test.js
        parse-json-response.test.js
    sonarqube/
      export-findings/
        handler.test.js
      fetch-changelog/
        handler.test.js
        helpers/
          parse-changelog-diffs.test.js
      enrich-findings/
        handler.test.js
    output/
      format-report.test.js
      helpers/
        format-finding-row.test.js
        format-status-timeline.test.js
        format-epoch-date.test.js
        truncate-text.test.js
```

**Test helper patterns to implement:**

- A `mockServer(port, responses)` helper using `node:http` that maps URL paths to canned JSON responses — allows testing `makeRequest`, `exportFindings`, and `fetchChangelog` without a live SonarQube instance.
- A `makeConfig(overrides)` factory that returns a valid config object with sensible defaults, used across handler tests.

**Example test file structure using `node:test`:**

```javascript
// src/app/cli/validate-args.test.js
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateArgs } = require('./validate-args');
const { ValidationError } = require('../errors/validation-error');

test('throws ValidationError when serverUrl is missing', () => {
  assert.throws(
    () => validateArgs({ projectKey: 'my-project', token: 'token' }),
    (err) => err instanceof ValidationError &&
              err.message === 'Server URL required. Use -s/--server or provide a credentials file.'
  );
});

test('throws ValidationError when serverUrl is not a valid URL', () => {
  assert.throws(
    () => validateArgs({ serverUrl: 'not-a-url', projectKey: 'key', token: 'token' }),
    (err) => err instanceof ValidationError && err.message.startsWith('Invalid server URL')
  );
});

test('does not throw when all required args are valid', () => {
  assert.doesNotThrow(() =>
    validateArgs({ serverUrl: 'http://localhost:8998', projectKey: 'key', token: 'token' })
  );
});
```

---

## Coverage Requirements

No coverage thresholds are configured. No coverage tooling is set up.

When adding tests, the following modules contain the most critical logic and should be prioritised:

| Module | Why it is high priority |
|---|---|
| `src/app/cli/validate-args.js` | Guards all required inputs; incorrect validation causes silent bad runs |
| `src/app/sonarqube/fetch-changelog/helpers/parse-changelog-diffs.js` | Complex data transformation; sorting and flattening bugs produce wrong history |
| `src/app/http/make-request.js` | Error classification (`ApiError` vs network error vs timeout) must be correct |
| `src/app/output/format-report.js` | Both output paths (JSON and table) must be exercised |

---

## CI Integration

A release workflow exists at `.github/workflows/release.yml` for building and publishing SEA binaries. No CI test pipeline is currently configured.

When CI is added, the recommended test job trigger is on push to the main branch and on pull requests, running:

```bash
node --test
```

No external services (SonarQube server) should be required for the unit test suite — all network calls should be intercepted by a local mock server in tests.
