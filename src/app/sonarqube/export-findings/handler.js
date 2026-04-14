// -------- Export Findings Handler --------
const { makeRequest } = require('../../http/make-request');

// -- Fetch all findings via the Enterprise export_findings API --
// This is a single non-paginated dump of all issues and hotspots
async function exportFindings(config) {
  const params = new URLSearchParams();
  params.set('project', config.projectKey);

  if (config.branch) {
    params.set('branch', config.branch);
  }

  const url = `${config.serverUrl}/api/projects/export_findings?${params}`;
  const response = await makeRequest(url, config.token);

  const findings = response.export_findings || [];
  return findings;
}

module.exports = { exportFindings };
