import {
  loginRequestSchema,
  registerRequestSchema,
  profileUpdateRequestSchema,
  updateCartRequestSchema,
  makePaymentRequestSchema,
  updateOrderStatusRequestSchema,
  positiveIdSchema
} from '../models/schemas.js';
import { BadRequestError } from './errorHandler.js';

/**
 * Trim top-level form strings, preserving the password exactly as entered.
 * Prevents leading/trailing whitespace from reaching validators or the database.
 */
export function sanitiseBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    for (const key of Object.keys(req.body)) {
      if (key !== 'password' && typeof req.body[key] === 'string') {
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
export function sanitiseId(req, res, next, value) {
  const result = positiveIdSchema.safeParse(value);
  if (!result.success) return next(new BadRequestError('Invalid ID parameter.'));
  req.numericId = result.data;
  next();
}

/**
 * Cap the number of top-level body fields after Express parses the request.
 */
export function limitBodyFields(max = 20) {
  return (req, res, next) => {
    if (req.body && Object.keys(req.body).length > max) {
      return next(new BadRequestError('Too many fields in request.'));
    }
    next();
  };
}


function validateBody(schema, formView) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (result.success) {
      req.body = result.data;
      return next();
    }

    const [issue] = result.error.issues;
    const message = issue ? issue.message : 'Validation failed.';
    if (!formView) return next(new BadRequestError(message));

    res.status(400).render(formView, {
      error: message,
      formData: sanitiseOutput(req.body)
    });
  };
}

export const validateLogin = validateBody(loginRequestSchema, 'login');
export const validateRegister = validateBody(registerRequestSchema, 'register');
export const validateProfileUpdate = validateBody(profileUpdateRequestSchema, 'profile');
export const validateCartItem = validateBody(updateCartRequestSchema);
export const validatePayment = validateBody(makePaymentRequestSchema);
export const validateOrderStatus = validateBody(updateOrderStatusRequestSchema);

const SENSITIVE_FIELDS = ['passwordHash', 'password'];

export function sanitiseOutput(data) {
  if (Array.isArray(data)) {
    return data.map(sanitiseOutput);
  }
  if (data !== null && typeof data === 'object') {
    return Object.fromEntries(
      Object.entries(data)
        .filter(([key]) => !SENSITIVE_FIELDS.includes(key))
        .map(([key, value]) => [key, sanitiseOutput(value)])
    );
  }
  return data;
}
