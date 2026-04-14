// -------- Auth Header Builder --------

// -- Build Basic auth header from SonarQube token --
// SonarQube tokens authenticate as username with empty password
function buildAuthHeader(token) {
  const encoded = Buffer.from(`${token}:`).toString('base64');
  return `Basic ${encoded}`;
}

module.exports = { buildAuthHeader };
