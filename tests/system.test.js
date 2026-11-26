import assert from 'assert';
import fs from 'fs';
import http from 'http';
import os from 'os';
import path from 'path';

/**
 * End-to-End HTTP System Test Suite for OLMS.
 *
 * Imports the Express application in-process on an isolated temporary data file
 * and OS-assigned ephemeral port (0), ensuring tests never touch data/olms.json,
 * never conflict with running servers, and execute reliably across Windows,
 * Git Bash, and WSL without child-process or proxy timeouts.
 */

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'olms-system-'));
process.env.OLMS_DATA_FILE = path.join(tmpDir, 'olms.json');
process.env.OLMS_NO_LISTEN = '1';

const { app } = await import('../app.js');

let server;
let port;
let passed = 0;

/**
 * Sends a raw HTTP request via Node's native http module (bypassing proxy env vars).
 */
function request(method, urlPath, { headers = {}, body = null } = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { hostname: '127.0.0.1', port, path: urlPath, method, headers },
      (res) => {
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            text: Buffer.concat(chunks).toString('utf8')
          });
        });
      }
    );
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function postForm(urlPath, fields, cookie = '') {
  const body = new URLSearchParams(fields).toString();
  return request('POST', urlPath, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(body),
      ...(cookie ? { Cookie: cookie } : {})
    },
    body
  });
}

async function systemTest(name, fn) {
  await fn();
  passed += 1;
  console.log('PASS [System] ' + name);
}

try {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      port = server.address().port;
      resolve();
    });
  });

  // ── 1. Invalid Input Error Handling (Forms & Validation Middleware) ─────────

  await systemTest('Invalid registration input returns HTTP 400 with field-specific error', async () => {
    const res = await postForm('/register', {
      role: 'Customer',
      name: 'Test User',
      email: 'bad-email',
      password: '123',
      phone: '0123456789',
      address: 'Kajang'
    });
    assert.strictEqual(res.status, 400);
    assert(res.text.includes('Enter a valid email.'));
  });

  await systemTest('Invalid login credentials return HTTP 400 without creating a session cookie', async () => {
    const res = await postForm('/login', {
      email: 'customer@olms.test',
      password: 'WrongPassword!'
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.headers['set-cookie'], undefined);
    assert(res.text.includes('Incorrect email or password.'));
  });

  await systemTest('Unknown web route triggers 404 NotFoundError page', async () => {
    const res = await request('GET', '/does-not-exist');
    assert.strictEqual(res.status, 404);
    assert(res.text.includes('Page not found'));
  });

  // ── 2. Integrated REST API Security & Error Handling ──────────────────────

  await systemTest('API returns sanitized products and rejects malformed IDs / unauthorized access', async () => {
    const listRes = await request('GET', '/api/products');
    assert.strictEqual(listRes.status, 200);
    const listJson = JSON.parse(listRes.text);
    assert.strictEqual(listJson.success, true);
    assert(listJson.data.length >= 3);

    const badIdRes = await request('GET', '/api/products/abc');
    assert.strictEqual(badIdRes.status, 400);
    const badIdJson = JSON.parse(badIdRes.text);
    assert.strictEqual(badIdJson.success, false);
    assert.strictEqual(badIdJson.error, 'Invalid ID parameter.');

    const unauthRes = await request('GET', '/api/users');
    assert.strictEqual(unauthRes.status, 401);
    const unauthJson = JSON.parse(unauthRes.text);
    assert.strictEqual(unauthJson.success, false);
  });

  await systemTest('Admin API /api/users strips passwordHash from every returned record', async () => {
    const loginRes = await postForm('/login', {
      email: 'admin@olms.test',
      password: 'Admin123!'
    });
    assert.strictEqual(loginRes.status, 302);
    const adminCookie = loginRes.headers['set-cookie'][0].split(';')[0];

    const usersRes = await request('GET', '/api/users', {
      headers: { Cookie: adminCookie }
    });
    assert.strictEqual(usersRes.status, 200);
    const usersJson = JSON.parse(usersRes.text);
    assert.strictEqual(usersJson.success, true);
    assert(usersJson.data.length >= 3);
    usersJson.data.forEach(u => {
      assert.strictEqual(u.passwordHash, undefined);
    });
  });

  // ── 3. Full Customer Workflow: Login -> Flash -> Cart -> Checkout -> Pay ──

  await systemTest('Customer login, flash banner, cart, checkout, payment, and transition guard', async () => {
    const loginRes = await postForm('/login', {
      email: 'customer@olms.test',
      password: 'Customer123!'
    });
    assert.strictEqual(loginRes.status, 302);
    const customerCookie = loginRes.headers['set-cookie'][0].split(';')[0];

    // Following redirect shows one-time welcome flash message.
    const productsRes = await request('GET', '/products', {
      headers: { Cookie: customerCookie }
    });
    assert(productsRes.text.includes('Welcome back, Aisha Rahman!'));

    // Direct GET /checkout redirects cleanly to /cart.
    const getCheckoutRes = await request('GET', '/checkout', {
      headers: { Cookie: customerCookie }
    });
    assert.strictEqual(getCheckoutRes.status, 302);
    assert.strictEqual(getCheckoutRes.headers.location, '/cart');

    // Invalid cart quantity is rejected with HTTP 400.
    const badCartRes = await postForm('/cart/items', {
      productId: '1',
      quantity: '-5',
      operation: 'add'
    }, customerCookie);
    assert.strictEqual(badCartRes.status, 400);

    // Add valid item, checkout, and verify order creation.
    const addCartRes = await postForm('/cart/items', {
      productId: '1',
      quantity: '2',
      operation: 'add'
    }, customerCookie);
    assert.strictEqual(addCartRes.status, 302);

    const checkoutRes = await postForm('/checkout', {}, customerCookie);
    assert.strictEqual(checkoutRes.status, 302);
    assert.strictEqual(checkoutRes.headers.location, '/orders/1');

    // Customer cannot illegally skip order status to Completed (HTTP 400).
    const illegalStatusRes = await postForm('/orders/1/status', {
      orderStatus: 'Completed'
    }, customerCookie);
    assert.strictEqual(illegalStatusRes.status, 400);
    assert(illegalStatusRes.text.includes('Customers may only cancel pending orders.'));

    // Successful simulated payment updates order to Paid.
    const payRes = await postForm('/orders/1/pay', {
      outcome: 'Success'
    }, customerCookie);
    assert.strictEqual(payRes.status, 302);

    const paidOrderRes = await request('GET', '/orders/1', {
      headers: { Cookie: customerCookie }
    });
    assert(paidOrderRes.text.includes('Status: <strong>Paid</strong>'));
  });

  console.log(`\nAll ${passed} end-to-end system test scenarios passed successfully!`);
} finally {
  if (server) {
    await new Promise(resolve => server.close(resolve));
  }
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
