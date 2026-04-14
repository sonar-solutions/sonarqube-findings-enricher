// -------- Validation Error Type --------

// -- Custom error for CLI argument validation failures --
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

module.exports = { ValidationError };
