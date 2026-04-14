// -------- Entry Point --------
const { run } = require('./app/setup');

// -- Run the application --
run().catch((error) => {
  console.error(`\nError: ${error.message}`);
  process.exit(1);
});
