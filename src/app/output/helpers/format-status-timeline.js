// -------- Status Timeline Formatter --------

// -- Format ISO date string to short readable form --
function shortDate(isoDate) {
  if (!isoDate) return 'Unknown';
  try {
    const d = new Date(isoDate);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
  } catch {
    return isoDate;
  }
}

// -- Format status + resolution history as a visual timeline --
function formatStatusTimeline(finding) {
  const lines = [];
  const all = [...finding.statusHistory, ...finding.resolutionHistory];
  all.sort((a, b) => new Date(a.date) - new Date(b.date));

  if (all.length === 0) {
    lines.push('  History:      (no status changes recorded)');
    if (finding.changelogError) {
      lines.push(`  Warning:      Changelog fetch failed: ${finding.changelogError}`);
    }
    return lines.join('\n');
  }

  lines.push('  History:');
  for (const c of all) {
    const date = shortDate(c.date);
    const field = c.field.charAt(0).toUpperCase() + c.field.slice(1);
    const arrow = c.oldValue ? `${c.oldValue} -> ${c.newValue}` : c.newValue;
    lines.push(`    ${date}  ${field}: ${arrow}  (by ${c.user})`);
  }

  if (finding.changelogError) {
    lines.push(`  Warning:      Changelog fetch failed: ${finding.changelogError}`);
  }

  return lines.join('\n');
}

module.exports = { formatStatusTimeline };
