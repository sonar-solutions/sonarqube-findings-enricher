// -------- Report Formatter --------
const { formatFindingRow } = require('./helpers/format-finding-row');
const { formatStatusTimeline } = require('./helpers/format-status-timeline');

// -- Format enriched findings into the requested output format --
function formatReport(findings, config) {
  if (config.format === 'json') {
    return JSON.stringify(findings, null, 2);
  }

  return formatAsTable(findings);
}

// -- Format findings as a readable text report with timelines --
function formatAsTable(findings) {
  const divider = '='.repeat(100);
  const separator = '-'.repeat(100);
  const lines = [];

  lines.push(divider);
  lines.push(`  SONARQUBE FINDINGS REPORT — ${findings.length} findings`);
  lines.push(divider);

  for (const finding of findings) {
    lines.push('');
    lines.push(formatFindingRow(finding));
    lines.push(formatStatusTimeline(finding));
    lines.push(separator);
  }

  return lines.join('\n');
}

module.exports = { formatReport };
