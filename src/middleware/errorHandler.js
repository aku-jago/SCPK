const config = require('../config');

/**
 * Global Error Handler Middleware
 * Catches all unhandled errors and returns structured responses
 */
function errorHandler(err, req, res, _next) {
  console.error('❌ Error:', err.message);

  if (config.nodeEnv === 'development') {
    console.error(err.stack);
  }

  // Prisma known errors
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      message: 'Data sudah ada. Terjadi duplikasi pada field yang harus unik.',
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Data tidak ditemukan.',
    });
  }

  // JWT errors
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: 'Autentikasi gagal.',
    });
  }

  // Default server error
  const statusCode = err.statusCode || 500;
  const message = err.statusCode ? err.message : 'Terjadi kesalahan pada server.';

  res.status(statusCode).json({
    success: false,
    message,
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
}

module.exports = { errorHandler };
