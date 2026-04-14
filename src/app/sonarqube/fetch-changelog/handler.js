// -------- Fetch Issue Changelog Handler --------
const { makeRequest } = require('../../http/make-request');
const { parseChangelogDiffs } = require('./helpers/parse-changelog-diffs');

// -- Fetch the changelog for a single issue key --
// Returns structured change records sorted chronologically
async function fetchChangelog(issueKey, config) {
  const url = `${config.serverUrl}/api/issues/changelog?issue=${encodeURIComponent(issueKey)}`;

  try {
    const response = await makeRequest(url, config.token);
    const changelog = response.changelog || [];
    return parseChangelogDiffs(changelog);
  } catch (error) {
    // -- Don't block the whole report if one changelog fails --
    return { changes: [], error: error.message };
  }
}

module.exports = { fetchChangelog };
