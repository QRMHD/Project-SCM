import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { System } from '../services/System.js';
const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'olms-test-'));
const file = path.join(folder, 'data.json');
let count = 0;
function check(name, action) { action();count += 1;console.log('PASS ' + name); }
try {
  const s = new System(file);
  const customer = s.users.getAll('Customer')[0];
  const seller = s.users.getAll('Seller')[0];
  let category, product, order;
  check('Login and password storage', () => {
    assert.strictEqual(s.users.login('customer@olms.test', 'Customer123!').userId, customer.userId);
    assert.throws(() => s.users.login('customer@olms.test', 'wrong'));
    assert(!fs.readFileSync(file, 'utf8').includes('Customer123!'));
  });
  check('Customer, Seller and Admin CRUD', () => {
    ['Customer','Seller','Admin'].forEach(role => {
      const data = { name: 'Test', email: role.toLowerCase() + '@example.test', password: 'Test1234!', phone: '0123456789', address: 'Kajang' };
      const user = s.users.create(role, data);
      assert(s.users.search(role, 'EXAMPLE').some(u => u.userId === user.userId));
      s.users.edit(role, user.userId, Object.assign({}, data, { name: 'Updated' }));
      assert.strictEqual(s.users.findById(user.userId).name, 'Updated');
      s.users.delete(user.userId);assert(!s.users.findById(user.userId));
    });
    assert.throws(() => s.users.delete(s.users.getAll('Admin')[0].userId));
  });
  check('Category and product CRUD plus relationships', () => {
    category = s.categories.save(null, { categoryName: 'Test category' });
    product = s.products.save(null, { productName: 'Test product', price: '5.50', stockQuantity: '10', categoryId: category.categoryId, sellerId: seller.userId });
    assert.strictEqual(s.products.search('TEST PRODUCT').length, 1);
    s.categories.save(category.categoryId, { categoryName: 'Renamed category' });
    assert.strictEqual(s.products.search('RENAMED').length, 1);
    assert.throws(() => s.categories.delete(category.categoryId));
    assert.throws(() => s.users.delete(seller.userId));
    assert.throws(() => s.products.save(product.productId, Object.assign({}, product, { stockQuantity: '2.5' })));
    assert.strictEqual(s.products.findById(product.productId).stockQuantity, 10);
    s.products.save(product.productId, Object.assign({}, product, { productName: 'Updated product' }));
  });
  check('Unapproved seller and duplicate email rejected', () => {
    const pending = s.users.create('Seller', { name: 'Pending', email: 'pending@example.test', password: 'Test1234!' });
    assert.throws(() => s.products.save(null, Object.assign({}, product, { sellerId: pending.userId })));
    assert.throws(() => s.users.create('Seller', { name: 'Duplicate', email: 'CUSTOMER@OLMS.TEST', password: 'Test1234!' }));
    s.users.edit('Seller', pending.userId, { accountStatus: 'Approved' });
    assert.strictEqual(s.users.findById(pending.userId).accountStatus, 'Approved');
    s.users.delete(pending.userId);
  });
  check('Cart add, change, remove and clear', () => {
    s.carts.setItem(customer.userId, product.productId, 2, true);
    s.carts.setItem(customer.userId, product.productId, 3);
    assert.strictEqual(s.carts.get(customer.userId).items[0].quantity, 3);
    assert.throws(() => s.carts.setItem(customer.userId, product.productId, 11));
    s.carts.setItem(customer.userId, product.productId, 0);
    assert.strictEqual(s.carts.get(customer.userId).items.length, 0);
    s.carts.clear(customer.userId);
  });
  check('Checkout reserves stock and snapshots prices', () => {
    s.carts.setItem(customer.userId, product.productId, 2, true);
    order = s.orders.checkout(customer.userId);
    assert.strictEqual(order.totalAmount, 11);
    assert.strictEqual(s.products.findById(product.productId).stockQuantity, 8);
    assert.strictEqual(s.carts.get(customer.userId).items.length, 0);
    s.products.save(product.productId, Object.assign({}, s.products.findById(product.productId), { price: 7 }));
    assert.strictEqual(s.orders.findById(order.orderId).totalAmount, 11);
    assert.throws(() => s.products.delete(product.productId));
  });
  check('Failed payment, retry and successful payment', () => {
    const failed = s.payments.makePayment(order.orderId, 'Failed');
    assert.strictEqual(s.orders.findById(order.orderId).orderStatus, 'Pending');
    s.payments.delete(failed.paymentId);
    const paid = s.payments.makePayment(order.orderId, 'Success');
    assert.strictEqual(paid.amount, 11);
    assert.strictEqual(s.orders.findById(order.orderId).orderStatus, 'Paid');
    assert.throws(() => s.payments.makePayment(order.orderId, 'Success'));
    assert.throws(() => s.payments.delete(paid.paymentId));
    assert.throws(() => s.orders.updateStatus(order.orderId, 'Cancelled'));
  });
  check('Fulfilment follows valid transitions', () => {
    assert.throws(() => s.orders.updateStatus(order.orderId, 'Completed'));
    ['Processing','Shipped','Completed'].forEach(status => s.orders.updateStatus(order.orderId, status));
    assert.strictEqual(s.orders.findById(order.orderId).orderStatus, 'Completed');
  });
  check('Cancellation restores stock once and allows deletion', () => {
    s.carts.setItem(customer.userId, product.productId, 1, true);
    const cancelled = s.orders.checkout(customer.userId);
    s.orders.updateStatus(cancelled.orderId, 'Cancelled');
    assert.strictEqual(s.products.findById(product.productId).stockQuantity, 8);
    assert.throws(() => s.orders.updateStatus(cancelled.orderId, 'Cancelled'));
    s.orders.delete(cancelled.orderId);assert(!s.orders.findById(cancelled.orderId));
  });
  check('Unused records can be deleted', () => {
    const p = s.products.save(null, { productName: 'Temporary', price: 1, stockQuantity: 0, categoryId: category.categoryId, sellerId: seller.userId });
    s.products.delete(p.productId);assert(!s.products.findById(p.productId));
    const c = s.categories.save(null, { categoryName: 'Temporary' });s.categories.delete(c.categoryId);assert(!s.categories.findById(c.categoryId));
  });
  check('Reload retains records and counters', () => {
    const reload = new System(file);
    assert.strictEqual(reload.orders.findById(order.orderId).orderStatus, 'Completed');
    assert.strictEqual(reload.products.findById(product.productId).stockQuantity, 8);
    assert.strictEqual(reload.payments.getAll().length, 1);
  });
  console.log(count + ' integration groups passed. Temporary test data only.');
} finally { fs.rmSync(folder, { recursive: true, force: true }); }
