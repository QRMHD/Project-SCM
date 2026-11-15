import { z } from 'zod';

/**
 * Reusable primitive schemas matching OLMS validation rules
 */
export const positiveIdSchema = z.coerce
  .string()
  .regex(/^[1-9][0-9]*$/, 'Must be a positive integer')
  .transform(Number)
  .refine(Number.isSafeInteger, 'Number is too large');


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
    if (!phoneSchema.safeParse(data.phone).success) {
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
  if (data.password && !passwordSchema.safeParse(data.password).success) {
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
