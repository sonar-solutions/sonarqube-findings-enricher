// -------- JSON Response Parser --------

// -- Collect HTTP response chunks and parse as JSON --
function parseJsonResponse(res) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    res.on('data', (chunk) => chunks.push(chunk));

    res.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf-8');
        const parsed = JSON.parse(raw);
        resolve(parsed);
      } catch (err) {
        reject(new Error(`Failed to parse JSON response: ${err.message}`));
      }
    });

    res.on('error', (err) => reject(err));
  });
}

module.exports = { parseJsonResponse };
