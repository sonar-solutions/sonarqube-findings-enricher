<!-- generated-by: gsd-doc-writer -->
# Architecture

## System Overview

The SonarQube Findings Enricher is a Node.js command-line tool that operates as a three-stage sequential pipeline. It accepts a SonarQube project key and authentication credentials, then executes three ordered steps: (1) bulk-export all findings from a SonarQube Enterprise server via the `api/projects/export_findings` endpoint, (2) fetch the full issue changelog history for each finding individually via `api/issues/changelog`, and (3) merge the changelog data into each finding and write the enriched result to a file in either JSON or human-readable table format. The tool produces a self-contained standalone binary via Node.js Single Executable Application (SEA) technology, requiring no runtime installation on the target machine.

---

## Component Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                        src/main.js                           │
│                      (Entry Point)                           │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                      src/app/setup.js                        │
│                (Orchestrator / Pipeline Runner)              │
└──────┬───────────┬────────────────────────┬──────────────────┘
       │           │                        │
       ▼           ▼                        ▼
┌──────────┐ ┌─────────────────────┐ ┌─────────────────┐
│   cli/   │ │     sonarqube/      │ │    output/      │
│          │ │                     │ │                 │
│ parse-   │ │  export-findings/   │ │ format-report   │
│ args     │ │  handler            │ │                 │
│          │ │         │           │ │  helpers/       │
│ validate-│ │  enrich-findings/   │ │  format-finding-│
│ args     │ │  handler            │ │  row            │
│          │ │         │           │ │  format-status- │
│ print-   │ │  fetch-changelog/   │ │  timeline       │
│ help     │ │  handler            │ │  format-epoch-  │
└──────────┘ │         │           │ │  date           │
             │  helpers/           │ │  truncate-text  │
             │  parse-changelog-   │ └─────────────────┘
             │  diffs              │
             └─────────┬───────────┘
                       │
                       ▼
             ┌─────────────────────┐
             │       http/         │
             │   make-request      │
             │                     │
             │   helpers/          │
             │   build-auth-header │
             │   parse-json-       │
             │   response          │
             └─────────────────────┘
                       │
                       ▼
             ┌─────────────────────┐
             │   errors/           │
             │   ApiError          │
             │   ValidationError   │
             └─────────────────────┘
```

---

## Data Flow

A typical run of the tool follows this sequence:

1. **CLI parsing** — `src/main.js` invokes `setup.js`, which calls `cli/parse-args.js` to parse `process.argv`. If a credentials file is present at `./sonarqube_credentials.json` (or the path given by `-c`), it is read and used to populate missing `serverUrl` and `token` values.

2. **Validation** — `cli/validate-args.js` checks that `serverUrl`, `projectKey`, and `token` are all present, that the URL is a valid URL, and that the requested output format is one of `json` or `table`. A `ValidationError` is thrown on any failure and surfaces to the user via the top-level catch in `main.js`.

3. **Step 1 — Export findings** — `sonarqube/export-findings/handler.js` calls `GET /api/projects/export_findings?project=<key>` (optionally with `&branch=<name>`). The response body's `export_findings` array is returned as-is. This is a single non-paginated bulk dump — a SonarQube Enterprise Edition endpoint.

4. **Step 2 — Enrich with changelogs** — `sonarqube/enrich-findings/handler.js` iterates over each finding sequentially. For each finding it calls `sonarqube/fetch-changelog/handler.js`, which calls `GET /api/issues/changelog?issue=<key>`. The raw changelog entries are parsed by `fetch-changelog/helpers/parse-changelog-diffs.js` into a flat array of `{ date, user, field, oldValue, newValue }` records sorted chronologically. The enrichment handler then splits those records into `statusHistory` (field is `issueStatus` or `status`), `resolutionHistory` (field is `resolution`), and `fullChangelog` (all records), and merges them onto the original finding object. A per-finding changelog fetch failure is captured non-fatally in `changelogError` and does not stop the pipeline.

5. **Step 3 — Format and write** — `output/format-report.js` receives the enriched findings array. If `config.format` is `json`, it serialises with `JSON.stringify`. If `table`, it builds a human-readable text report using `format-finding-row.js` (field block per finding) and `format-status-timeline.js` (visual status history). The resulting string is written to the output file with `fs.writeFileSync`.

---

## Key Abstractions

| Abstraction | File | Description |
|---|---|---|
| `run()` | `src/app/setup.js` | Top-level async orchestrator; drives the three-step pipeline end-to-end |
| `parseArgs(argv)` | `src/app/cli/parse-args.js` | Maps raw `process.argv` tokens and an optional credentials JSON file into a normalised args object |
| `validateArgs(args)` | `src/app/cli/validate-args.js` | Enforces required fields and value constraints; throws `ValidationError` on failure |
| `exportFindings(config)` | `src/app/sonarqube/export-findings/handler.js` | Single-call bulk fetch of all issues via the SonarQube Enterprise `export_findings` API |
| `fetchChangelog(issueKey, config)` | `src/app/sonarqube/fetch-changelog/handler.js` | Fetches and parses the changelog for one issue; errors are caught and returned as `{ changes: [], error }` |
| `enrichFindings(findings, config)` | `src/app/sonarqube/enrich-findings/handler.js` | Loops over all findings, fetches each changelog, and returns a new array with `statusHistory`, `resolutionHistory`, `fullChangelog`, and `changelogError` fields merged in |
| `parseChangelogDiffs(changelog)` | `src/app/sonarqube/fetch-changelog/helpers/parse-changelog-diffs.js` | Flattens nested SonarQube changelog entries (`entry.diffs[]`) into a flat sorted `changes` array |
| `makeRequest(url, token)` | `src/app/http/make-request.js` | Promise-based authenticated HTTP/HTTPS GET using Node.js stdlib only; 30-second timeout; throws `ApiError` on non-2xx |
| `formatReport(findings, config)` | `src/app/output/format-report.js` | Dispatches to JSON serialisation or table rendering based on `config.format` |
| `ApiError` | `src/app/errors/api-error.js` | Custom error carrying `statusCode`; thrown by the HTTP layer on network and API failures |
| `ValidationError` | `src/app/errors/validation-error.js` | Custom error thrown by the CLI validator; surfaces to user as a top-level message |

---

## Directory Structure Rationale

```
pipeline_enriched_data/
  src/
    main.js                          Entry point — bootstraps and calls run()
    app/
      setup.js                       Orchestrator — wires CLI, sonarqube, and output together
      cli/
        parse-args.js                Parses process.argv and credential file
        validate-args.js             Validates required fields and format constraints
        print-help.js                Prints usage text to stdout
      errors/
        api-error.js                 Custom error for HTTP/API failures
        validation-error.js          Custom error for CLI argument failures
      http/
        make-request.js              Core HTTP client (stdlib only, no third-party deps)
        helpers/
          build-auth-header.js       Encodes SonarQube token as Basic Auth header
          parse-json-response.js     Buffers response stream and parses JSON
      sonarqube/
        export-findings/
          handler.js                 Calls api/projects/export_findings
        fetch-changelog/
          handler.js                 Calls api/issues/changelog for one issue
          helpers/
            parse-changelog-diffs.js Flattens and sorts changelog diff entries
        enrich-findings/
          handler.js                 Merges changelog into each finding
      output/
        format-report.js             Top-level formatter; routes to json or table
        helpers/
          format-finding-row.js      Renders one finding as a labelled text block
          format-status-timeline.js  Renders the status/resolution change history
          format-epoch-date.js       Converts ISO or epoch-ms date strings to readable form
          truncate-text.js           Truncates long strings with ellipsis
  build/
    bundle.js                        Custom module bundler (stdlib only) — resolves local requires
                                     and emits a single dist/bundle.js for SEA ingestion
    sea-config.json                  Node.js SEA config pointing to dist/bundle.js
    build.sh                         Single-platform build: bundle → blob → copy node → inject SEA
    build-all.sh                     Cross-platform build for all 6 target combinations
    helpers/
      download-node.sh               Downloads the correct Node.js binary for a target os/arch
      inject-sea.sh                  Injects the SEA blob into a binary via postject
  dist/
    bundle.js                        Generated — bundled source (do not edit)
    sea-prep.blob                    Generated — SEA preparation blob
    sonarqube-enricher-*             Generated — standalone binaries for each target platform
```

**`src/app/` sub-directory responsibilities:**

- `cli/` — All user-facing CLI concerns. Nothing in this layer touches the SonarQube API.
- `errors/` — Named error types. Keeps error semantics explicit and avoids string comparisons on error names.
- `http/` — The only layer that makes network calls. Isolated so all HTTP concerns (auth, timeout, JSON parsing) live in one place.
- `sonarqube/` — Business logic organised by operation: exporting, fetching changelogs, and enriching. Each sub-folder is a self-contained feature with its own handler and helpers.
- `output/` — All formatting and serialisation logic. Handlers never construct output strings directly.

**`build/`** contains everything needed to produce the distribution binary. The custom bundler (`bundle.js`) is intentionally stdlib-only — no npm or third-party tools are required to bundle and compile the project.
