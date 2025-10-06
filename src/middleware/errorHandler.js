/**
 * Global Error Handler Middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);

  // Default error
  let status = err.status || 500;
  let message = err.message || 'Internal Server Error';

  // SerpAPI specific errors
  if (message.includes('SerpAPI Error')) {
    status = 502; // Bad Gateway
  }

  // Network errors
  if (message.includes('Network Error')) {
    status = 503; // Service Unavailable
  }

  // Database errors
  if (err.code === 'ECONNREFUSED') {
    status = 503;
    message = 'Database connection failed';
  }

  // Validation errors
  if (message.includes('required')) {
    status = 400;
  }

  // Send error response
  res.status(status).json({
    success: false,
    error: message,
    status,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
