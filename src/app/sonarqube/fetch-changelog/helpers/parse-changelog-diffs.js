// -------- Changelog Diff Parser --------

// -- Parse raw changelog entries into structured change records --
// Diff key for status changes is "issueStatus" per SonarQube API
function parseChangelogDiffs(changelog) {
  const changes = [];

  for (const entry of changelog) {
    const diffs = entry.diffs || [];

    for (const diff of diffs) {
      changes.push({
        date: entry.creationDate || '',
        user: entry.userName || entry.user || 'system',
        field: diff.key || '',
        oldValue: diff.oldValue || '',
        newValue: diff.newValue || '',
      });
    }
  }

  // -- Sort chronologically --
  changes.sort((a, b) => new Date(a.date) - new Date(b.date));

  return { changes, error: null };
}

module.exports = { parseChangelogDiffs };
