/**
 * middleware/errorHandler.js
 * Centralized error-handling classes and Express middleware for OLMS.
 */

// ─── 1. Custom Error Classes ────────────────────────────────────────────────

export class AppError extends Error {
  /**
   * @param {string} message - Human-readable error description
   * @param {number} [statusCode=500] - HTTP status code
   */
  constructor(message, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = true; // Operational error vs programmer/system bug
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = 'Bad Request') {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Please sign in to continue.') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action.') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found.') {
    super(message, 404);
  }
}

// ─── 2. Async Route Handler Wrapper ─────────────────────────────────────────

/**
 * Wraps async route handlers to safely forward rejected promises to next(err).
 * Prevents unhandled promise rejections from terminating the process.
 *
 * @param {Function} fn - Async Express middleware/route handler
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ─── 3. 404 Not Found Middleware ────────────────────────────────────────────

/**
 * Catch-all handler for requests that matched no route.
 * Dispatches a NotFoundError directly to the central errorHandler.
 */
export function notFoundHandler(req, res, next) {
  next(new NotFoundError(`Page not found: ${req.method} ${req.originalUrl}`));
}

// ─── 4. Central Error Handler Middleware ─────────────────────────────────────

/**
 * Central Express error handler (must have 4 arguments).
 * Formats error responses based on content type (JSON for API, EJS for web),
 * maps known library exceptions, logs diagnostics, and strips stack traces in production.
 */
export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const isProduction = process.env.NODE_ENV === 'production';

  let statusCode = err.statusCode || 500;
  let message = err.message || 'An unexpected error occurred.';

  // Map Zod validation errors (e.g. from schema validation)
  if (err.name === 'ZodError') {
    statusCode = 400;
    message = err.errors?.[0]?.message || 'Validation failed.';
  }

  // Map JSON body parser syntax errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON in request body.';
  }

  // Diagnostic logging with timestamp, HTTP method, and path
  const timestamp = new Date().toISOString();
  console.error(`[ERROR] ${timestamp} | ${req.method} ${req.originalUrl} -> ${statusCode}: ${message}`);
  if (!err.isOperational && !isProduction) {
    console.error(err.stack);
  }

  // Determine response format: JSON for /api or fetch/xhr requests, EJS for browser views
  const isApi = req.originalUrl.startsWith('/api') ||
    req.xhr ||
    req.headers.accept?.includes('application/json');

  if (isApi) {
    return res.status(statusCode).json({
      success: false,
      error: message,
      ...(isProduction ? {} : { stack: err.stack })
    });
  }

  // Render HTML error template for browser form submissions and page navigation
  return res.status(statusCode).render('error', {
    error: message
  });
}

