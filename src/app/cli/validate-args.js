// -------- CLI Argument Validator --------
const { ValidationError } = require('../errors/validation-error');

// -- Validate that all required arguments are present and valid --
function validateArgs(args) {
  if (!args.serverUrl) {
    throw new ValidationError(
      'Server URL required. Use -s/--server or provide a credentials file.'
    );
  }

  if (!args.projectKey) {
    throw new ValidationError(
      'Project key required. Use -p/--project.'
    );
  }

  if (!args.token) {
    throw new ValidationError(
      'Auth token required. Use -t/--token or provide a credentials file.'
    );
  }

  // -- Validate URL format --
  try {
    new URL(args.serverUrl);
  } catch {
    throw new ValidationError(`Invalid server URL: ${args.serverUrl}`);
  }

  // -- Validate output format --
  const validFormats = ['table', 'json'];
  const format = args.format || 'table';
  if (!validFormats.includes(format)) {
    throw new ValidationError(
      `Invalid format "${format}". Use: ${validFormats.join(', ')}`
    );
  }
}

module.exports = { validateArgs };
