// -------- CLI Argument Parser --------
const fs = require('node:fs');
const path = require('node:path');

// -- Flag name mapping --
const FLAG_MAP = {
  '-s': 'serverUrl', '--server': 'serverUrl',
  '-p': 'projectKey', '--project': 'projectKey',
  '-t': 'token', '--token': 'token',
  '-b': 'branch', '--branch': 'branch',
  '-f': 'format', '--format': 'format',
  '-c': 'credentials', '--credentials': 'credentials',
  '-o': 'output', '--output': 'output',
  '-h': 'help', '--help': 'help',
};

// -- Parse process.argv into a config object --
function parseArgs(argv) {
  const args = {};

  for (let i = 0; i < argv.length; i++) {
    const key = FLAG_MAP[argv[i]];
    if (!key) continue;
    if (key === 'help') { args.help = true; continue; }
    args[key] = argv[i + 1] || '';
    i++;
  }

  // -- Load credentials file if no explicit server/token --
  if (!args.serverUrl || !args.token) {
    const credPath = args.credentials || './sonarqube_credentials.json';
    const resolved = path.resolve(credPath);

    if (fs.existsSync(resolved)) {
      const creds = JSON.parse(fs.readFileSync(resolved, 'utf-8'));
      if (!args.serverUrl) args.serverUrl = creds.sonar_url || '';
      if (!args.token) args.token = creds.sonar_token || '';
    }
  }

  return args;
}

module.exports = { parseArgs };
