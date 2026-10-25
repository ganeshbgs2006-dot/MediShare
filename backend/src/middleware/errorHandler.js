import { env } from '../config/env.js';

export function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    error: `API route not found: ${req.method} ${req.originalUrl}`
  });
}

export function globalErrorHandler(err, req, res, next) {
  console.error('[SERVER ERROR]', err);

  const statusCode = err.statusCode || err.status || 500;
  const response = {
    success: false,
    error: err.message || 'Internal Server Error'
  };

  // Include stack trace only in development
  if (env.isDev) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

