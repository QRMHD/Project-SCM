import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import createApp from '../app.js';
import DataStore from '../models/DataStore.js';

const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'olms-test-'));
const dataFile = path.join(directory, 'olms.json');
let server;
let baseUrl;

function api(url, method = 'GET', body = null) {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (body !== null) options.body = JSON.stringify(body);
    return fetch(`${baseUrl}/api${url}`, options).then(response => {
        return response.json().then(data => ({ status: response.status, data }));
    });
}

test.before(() => new Promise(resolve => {
    server = createApp(dataFile).listen(0, '127.0.0.1', () => {
        baseUrl = `http://127.0.0.1:${server.address().port}`;
        resolve();
    });
}).then(() => api('/categories', 'POST', { categoryId: 1, categoryName: 'Food' }))
    .then(() => api('/sellers', 'POST', { userId: 100, name: 'Base Seller', email: 'base@example.com',
        password: 'DemoPass123', accountStatus: 'Approved' })));

test.after(() => new Promise(resolve => {
    server.close(() => {
        fs.rmSync(directory, { recursive: true, force: true });
        resolve();
    });
}));

const cases = [
    { module: 'categories', id: 'categoryId', record: { categoryId: 10, categoryName: 'Drinks' },
        changes: { categoryId: 10, categoryName: 'Beverages' }, searchField: 'categoryName', query: 'DRINK', changedField: 'categoryName' },
    { module: 'customers', id: 'userId', record: { userId: 300, name: 'Ali Customer', email: 'ali@example.com', password: 'DemoPass123' },
        changes: { userId: 300, name: 'Ali Updated', email: 'ali2@example.com', password: '' }, searchField: 'name', query: 'ALI', changedField: 'name' },
    { module: 'sellers', id: 'userId', record: { userId: 200, name: 'Local Seller', email: 'local@example.com', password: 'DemoPass123', accountStatus: 'Pending' },
        changes: { userId: 200, name: 'Seller Updated', email: 'local2@example.com', password: '', accountStatus: 'Approved' }, searchField: 'email', query: 'LOCAL@', changedField: 'name' },
    { module: 'products', id: 'productId', record: { productId: 20, productName: 'Jasmine Rice', price: 25.90, stockQuantity: 40, categoryId: 1, sellerId: 100 },
        changes: { productId: 20, productName: 'Premium Rice', price: 27.50, stockQuantity: 35, categoryId: 1, sellerId: 100 }, searchField: 'productName', query: 'RICE', changedField: 'productName' }
];

cases.forEach(example => {
    test(`${example.module}: create, read, search, not found, duplicate, edit and delete`, () => {
        const root = `/${example.module}`;
        const item = `${root}/${example.record[example.id]}`;
        return api(root, 'POST', example.record).then(result => {
            assert.equal(result.status, 201);
            assert.equal(result.data.record[example.id], example.record[example.id]);
            assert.equal(result.data.record.passwordHash, undefined);
            assert.equal(result.data.record.password, undefined);
            return api(item);
        }).then(result => {
            assert.equal(result.status, 200);
            assert.equal(result.data.passwordHash, undefined);
            return api(`${root}/search?field=${example.searchField}&q=${encodeURIComponent(example.query)}`);
        }).then(result => {
            assert.equal(result.data.length, 1);
            assert.equal(result.data[0].passwordHash, undefined);
            return api(`${root}/search?field=${example.id}&q=9999`);
        }).then(result => {
            assert.deepEqual(result.data, []);
            return api(root, 'POST', example.record);
        }).then(result => {
            assert.equal(result.status, 409);
            return api(item, 'PUT', example.changes);
        }).then(result => {
            assert.equal(result.status, 200);
            assert.equal(result.data.record[example.changedField], example.changes[example.changedField]);
            assert.equal(result.data.record.passwordHash, undefined);
            return api(root);
        }).then(result => {
            assert.ok(result.data.some(record => record[example.id] === example.record[example.id]));
            assert.equal(JSON.stringify(result.data).indexOf('passwordHash'), -1);
            return api(item, 'DELETE');
        }).then(result => {
            assert.equal(result.status, 200);
            return api(item);
        }).then(result => {
            assert.equal(result.status, 404);
        });
    });
});

test('Product links block deletion of an in-use Category or Seller', () => {
    const product = { productId: 50, productName: 'Linked Rice', price: 10, stockQuantity: 5, categoryId: 1, sellerId: 100 };
    return api('/products', 'POST', product).then(result => {
        assert.equal(result.status, 201);
        return api('/categories/1', 'DELETE');
    }).then(result => {
        assert.equal(result.status, 409);
        return api('/sellers/100', 'DELETE');
    }).then(result => {
        assert.equal(result.status, 409);
        return api('/sellers/100', 'PUT', { name: 'Base Seller', email: 'base@example.com', password: '', accountStatus: 'Pending' });
    }).then(result => {
        assert.equal(result.status, 409);
        return api('/products/50', 'PUT', Object.assign({}, product, { stockQuantity: -1, productName: 'Bad edit' }));
    }).then(result => {
        assert.equal(result.status, 400);
        return api('/products/50');
    }).then(result => {
        assert.equal(result.data.productName, 'Linked Rice');
        assert.equal(result.data.stockQuantity, 5);
    });
});

test('Global user IDs and email addresses are unique across Customer and Seller', () => {
    return api('/customers', 'POST', { userId: 100, name: 'Duplicate', email: 'new@example.com', password: 'DemoPass123' }).then(result => {
        assert.equal(result.status, 409);
        return api('/customers', 'POST', { userId: 400, name: 'Duplicate', email: 'BASE@example.com', password: 'DemoPass123' });
    }).then(result => assert.equal(result.status, 409));
});

test('Blank password on edit keeps the stored hash; a replacement changes it', () => {
    const originalHash = new DataStore(dataFile).readData().sellers[0].passwordHash;
    const seller = { name: 'Base Seller', email: 'base@example.com', password: '', accountStatus: 'Approved' };
    return api('/sellers/100', 'PUT', seller).then(result => {
        assert.equal(result.status, 200);
        assert.equal(new DataStore(dataFile).readData().sellers[0].passwordHash, originalHash);
        seller.password = 'DifferentPass123';
        return api('/sellers/100', 'PUT', seller);
    }).then(result => {
        assert.equal(result.status, 200);
        assert.notEqual(new DataStore(dataFile).readData().sellers[0].passwordHash, originalHash);
    });
});

test('Saved records are readable by a new DataStore instance', () => {
    const saved = new DataStore(dataFile).readData();
    assert.equal(saved.products[0].productId, 50);
    assert.equal(saved.products[0].productName, 'Linked Rice');
});

test('Invalid inputs and routes return clear client errors', () => {
    return api('/products/search?field=productName&q=').then(result => {
        assert.equal(result.status, 400);
        return api('/categories/1.5');
    }).then(result => {
        assert.equal(result.status, 400);
        return api('/customers', 'POST', { userId: 500, name: 'Test', email: 'invalid', password: 'DemoPass123' });
    }).then(result => {
        assert.equal(result.status, 400);
        return api('/products', 'POST', { productId: 60, productName: 'Missing link', price: 1, stockQuantity: 1, categoryId: 999, sellerId: 100 });
    }).then(result => {
        assert.equal(result.status, 400);
        return api('/unknown');
    }).then(result => assert.equal(result.status, 404));
});
