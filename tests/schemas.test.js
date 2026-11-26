import assert from 'assert';
import {
  positiveIdSchema,
  requiredStringSchema,
  emailSchema,
  passwordSchema,
  phoneSchema,
  priceSchema,
  stockSchema,
  customerSchema,
  sellerSchema,
  adminSchema,
  categorySchema,
  productSchema,
  cartSchema,
  orderSchema,
  paymentSchema,
  loginRequestSchema,
  registerRequestSchema,
  validate
} from '../models/schemas.js';

console.log('Running Zod schema validation tests...');

// 1. Primitive schemas
assert.strictEqual(positiveIdSchema.parse('42'), 42);
assert.throws(() => positiveIdSchema.parse('-5'));
assert.throws(() => positiveIdSchema.parse('0'));
assert.throws(() => positiveIdSchema.parse('abc'));

assert.strictEqual(emailSchema.parse('  User@Example.COM '), 'user@example.com');
assert.throws(() => emailSchema.parse('invalid-email'));

assert.strictEqual(passwordSchema.parse('Secret123!'), 'Secret123!');
assert.throws(() => passwordSchema.parse('short'));

assert.strictEqual(phoneSchema.parse('012-3456789'), '012-3456789');
assert.throws(() => phoneSchema.parse('123')); // too short

assert.strictEqual(priceSchema.parse('19.999'), 20);
assert.throws(() => priceSchema.parse('0'));
assert.throws(() => priceSchema.parse('-10'));

assert.strictEqual(stockSchema.parse('50'), 50);
assert.throws(() => stockSchema.parse('5.5')); // reject decimals

// 2. Entity schemas
const validProduct = productSchema.parse({
  productId: '10',
  productName: '  Organic Apples  ',
  price: '9.99',
  stockQuantity: '100',
  categoryId: '2',
  sellerId: '3'
});
assert.strictEqual(validProduct.productId, 10);
assert.strictEqual(validProduct.productName, 'Organic Apples');
assert.strictEqual(validProduct.price, 9.99);
assert.strictEqual(validProduct.stockQuantity, 100);

// 3. Request / Form schemas
const validLogin = loginRequestSchema.parse({
  email: 'test@olms.test',
  password: 'Password123'
});
assert.strictEqual(validLogin.email, 'test@olms.test');

const validCustomerRegistration = registerRequestSchema.parse({
  role: 'Customer',
  name: 'John Doe',
  email: 'john@example.com',
  password: 'Password123!',
  phone: '0123456789',
  address: '123 Test Street'
});
assert.strictEqual(validCustomerRegistration.role, 'Customer');

// Missing phone for customer should fail refinement
assert.throws(() => {
  registerRequestSchema.parse({
    role: 'Customer',
    name: 'Jane Doe',
    email: 'jane@example.com',
    password: 'Password123!'
  });
});

// 4. validate helper
const validatedData = validate(categorySchema, {
  categoryId: 1,
  categoryName: 'Beverages'
});
assert.strictEqual(validatedData.categoryName, 'Beverages');

assert.throws(() => {
  validate(categorySchema, { categoryId: 1, categoryName: '' });
});

console.log('All Zod schema tests passed successfully!');

