import { z } from 'zod';

/**
 * Reusable primitive schemas matching OLMS validation rules
 */
export const positiveIdSchema = z.coerce
  .number()
  .int('Must be an integer')
  .positive('Must be a positive integer');

export const requiredStringSchema = (label = 'Field') =>
  z.string({ required_error: `${label} is required.` })
    .trim()
    .min(1, `${label} is required.`);

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/, 'Enter a valid email.');

export const passwordSchema = z
  .string()
  .min(8, 'Password needs at least 8 characters.');

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^[0-9+\- ]{7,20}$/, 'Enter a valid phone number.');

export const priceSchema = z.coerce
  .number()
  .gt(0, 'Price must be above 0 and at most RM 1,000,000.')
  .lte(1000000, 'Price must be above 0 and at most RM 1,000,000.')
  .transform((val) => Math.round(val * 100) / 100)
  .refine((val) => val >= 0.01, 'Minimum price is RM 0.01.');

export const stockSchema = z.coerce
  .string()
  .regex(/^[0-9]+$/, 'Stock must be a whole number, 0 or more.')
  .transform((val) => Number(val))
  .refine((val) => Number.isSafeInteger(val), 'Stock is too large.');

export const accountStatusEnum = z.enum(['Pending', 'Approved', 'Rejected'], {
  errorMap: () => ({ message: 'Invalid seller status.' })
});

export const orderStatusEnum = z.enum([
  'Pending',
  'Paid',
  'Processing',
  'Shipped',
  'Completed',
  'Cancelled'
]);

export const paymentStatusEnum = z.enum(['Success', 'Failed'], {
  errorMap: () => ({ message: 'Choose a simulation result.' })
});

export const roleEnum = z.enum(['Admin', 'Seller', 'Customer'], {
  errorMap: () => ({ message: 'Select Customer or Seller.' })
});

/**
 * Entity / Model Schemas
 */
export const userSchema = z.object({
  userId: positiveIdSchema,
  name: requiredStringSchema('Name'),
  email: emailSchema,
  password: passwordSchema.optional(),
  passwordHash: z.string().optional()
});

export const customerSchema = userSchema.extend({
  role: z.literal('Customer').default('Customer'),
  phone: phoneSchema,
  address: requiredStringSchema('Address')
});

export const sellerSchema = userSchema.extend({
  role: z.literal('Seller').default('Seller'),
  accountStatus: accountStatusEnum.default('Pending')
});

export const adminSchema = userSchema.extend({
  role: z.literal('Admin').default('Admin')
});

export const categorySchema = z.object({
  categoryId: positiveIdSchema,
  categoryName: requiredStringSchema('Category name')
});

export const productSchema = z.object({
  productId: positiveIdSchema,
  productName: requiredStringSchema('Product name'),
  price: priceSchema,
  stockQuantity: stockSchema,
  categoryId: positiveIdSchema,
  sellerId: positiveIdSchema
});

export const cartItemSchema = z.object({
  productId: positiveIdSchema,
  quantity: positiveIdSchema
});

export const cartSchema = z.object({
  cartId: z.coerce.number().int().nonnegative(),
  customerId: positiveIdSchema,
  items: z.array(cartItemSchema).default([])
});

export const orderItemSchema = z.object({
  productId: positiveIdSchema,
  productName: requiredStringSchema('Product name'),
  price: priceSchema,
  quantity: positiveIdSchema
});

export const orderSchema = z.object({
  orderId: positiveIdSchema,
  customerId: positiveIdSchema,
  sellerId: positiveIdSchema,
  orderDate: z.string().datetime().or(z.string()),
  items: z.array(orderItemSchema).min(1, 'Order must contain at least one item.'),
  address: requiredStringSchema('Address'),
  totalAmount: z.number().positive(),
  orderStatus: orderStatusEnum.default('Pending')
});

export const paymentSchema = z.object({
  paymentId: positiveIdSchema,
  orderId: positiveIdSchema,
  amount: z.number().positive('Invalid payment amount.'),
  paymentStatus: paymentStatusEnum,
  paymentDate: z.string().datetime().or(z.string())
});

/**
 * Form / Request Body Schemas
 */
export const loginRequestSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required.')
});

export const registerRequestSchema = z.object({
  role: z.enum(['Customer', 'Seller'], {
    errorMap: () => ({ message: 'Select Customer or Seller.' })
  }),
  name: requiredStringSchema('Name'),
  email: emailSchema,
  password: passwordSchema,
  phone: z.string().optional(),
  address: z.string().optional()
}).superRefine((data, ctx) => {
  if (data.role === 'Customer') {
    if (!data.phone || !/^[0-9+\- ]{7,20}$/.test(data.phone.trim())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['phone'],
        message: 'Enter a valid phone number.'
      });
    }
    if (!data.address || !data.address.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['address'],
        message: 'Address is required.'
      });
    }
  }
});

export const profileUpdateRequestSchema = z.object({
  name: requiredStringSchema('Name'),
  email: emailSchema,
  password: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional()
}).superRefine((data, ctx) => {
  if (data.password && data.password.length > 0 && data.password.length < 8) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['password'],
      message: 'Password needs at least 8 characters.'
    });
  }
});

export const updateCartRequestSchema = z.object({
  productId: positiveIdSchema,
  quantity: z.coerce.number().int().nonnegative('Quantity must be 0 or more.'),
  operation: z.enum(['add', 'set']).optional()
});

export const makePaymentRequestSchema = z.object({
  outcome: paymentStatusEnum
});

export const updateOrderStatusRequestSchema = z.object({
  orderStatus: orderStatusEnum
});

/**
 * Helper middleware / validation utility
 * Validates data against a schema and throws formatted error or returns parsed data.
 */
export function validate(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstError = result.error.errors[0]?.message || 'Validation failed';
    const error = new Error(firstError);
    error.issues = result.error.errors;
    throw error;
  }
  return result.data;
}

