// -------- Finding Row Formatter --------
const { truncateText } = require('./truncate-text');
const { formatDate } = require('./format-epoch-date');

// -- Format a single finding as a readable text block --
function formatFindingRow(f) {
  const msg = truncateText(f.message, 80);
  const filePath = truncateText(f.path, 60);

  // -- Build severity line from impacts array --
  const impacts = (f.impacts || [])
    .map((i) => `${i.softwareQuality}/${i.severity}`)
    .join(', ') || 'N/A';

  const lines = [
    `  Key:          ${f.key}`,
    `  Rule:         ${f.ruleReference || 'N/A'}`,
    `  Status:       ${f.issueStatus || f.status || 'N/A'}${f.resolution ? ` (${f.resolution})` : ''}`,
    `  Impacts:      ${impacts}`,
    `  Type:         ${f.type || 'ISSUE'}`,
    `  Message:      ${msg}`,
    `  File:         ${filePath}:${f.lineNumber || '?'}`,
    `  Author:       ${f.author || 'N/A'}`,
    `  Assignee:     ${f.assignee || 'N/A'}`,
    `  Clean Code:   ${f.cleanCodeAttribute || 'N/A'} (${f.cleanCodeAttributeCategory || 'N/A'})`,
    `  Tags:         ${f.tags || 'N/A'}`,
    `  Effort:       ${f.effort || 'N/A'}`,
    `  Created:      ${formatDate(f.createdAt)}`,
    `  Updated:      ${formatDate(f.updatedAt)}`,
  ];

  return lines.join('\n');
}

module.exports = { formatFindingRow };
