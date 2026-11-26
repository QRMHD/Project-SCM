import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';

import { required, positiveId, stockValue } from '../models/Validation.js';
import { User } from '../models/User.js';
import { Customer } from '../models/Customer.js';
import { Seller } from '../models/Seller.js';
import { Admin } from '../models/Admin.js';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { Cart } from '../models/Cart.js';
import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { DataStore } from '../services/DataStore.js';
import { PaymentGateway } from '../services/PaymentGateway.js';
import {
  sanitiseBody,
  sanitiseId,
  limitBodyFields,
  sanitiseOutput,
  validateLogin,
  validateRegister
} from '../middleware/defensive.js';
import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  asyncHandler,
  notFoundHandler,
  errorHandler
} from '../middleware/errorHandler.js';
import { flashMiddleware } from '../middleware/flash.js';

let passed = 0;

/**
 * Helper to execute an isolated unit test case and track pass counts.
 * Supports both synchronous and asynchronous test callbacks.
 */
async function unitTest(name, fn) {
  await fn();
  passed += 1;
  console.log('PASS [Unit] ' + name);
}

/**
 * Creates a lightweight mock Express response object to inspect status codes,
 * rendered views, and JSON payloads produced by middleware in isolation.
 */
function createMockRes() {
  return {
    statusCode: 200,
    locals: {},
    rendered: null,
    jsonBody: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    render(view, data) {
      this.rendered = { view, data };
      return this;
    },
    json(body) {
      this.jsonBody = body;
      return this;
    }
  };
}

// ─── 1. Validation Helper Unit Tests ─────────────────────────────────────────

await unitTest('Validation: required() trims valid strings and rejects empty/non-strings', () => {
  assert.strictEqual(required('  Fresh Milk  ', 'Product name'), 'Fresh Milk');
  assert.throws(() => required('   ', 'Name'), /Name is required\./);
  assert.throws(() => required(null, 'Name'), /Name is required\./);
});

await unitTest('Validation: positiveId() accepts positive safe integers and rejects 0, negatives, floats', () => {
  assert.strictEqual(positiveId('7', 'Product ID'), 7);
  assert.throws(() => positiveId(0, 'ID'), /positive integer/);
  assert.throws(() => positiveId(-3, 'ID'), /positive integer/);
  assert.throws(() => positiveId(1.5, 'ID'), /positive integer/);
  assert.throws(() => positiveId('abc', 'ID'), /positive integer/);
});

await unitTest('Validation: stockValue() accepts whole numbers >= 0 and rejects decimals/exponents', () => {
  assert.strictEqual(stockValue(0), 0);
  assert.strictEqual(stockValue('25'), 25);
  assert.throws(() => stockValue('-1'), /whole number/);
  assert.throws(() => stockValue('2.5'), /whole number/);
  assert.throws(() => stockValue('1e5'), /whole number/);
});

// ─── 2. Domain Model Unit Tests ──────────────────────────────────────────────

await unitTest('User & Subclasses: prevents direct User instantiation and hashes passwords securely', () => {
  assert.throws(() => new User({ userId: 1, name: 'Test', email: 'a@b.com', password: 'Password1!' }));

  const admin = new Admin({
    userId: 1,
    name: 'Admin',
    email: 'ADMIN@OLMS.TEST',
    password: 'Password1!'
  });

  // Email must be normalized to lowercase and password stored as salted PBKDF2 hash.
  assert.strictEqual(admin.email, 'admin@olms.test');
  assert(admin.passwordHash.includes(':'));
  assert(!admin.passwordHash.includes('Password1!'));
  assert.strictEqual(admin.login('Password1!'), true);
  assert.strictEqual(admin.login('WrongPass!'), false);
});

await unitTest('Customer & Seller: validates phone format and seller account status enum', () => {
  const customer = new Customer({
    userId: 2,
    name: 'Aisha',
    email: 'aisha@olms.test',
    password: 'Password1!',
    phone: '012-3456789',
    address: '12 Jalan Mawar'
  });
  assert.strictEqual(customer.role, 'Customer');

  assert.throws(() => new Customer({
    userId: 2,
    name: 'Aisha',
    email: 'aisha@olms.test',
    password: 'Password1!',
    phone: '123',
    address: '12 Jalan Mawar'
  }), /valid phone number/);

  const seller = new Seller({
    userId: 3,
    name: 'Mart',
    email: 'mart@olms.test',
    password: 'Password1!'
  });
  assert.strictEqual(seller.accountStatus, 'Pending');

  assert.throws(() => new Seller({
    userId: 3,
    name: 'Mart',
    email: 'mart@olms.test',
    password: 'Password1!',
    accountStatus: 'Banned'
  }), /Invalid seller status/);
});

await unitTest('Product, Category, Cart, Order & Payment: enforces rounding, totals, and bounds', () => {
  const category = new Category({ categoryId: 1, categoryName: 'Drinks' });
  assert.strictEqual(category.categoryName, 'Drinks');

  const product = new Product({
    productId: 1,
    productName: 'Milk',
    price: '6.555',
    stockQuantity: '10',
    categoryId: 1,
    sellerId: 2
  });
  // Price rounds cleanly to 2 decimal places; sub-cent or > 1,000,000 values are rejected.
  assert.strictEqual(product.price, 6.56);
  assert.throws(() => new Product({
    productId: 1,
    productName: 'Tiny',
    price: '0.001',
    stockQuantity: '1',
    categoryId: 1,
    sellerId: 2
  }), /Minimum price/);
  assert.throws(() => new Product({
    productId: 1,
    productName: 'Expensive',
    price: '1000001',
    stockQuantity: '1',
    categoryId: 1,
    sellerId: 2
  }), /at most RM 1,000,000/);

  const cart = new Cart(1, 2, [{ productId: 1, quantity: 3 }]);
  assert.strictEqual(cart.calculateTotal([product]), 19.68);

  const order = new Order(1, 2, 3, [{ productId: 1, productName: 'Milk', price: 6.56, quantity: 2 }], 'Kajang');
  assert.strictEqual(order.totalAmount, 13.12);
  assert.strictEqual(order.orderStatus, 'Pending');

  const payment = new Payment(1, 1, 13.12, 'Success');
  assert.strictEqual(payment.paymentStatus, 'Success');
});

// ─── 3. Services Unit Tests (PaymentGateway & DataStore) ─────────────────────

await unitTest('PaymentGateway: validates positive amount and allowed simulation outcomes', () => {
  const gateway = new PaymentGateway();
  assert.strictEqual(gateway.processPayment(15.5, 'Success'), 'Success');
  assert.strictEqual(gateway.processPayment(15.5, 'Failed'), 'Failed');
  assert.throws(() => gateway.processPayment(0, 'Success'), /Invalid payment amount/);
  assert.throws(() => gateway.processPayment(-10, 'Success'), /Invalid payment amount/);
  assert.throws(() => gateway.processPayment(10, 'Pending'), /simulation result/);
});

await unitTest('DataStore: increments counters, rolls back failed transactions, rejects legacy files', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'olms-unit-'));
  try {
    const dbPath = path.join(tmpDir, 'store.json');
    const store = new DataStore(dbPath);

    assert.strictEqual(store.nextId('order'), 1);
    assert.strictEqual(store.nextId('order'), 2);

    // Commit a category, then force an error in a second transaction to verify rollback.
    store.transaction(() => {
      store.data.categories.push({ categoryId: 1, categoryName: 'Saved' });
    });
    assert.throws(() => {
      store.transaction(() => {
        store.data.categories.push({ categoryId: 2, categoryName: 'ShouldRollback' });
        throw new Error('Simulated failure');
      });
    }, /Simulated failure/);
    assert.strictEqual(store.data.categories.length, 1);

    // Legacy file without 'users' array must throw instead of silently wiping records.
    const legacyPath = path.join(tmpDir, 'legacy.json');
    fs.writeFileSync(legacyPath, JSON.stringify({ products: [{ id: 1 }] }));
    assert.throws(() => new DataStore(legacyPath), /Old data format/);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

// ─── 4. Defensive Middleware Unit Tests ──────────────────────────────────────

await unitTest('defensive.js: sanitiseBody trims strings and sanitiseOutput strips passwordHash', () => {
  const req = { body: { name: '  Aisha  ', email: ' aisha@olms.test ', count: 5 } };
  let calledNext = false;
  sanitiseBody(req, createMockRes(), () => { calledNext = true; });
  assert.strictEqual(calledNext, true);
  assert.strictEqual(req.body.name, 'Aisha');
  assert.strictEqual(req.body.email, 'aisha@olms.test');
  assert.strictEqual(req.body.count, 5);

  const clean = sanitiseOutput([
    { userId: 1, name: 'Admin', passwordHash: 'salt:secret' }
  ]);
  assert.strictEqual(clean[0].passwordHash, undefined);
  assert.strictEqual(clean[0].name, 'Admin');
});

await unitTest('defensive.js: sanitiseId and limitBodyFields block malformed IDs and field flooding', () => {
  const badIdReq = { params: { id: 'abc' } };
  const badIdRes = createMockRes();
  sanitiseId(badIdReq, badIdRes, () => assert.fail('Should not call next for invalid ID'));
  assert.strictEqual(badIdRes.statusCode, 400);
  assert.strictEqual(badIdRes.rendered.data.error, 'Invalid ID parameter.');

  const goodIdReq = { params: { id: '42' } };
  sanitiseId(goodIdReq, createMockRes(), () => {});
  assert.strictEqual(goodIdReq.numericId, 42);

  // Build payload exceeding limitBodyFields(3) to simulate HTTP parameter pollution.
  const floodReq = { body: { a: 1, b: 2, c: 3, d: 4 } };
  const floodRes = createMockRes();
  limitBodyFields(3)(floodReq, floodRes, () => assert.fail('Should block flooded fields'));
  assert.strictEqual(floodRes.statusCode, 400);
  assert.strictEqual(floodRes.rendered.data.error, 'Too many fields in request.');
});

await unitTest('defensive.js: validateRegister & validateLogin handle invalid inputs via Zod issues', () => {
  // Verifies fix for Zod v3/v4 error.issues extraction instead of crashing on undefined.errors[0].
  const badRegReq = {
    body: { role: 'Customer', name: 'John', email: 'not-an-email', password: '123' }
  };
  const badRegRes = createMockRes();
  validateRegister(badRegReq, badRegRes, () => assert.fail('Invalid registration must fail'));
  assert.strictEqual(badRegRes.statusCode, 400);
  assert.strictEqual(badRegRes.rendered.view, 'register');
  assert.strictEqual(badRegRes.rendered.data.error, 'Enter a valid email.');

  const badLoginReq = { body: { email: 'user@olms.test', password: '' } };
  const badLoginRes = createMockRes();
  validateLogin(badLoginReq, badLoginRes, () => assert.fail('Empty password must fail'));
  assert.strictEqual(badLoginRes.statusCode, 400);
  assert.strictEqual(badLoginRes.rendered.view, 'login');
  assert.strictEqual(badLoginRes.rendered.data.error, 'Password is required.');
});

// ─── 5. Error Handler & Flash Middleware Unit Tests ──────────────────────────

await unitTest('errorHandler.js: AppError classes, asyncHandler, notFoundHandler, and errorHandler', async () => {
  assert.strictEqual(new BadRequestError().statusCode, 400);
  assert.strictEqual(new UnauthorizedError().statusCode, 401);
  assert.strictEqual(new ForbiddenError().statusCode, 403);
  assert.strictEqual(new NotFoundError().statusCode, 404);

  // asyncHandler must forward async rejections to next(err).
  let forwarded = null;
  const wrapped = asyncHandler(async () => {
    throw new NotFoundError('Item missing');
  });
  await wrapped({}, {}, (err) => { forwarded = err; });
  await new Promise(resolve => setTimeout(resolve, 10));
  assert(forwarded instanceof NotFoundError);
  assert.strictEqual(forwarded.statusCode, 404);

  // notFoundHandler dispatches NotFoundError.
  let notFoundErr = null;
  notFoundHandler({ method: 'GET', originalUrl: '/missing' }, {}, (e) => { notFoundErr = e; });
  assert(notFoundErr instanceof NotFoundError);

  // errorHandler formats JSON for /api routes and hides stack in production.
  const prevEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  const apiRes = createMockRes();
  errorHandler(
    new BadRequestError('Invalid API input'),
    { method: 'GET', originalUrl: '/api/products/abc', headers: {} },
    apiRes,
    () => {}
  );
  process.env.NODE_ENV = prevEnv;
  assert.strictEqual(apiRes.statusCode, 400);
  assert.deepStrictEqual(apiRes.jsonBody, { success: false, error: 'Invalid API input' });
});

await unitTest('flash.js: stores flash message on session and consumes it once on next request', () => {
  const sessions = new Map();
  const token = 'abc123token';
  sessions.set(token, { userId: 1 });

  const mw = flashMiddleware(sessions);
  const req1 = { sessionToken: token };
  const res1 = createMockRes();
  mw(req1, res1, () => {});
  req1.flash('success', 'Order placed!');

  // Next request consumes the flash message into res.locals and deletes it from session.
  const req2 = { sessionToken: token };
  const res2 = createMockRes();
  mw(req2, res2, () => {});
  assert.strictEqual(res2.locals.message, 'Order placed!');
  assert.deepStrictEqual(res2.locals.flash.success, ['Order placed!']);
  assert.strictEqual(sessions.get(token).flash, undefined);

  // Third request sees no stale flash message.
  const req3 = { sessionToken: token };
  const res3 = createMockRes();
  mw(req3, res3, () => {});
  assert.strictEqual(res3.locals.message, undefined);
  assert.deepStrictEqual(res3.locals.flash.success, []);
});

console.log(`\nAll ${passed} unit test groups passed successfully!`);
