<!-- generated-by: gsd-doc-writer -->
# Development

This guide covers everything a developer needs to understand the project structure, run the tool locally, build binaries, and add new features.

---

## Local Setup

### Prerequisites

- **Node.js >= 20** — required for `--experimental-sea-config` SEA support
- **npx** — used by the build scripts to invoke `postject` for SEA blob injection
- **codesign** (macOS only) — required for binary signing; available in Xcode Command Line Tools

### Running from Source

There is no package manager or install step. Clone the repository and run directly with Node.js:

```bash
git clone <repository-url>
cd pipeline_enriched_data
```

Create a credentials file in the project root:

```bash
# sonarqube_credentials.json
{
  "sonar_url": "http://your-sonarqube-server:8998",
  "sonar_token": "squ_your_token_here"
}
```

Run the tool directly:

```bash
node src/main.js -p <project-key>
```

For help and a full list of flags:

```bash
node src/main.js --help
```

See [docs/CONFIGURATION.md](CONFIGURATION.md) for the full flags reference and credential file format.

---

## Build Commands

There is no `package.json` and no npm scripts. All build operations are plain Bash scripts in the `build/` directory.

| Command | Description |
|---|---|
| `bash build/build.sh` | Bundle all source modules, generate a SEA blob, and produce a single binary for the current platform at `dist/sonarqube-enricher` |
| `bash build/build-all.sh` | Run the full cross-platform build for all six targets: `darwin-arm64`, `darwin-x64`, `linux-arm64`, `linux-x64`, `win-arm64`, `win-x64` |
| `node build/bundle.js` | Bundle step only — resolves all local `require()` calls and writes `dist/bundle.js`. Run this to verify bundling without producing a binary |

### Build Pipeline Explained

The build process follows five steps (as printed during `build/build.sh`):

1. **Bundle** — `node build/bundle.js` walks the module graph starting from `src/main.js`, inlines all local `require()` calls, and writes a single self-contained `dist/bundle.js`. Node.js built-in modules (`fs`, `http`, `https`, `path`) are not bundled — they remain live references.

2. **Generate SEA blob** — `node --experimental-sea-config build/sea-config.json` reads `dist/bundle.js` (as configured in `build/sea-config.json`) and writes the Node.js SEA preparation blob to `dist/sea-prep.blob`.

3. **Copy Node.js binary** — A copy of the host's `node` binary is made at `dist/sonarqube-enricher`. For the cross-platform build, target-specific Node.js binaries are downloaded from `nodejs.org/dist/` and cached in `dist/.node-cache/`.

4. **Remove code signature** (macOS only) — `codesign --remove-signature` strips the existing Apple signature so that `postject` can modify the binary.

5. **Inject and re-sign** — `npx postject` injects the SEA blob into the binary using the `NODE_SEA_BLOB` fuse sentinel. On macOS, `codesign --sign -` re-signs the resulting binary with an ad-hoc signature.

---

## Code Style

This project has no linter or formatter configuration file. The following conventions are applied consistently throughout the source and must be followed when adding new code.

### File and Folder Naming

- All file and folder names use **kebab-case** (e.g., `parse-args.js`, `format-finding-row.js`, `fetch-changelog/`).
- Folders are named after their concern or action (e.g., `export-findings/`, `fetch-changelog/`, `enrich-findings/`).
- Each folder contains a `handler.js` for its primary logic, a `helpers/` subfolder for single-purpose helper functions, and nothing else.

### File Size

- Every file should do one thing. Aim to keep files under 50 lines. If a file grows beyond that, extract logic into named helper files inside a `helpers/` subfolder.

### Code Formatting

- Indentation: **2 spaces**.
- Semicolons at statement ends (the codebase uses them consistently — maintain this convention).
- Use **section header comments** to divide a file into logical zones:
  ```javascript
  // -------- Section Name --------
  ```
- Use **inline comments** to explain the intent of non-obvious lines.
- Use `const` everywhere. Avoid `let` unless reassignment is genuinely required.

### Module Pattern

Every module follows this exact shape:

```javascript
// -------- Module Purpose --------

// -- Description of what the function does --
function myFunction(arg) {
  // ...
}

module.exports = { myFunction };
```

- One exported function per file.
- CommonJS `require` / `module.exports` — no ES module syntax (`import`/`export`).
- No third-party dependencies. Only Node.js standard library modules (`fs`, `path`, `http`, `https`) and local `require()` calls.

### Error Handling

- Throw `ValidationError` (from `src/app/errors/validation-error.js`) for CLI argument failures.
- Throw `ApiError` (from `src/app/errors/api-error.js`) for HTTP and network failures.
- Never throw raw `Error` objects from handler or helper code — use one of the two named error types.
- Per-finding changelog failures must not abort the pipeline. Catch the error locally and return `{ changes: [], error: error.message }`.

---

## Branch Conventions

No branch naming convention is documented in the repository. A sensible default to follow:

| Branch type | Pattern | Example |
|---|---|---|
| Feature | `feat/<short-description>` | `feat/add-severity-filter` |
| Bug fix | `fix/<short-description>` | `fix/timeout-not-respected` |
| Documentation | `docs/<short-description>` | `docs/update-configuration` |

The default branch is `main`.

---

## PR Process

1. Fork the repository and create a feature branch from `main`.
2. Make all changes following the code style conventions above.
3. Test the changed code path manually against a live SonarQube instance or with mocked data (see [docs/TESTING.md](TESTING.md) for guidance).
4. Ensure the build still produces a valid binary: `bash build/build.sh`.
5. Open a pull request against `main` with a clear description of what changed and why.

---

## Adding a New Feature

The project follows a strict folder-centric architecture. Every new capability belongs in its own folder with its own handler. The steps below describe where new code goes.

### Adding a New SonarQube API Call

1. Create a new subfolder under `src/app/sonarqube/`:

   ```
   src/app/sonarqube/my-new-operation/
     handler.js
     helpers/
       my-specific-helper.js    (only if needed)
   ```

2. Write the `handler.js` following the module pattern — one exported async function, uses `makeRequest` from `src/app/http/make-request.js`.

3. Import and call the new handler from `src/app/setup.js` in the correct position in the pipeline sequence.

### Adding a New Output Format

1. Add the new format name to the `validFormats` array in `src/app/cli/validate-args.js`.

2. Add a new branch in `src/app/output/format-report.js` to handle the new format value.

3. Create any new formatter helpers in `src/app/output/helpers/` — one function per file, one file per helper.

### Adding a New CLI Flag

1. Add the short and long flag names to the `FLAG_MAP` object in `src/app/cli/parse-args.js`.

2. If the flag is required, add a validation check in `src/app/cli/validate-args.js` that throws a `ValidationError` when it is absent.

3. Map the parsed value into the `config` object constructed in `src/app/setup.js`.

4. Update the help text in `src/app/cli/print-help.js`.

---

## Project Structure Quick Reference

```
pipeline_enriched_data/
  src/
    main.js                              Entry point — calls run() and handles top-level errors
    app/
      setup.js                           Orchestrator — runs the three-step pipeline
      cli/
        parse-args.js                    Parses process.argv and credentials file
        validate-args.js                 Validates required fields; throws ValidationError
        print-help.js                    Prints usage text to stdout
      errors/
        api-error.js                     Named error for HTTP/API failures (carries statusCode)
        validation-error.js              Named error for CLI argument failures
      http/
        make-request.js                  Authenticated HTTP GET client (stdlib only, 30s timeout)
        helpers/
          build-auth-header.js           Encodes token as Basic Auth header
          parse-json-response.js         Buffers response stream and parses JSON
      sonarqube/
        export-findings/
          handler.js                     Calls api/projects/export_findings
        fetch-changelog/
          handler.js                     Calls api/issues/changelog for one issue
          helpers/
            parse-changelog-diffs.js     Flattens and sorts raw changelog diff entries
        enrich-findings/
          handler.js                     Merges changelog data into each finding
      output/
        format-report.js                 Dispatches to JSON or table formatter
        helpers/
          format-finding-row.js          Renders one finding as a labelled text block
          format-status-timeline.js      Renders status/resolution change history
          format-epoch-date.js           Converts ISO/epoch-ms timestamps to readable form
          truncate-text.js               Truncates strings with ellipsis
  build/
    bundle.js                            Custom module bundler (stdlib only)
    sea-config.json                      Node.js SEA config (entry: dist/bundle.js)
    build.sh                             Single-platform build script (5 steps)
    build-all.sh                         Cross-platform build for all 6 targets
    helpers/
      download-node.sh                   Downloads target Node.js binary from nodejs.org
      inject-sea.sh                      Injects SEA blob into a binary via postject
  dist/                                  Generated — do not edit manually
    bundle.js                            Bundled source
    sea-prep.blob                        SEA preparation blob
    sonarqube-enricher-*                 Standalone binaries
```

See [docs/ARCHITECTURE.md](ARCHITECTURE.md) for a deeper explanation of the component relationships and data flow.
