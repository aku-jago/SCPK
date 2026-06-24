const { validationResult } = require('express-validator');

/**
 * Validation Middleware
 * Checks for validation errors from express-validator chains
 * Returns 422 with detailed error messages if validation fails
 */
function validate(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
      value: err.value,
    }));

    return res.status(422).json({
      success: false,
      message: 'Validasi gagal. Periksa data yang Anda masukkan.',
      errors: formattedErrors,
    });
  }

  next();
}

module.exports = { validate };
