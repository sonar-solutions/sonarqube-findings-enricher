// -------- App Setup & Orchestration --------
const fs = require('node:fs');
const { parseArgs } = require('./cli/parse-args');
const { validateArgs } = require('./cli/validate-args');
const { printHelp } = require('./cli/print-help');
const { exportFindings } = require('./sonarqube/export-findings/handler');
const { enrichFindings } = require('./sonarqube/enrich-findings/handler');
const { formatReport } = require('./output/format-report');

// -- Remove trailing slashes without regex --
function trimTrailingSlashes(url) {
  let end = url.length;
  while (end > 0 && url[end - 1] === '/') end--;
  return url.slice(0, end);
}

// -- Main application runner --
async function execute() {
  const args = parseArgs(process.argv.slice(2));

  // -- Handle help flag --
  if (args.help) {
    printHelp();
    return;
  }

  validateArgs(args);

  const config = {
    serverUrl: trimTrailingSlashes(args.serverUrl),
    projectKey: args.projectKey,
    token: args.token,
    branch: args.branch || '',
    format: args.format || 'json',
    outputPath: args.output || `sonarqube-findings-${args.projectKey}.json`,
  };

  console.log(`\nSonarQube Findings Enricher`);
  console.log(`  Server:  ${config.serverUrl}`);
  console.log(`  Project: ${config.projectKey}`);
  if (config.branch) console.log(`  Branch:  ${config.branch}`);
  console.log('');

  // -- Step 1: Export all findings --
  console.log('[1/2] Exporting findings...');
  const findings = await exportFindings(config);
  console.log(`  Found ${findings.length} findings.\n`);

  // -- Step 2: Enrich with changelogs --
  console.log('[2/2] Fetching changelogs...');
  const enriched = await enrichFindings(findings, config);
  console.log('');

  // -- Step 3: Format and output --
  const report = formatReport(enriched, config);

  if (config.outputPath) {
    fs.writeFileSync(config.outputPath, report, 'utf-8');
    console.log(`Report written to: ${config.outputPath}`);
  } else {
    console.log(report);
  }
}

// -- Entry wrapper with error handling --
function run() {
  execute().catch((error) => {
    console.error(`\nError: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { run };
