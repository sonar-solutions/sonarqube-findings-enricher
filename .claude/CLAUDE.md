# Project Directives

## Regression Testing After Every Fix (MANDATORY)

After every code change, you MUST run full verification before reporting the task as complete. This is non-negotiable. Recursively test, verify, and fix until you have a clean pass with no new issues introduced. This applies to all changes you made.

### Verification Loop

1. **Build** — Run `node build/bundle.js` to verify the bundler still produces a valid bundle.
2. **Test against fixture** — Run the tool against any available test fixtures or a live SonarQube instance (using credentials already on disk, if present) to confirm end-to-end behavior is intact.
3. **Check for new issues** — After fixing issues, re-check (e.g. via SonarCloud API, linter, or IDE diagnostics) whether the fix introduced new problems.
4. **Fix and re-verify recursively** — If new issues are found, fix them and repeat the full verification loop. Do not stop until a clean pass is achieved.

This applies to all changes: bug fixes, refactors, feature additions, dependency updates, and build/CI changes. No change is "too small" to skip verification.

### What Counts as Verification

- The bundler (`node build/bundle.js`) completes without errors.
- If a SonarQube/SonarCloud scan is available, all previously passing rules still pass.
- No regressions in CLI behavior (help flag, argument parsing, error handling).
- If the change touches output formatting, verify the output looks correct.

## Never Commit Secrets (MANDATORY)

- **Never commit credentials, tokens, API keys, or secrets** to the repository.
- Do not stage or commit files like `sonarqube_credentials.json`, `.env`, or any file containing tokens.
- If a credentials file is needed for testing, it must be in `.gitignore` and never staged.
- Before any `git add`, verify that no secret-containing files are being staged.
