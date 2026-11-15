import assert from 'node:assert/strict';
import test from 'node:test';
import {
  positiveIdSchema, registerRequestSchema, profileUpdateRequestSchema,
  updateCartRequestSchema
} from '../models/schemas.js';
import { Product } from '../models/Product.js';
import { sanitiseOutput } from '../middleware/defensive.js';

test('IDs must be safe positive integers', () => {
  assert.equal(positiveIdSchema.parse('15'), 15);
  for (const value of ['abc', '0', '2.5', '9007199254740992']) {
    assert.equal(positiveIdSchema.safeParse(value).success, false);
  }
});

test('customer registration requires phone and address', () => {
  const customer = {
    role: 'Customer', name: 'Demo Customer', email: ' DEMO@example.test ',
    password: 'DemoPass123!', phone: '0123456789', address: 'Sample address'
  };
  assert.equal(registerRequestSchema.parse(customer).email, 'demo@example.test');
  assert.equal(registerRequestSchema.safeParse({ ...customer, phone: 'short' }).success, false);
  assert.equal(registerRequestSchema.safeParse({ ...customer, address: '' }).success, false);
});

test('profile allows a blank password but rejects a short replacement', () => {
  const profile = { name: 'Demo Customer', email: 'demo@example.test' };
  assert.equal(profileUpdateRequestSchema.safeParse({ ...profile, password: '' }).success, true);
  assert.equal(profileUpdateRequestSchema.safeParse({ ...profile, password: 'short' }).success, false);
});

test('cart quantity, stock and prices respect their limits', () => {
  assert.equal(updateCartRequestSchema.parse({ productId: '1', quantity: '2' }).quantity, 2);
  assert.equal(updateCartRequestSchema.safeParse({ productId: '1', quantity: '-1' }).success, false);
  const product = { productId: 1, productName: 'Rice', categoryId: 1, sellerId: 1,
    stockQuantity: 1, price: '6.506' };
  assert.throws(() => new Product({ ...product, stockQuantity: '1.5' }), /Stock must be a whole number/);
  assert.throws(() => new Product({ ...product, price: '0.001' }), /Minimum price/);
  assert.equal(new Product(product).price, 6.51);
});

test('JSON output omits passwords and hashes at every level', () => {
  const original = { name: 'Demo', password: 'test-only', child: [{ passwordHash: 'test-hash', role: 'Admin' }] };
  assert.deepEqual(sanitiseOutput(original), { name: 'Demo', child: [{ role: 'Admin' }] });
  assert.equal(original.child[0].passwordHash, 'test-hash');
});
