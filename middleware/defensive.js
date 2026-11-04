/**
 * middleware/defensive.js
 *
 * Defensive programming middleware for OLMS.
 *
 * Covers three concerns:
 *   1. Input sanitisation  — strip/coerce raw request data before it reaches
 *      route handlers or managers.
 *   2. Schema validation   — apply the appropriate Zod request schema and
 *      return a 400 response with a user-friendly message on failure.
 *   3. Output sanitisation — strip internal fields (passwordHash) before any
 *      JSON response leaves the server.
 */

import {
  loginRequestSchema,
  registerRequestSchema,
  profileUpdateRequestSchema,
  updateCartRequestSchema,
  makePaymentRequestSchema,
  updateOrderStatusRequestSchema,
  positiveIdSchema,
  validate
} from '../models/schemas.js';

// ─── 1. Input Sanitisation ────────────────────────────────────────────────────

/**
 * Trim every string value in req.body one level deep.
 * Prevents leading/trailing whitespace from reaching validators or the database.
 */
export function sanitiseBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    }
  }
  next();
}

/**
 * Validate that a route :id parameter is a safe positive integer.
 * Attaches the numeric value to req.numericId so handlers can use it directly.
 */
export function sanitiseId(req, res, next) {
  if (req.params.id !== undefined) {
    const result = positiveIdSchema.safeParse(req.params.id);
    if (!result.success) {
      return res.status(400).render('error', { error: 'Invalid ID parameter.' });
    }
    req.numericId = result.data;
  }
  next();
}

/**
 * Guard against excessively large request bodies (forms only).
 * Express urlencoded already limits to 100 kb by default, but this adds an
 * explicit field-count limit to block HTTP parameter pollution attempts.
 */
export function limitBodyFields(max = 20) {
  return (req, res, next) => {
    if (req.body && Object.keys(req.body).length > max) {
      return res.status(400).render('error', {
        error: 'Too many fields in request.'
      });
    }
    next();
  };
}

// ─── 2. Schema Validation (per-route) ────────────────────────────────────────

/**
 * Factory: returns an Express middleware that validates req.body against the
 * given Zod schema. On failure it re-renders the supplied view with the first
 * error message; on success it replaces req.body with the parsed (coerced &
 * trimmed) data.
 *
 * @param {import('zod').ZodSchema} schema
 * @param {string} errorView  EJS view name to render on failure
 * @param {(req) => object}  [extraLocals]  optional fn to supply extra locals
 */
function validateBody(schema, errorView, extraLocals = () => ({})) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.errors[0]?.message || 'Validation failed.';
      return res.status(400).render(errorView, {
        error: message,
        formData: req.body,
        ...extraLocals(req)
      });
    }
    // Replace raw body with Zod-coerced, trimmed data.
    req.body = result.data;
    next();
  };
}

/** POST /login */
export const validateLogin = validateBody(loginRequestSchema, 'login');

/** POST /register */
export const validateRegister = validateBody(
  registerRequestSchema,
  'register'
);

/** POST /profile */
export const validateProfileUpdate = validateBody(
  profileUpdateRequestSchema,
  'profile',
  (req) => ({ formData: req.body })
);

/** POST /cart/items */
export const validateCartItem = validateBody(
  updateCartRequestSchema,
  'error'
);

/** POST /orders/:id/pay */
export const validatePayment = validateBody(
  makePaymentRequestSchema,
  'error'
);

/** POST /orders/:id/status */
export const validateOrderStatus = validateBody(
  updateOrderStatusRequestSchema,
  'error'
);

// ─── 3. Output Sanitisation ───────────────────────────────────────────────────

/**
 * Strip sensitive internal fields from any object or array before it is
 * serialised.  Called explicitly in the API routes (see api.js) but also
 * exported for use in tests.
 */
const SENSITIVE_FIELDS = ['passwordHash'];

export function sanitiseOutput(data) {
  if (Array.isArray(data)) {
    return data.map(sanitiseOutput);
  }
  if (data !== null && typeof data === 'object') {
    const clean = { ...data };
    for (const field of SENSITIVE_FIELDS) {
      delete clean[field];
    }
    return clean;
  }
  return data;
}

// ─── 4. Error Handling (Delegated to errorHandler.js) ─────────────────────────

export {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  asyncHandler,
  notFoundHandler,
  errorHandler,
  errorHandler as globalErrorHandler
} from './errorHandler.js';

export function appError(message) {
  const err = new Error(message);
  err.isOperational = true;
  err.statusCode = 400;
  return err;
}

