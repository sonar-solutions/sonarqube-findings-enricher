// -------- HTTP Request Module --------
const https = require('https');
const http = require('http');
const { buildAuthHeader } = require('./helpers/build-auth-header');
const { parseJsonResponse } = require('./helpers/parse-json-response');
const { ApiError } = require('../errors/api-error');

// -- Make an authenticated GET request to a SonarQube endpoint --
function makeRequest(fullUrl, token) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(fullUrl);
    const transport = parsed.protocol === 'https:' ? https : http;
    const authHeader = buildAuthHeader(token);

    const options = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
      },
    };

    const req = transport.request(options, (res) => {
      parseJsonResponse(res).then((body) => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          const msg = body.errors?.[0]?.msg || `HTTP ${res.statusCode}`;
          reject(new ApiError(msg, res.statusCode));
          return;
        }
        resolve(body);
      }).catch(reject);
    });

    req.on('error', (err) => {
      reject(new ApiError(`Network error: ${err.message}`, 0));
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new ApiError('Request timed out (30s)', 0));
    });

    req.end();
  });
}

module.exports = { makeRequest };
