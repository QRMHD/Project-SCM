import test from 'node:test';
import assert from 'node:assert/strict';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import User from '../models/User.js';
import Customer from '../models/Customer.js';
import Seller from '../models/Seller.js';
import { hashPassword } from '../utils/password.js';

test('Product has the planned attributes, getters and stock update method', () => {
    const product = new Product(101, ' Rice ', 25.90, 40, 1, 100);
    assert.equal(product.getProductId(), 101);
    assert.equal(product.getProductName(), 'Rice');
    assert.equal(product.getPrice(), 25.90);
    product.updateStock(12);
    assert.equal(product.getStockQuantity(), 12);
    assert.equal(product.getCategoryId(), 1);
    assert.equal(product.getSellerId(), 100);
});

test('Product rejects invalid IDs, prices, stock and references', () => {
    const invalidInputs = [
        [0, 'Rice', 1, 1, 1, 100], [1, ' ', 1, 1, 1, 100],
        [1, 'Rice', -1, 1, 1, 100], [1, 'Rice', Infinity, 1, 1, 100],
        [1, 'Rice', 1.001, 1, 1, 100], [1, 'Rice', 1, -1, 1, 100],
        [1, 'Rice', 1, 1.5, 1, 100], [1, 'Rice', 1, 1, 0, 100]
    ];
    invalidInputs.forEach(values => assert.throws(() => new Product(...values)));
});

test('Category validates its name and supports a setter', () => {
    const category = new Category(1, ' Food ');
    assert.equal(category.getCategoryName(), 'Food');
    category.setCategoryName('Groceries');
    assert.equal(category.getCategoryName(), 'Groceries');
    assert.throws(() => new Category(1, ' '));
});

test('Customer inherits User and profile validation does not partly change data', () => {
    const customer = new Customer(1, 'Ali', 'ALI@example.com', 'test-hash');
    assert.ok(customer instanceof User);
    assert.equal(customer.getEmail(), 'ali@example.com');
    assert.throws(() => customer.updateProfile('New name', 'invalid'));
    assert.equal(customer.getName(), 'Ali');
    assert.throws(() => new User(2, 'User', 'user@example.com', 'hash'));
});

test('Seller validates status and omits password hash from public data', () => {
    const seller = new Seller(2, 'Local Seller', 'seller@example.com', 'test-hash', 'Pending');
    seller.setAccountStatus('Approved');
    assert.equal(seller.getAccountStatus(), 'Approved');
    assert.equal(seller.getPublicData().passwordHash, undefined);
    assert.throws(() => seller.setAccountStatus('Unknown'));
});

test('Passwords are salted and are not stored as plain text', () => {
    const firstHash = hashPassword('DemoPass123');
    const secondHash = hashPassword('DemoPass123');
    assert.notEqual(firstHash, 'DemoPass123');
    assert.notEqual(firstHash, secondHash);
    assert.throws(() => hashPassword('short'));
});
