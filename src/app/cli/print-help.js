// -------- Help Text Printer --------

// -- Print CLI usage information --
function printHelp() {
  const text = `
SonarQube Findings Enricher
Export findings via Enterprise API and enrich with issue changelog history.

Usage:
  sonarqube-enricher -p <project-key> [options]

Required:
  -p, --project <key>         SonarQube project key

Authentication (pick one):
  -c, --credentials <path>    Path to credentials JSON (default: ./sonarqube_credentials.json)
                              File format: { "sonar_url": "...", "sonar_token": "..." }
  -s, --server <url>          SonarQube server URL (overrides credentials file)
  -t, --token <token>         Auth token (overrides credentials file)

Options:
  -b, --branch <name>         Branch name (defaults to main branch)
  -f, --format <fmt>          Output format: json (default) or table
  -o, --output <path>         Output file path (default: sonarqube-findings-<project>.json)
  -h, --help                  Show this help message

Examples:
  sonarqube-enricher -p my-project
  sonarqube-enricher -p my-project -b develop
  sonarqube-enricher -p my-project -s https://sonar.example.com -t squ_abc123
  sonarqube-enricher -p my-project -f table
  sonarqube-enricher -p my-project -o custom-output.json
`;
  console.log(text);
}

module.exports = { printHelp };
