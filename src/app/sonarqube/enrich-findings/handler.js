// -------- Findings Enrichment Handler --------
const { fetchChangelog } = require('../fetch-changelog/handler');

// -- Enrich each finding with its full changelog history --
async function enrichFindings(findings, config) {
  const enriched = [];
  const total = findings.length;

  for (let i = 0; i < total; i++) {
    const finding = findings[i];
    const changelog = await fetchChangelog(finding.key, config);

    // -- Extract status-specific changes for quick access --
    const statusChanges = changelog.changes.filter(
      (c) => c.field === 'issueStatus' || c.field === 'status'
    );
    const resolutionChanges = changelog.changes.filter(
      (c) => c.field === 'resolution'
    );

    enriched.push({
      ...finding,
      statusHistory: statusChanges,
      resolutionHistory: resolutionChanges,
      fullChangelog: changelog.changes,
      changelogError: changelog.error,
    });

    process.stdout.write(
      `\r  Enriching findings with changelogs... ${i + 1} / ${total}`
    );
  }

  process.stdout.write('\n');
  return enriched;
}

module.exports = { enrichFindings };
