import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

test('HTTP routes share the session and return the expected responses', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'olms-http-'));
  const root = fileURLToPath(new URL('../', import.meta.url));
  const server = spawn(process.execPath, ['app.js'], {
    cwd: root,
    env: { ...process.env, PORT: '0', NODE_ENV: 'production', OLMS_APP_ROOT: root, OLMS_DATA_FILE: join(folder, 'data.json') },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  const closed = once(server, 'close');
  async function login(base, email, password) {
    const response = await fetch(base + '/login', {
      method: 'POST', redirect: 'manual', body: new URLSearchParams({ email, password })
    });
    assert.equal(response.status, 302);
    return response.headers.get('set-cookie').split(';')[0];
  }
  let startupTimer;
  try {
    const port = await Promise.race([
      once(server.stdout, 'data').then(([chunk]) => {
        const match = String(chunk).match(/localhost:(\d+)/);
        assert.ok(match, 'Server did not announce its port');
        return match[1];
      }),
      closed.then(([code]) => { throw new Error('Server exited during startup: ' + code); }),
      new Promise((_, reject) => {
        startupTimer = setTimeout(() => reject(new Error('Server startup timed out')), 5000);
      })
    ]);
    const base = 'http://127.0.0.1:' + port;
    const publicProducts = await fetch(base + '/api/products');
    assert.equal(publicProducts.status, 200);
    assert.ok((await publicProducts.json()).data.length);

    const guest = await fetch(base + '/api/users');
    assert.equal(guest.status, 401);
    assert.equal((await guest.json()).success, false);

    const admin = await login(base, 'admin@olms.test', 'Admin123!');
    const adminHeaders = { Cookie: admin };
    const productPage = await fetch(base + '/products', { headers: adminHeaders });
    assert.match(await productPage.text(), /Welcome back, OLMS Admin/);
    const refreshed = await fetch(base + '/products', { headers: adminHeaders });
    assert.doesNotMatch(await refreshed.text(), /Welcome back, OLMS Admin/);
    const users = await fetch(base + '/api/users', { headers: adminHeaders });
    assert.equal(users.status, 200);
    const userData = await users.json();
    assert.ok(userData.data.some(user => user.role === 'Admin'));
    assert.doesNotMatch(JSON.stringify(userData), /"password(?:Hash)?":/);
    for (const path of ['/api/orders', '/api/payments']) {
      assert.equal((await fetch(base + path, { headers: adminHeaders })).status, 200);
    }

    const customer = await login(base, 'customer@olms.test', 'Customer123!');
    assert.equal((await fetch(base + '/api/users', { headers: { Cookie: customer } })).status, 403);
    const malformed = await fetch(base + '/orders/abc', { headers: { Cookie: customer } });
    assert.equal(malformed.status, 400);
    assert.match(await malformed.text(), /Invalid ID parameter/);
    const cart = await fetch(base + '/cart/items', {
      method: 'POST', redirect: 'manual', headers: { Cookie: customer },
      body: new URLSearchParams({ productId: '1', quantity: '1', operation: 'add' })
    });
    assert.equal(cart.headers.get('location'), '/cart');
    const cartPage = await fetch(base + '/cart', { headers: { Cookie: customer } });
    assert.match(await cartPage.text(), /Cart updated\./);
  } finally {
    clearTimeout(startupTimer);
    server.kill();
    await closed;
    rmSync(folder, { recursive: true, force: true });
  }
});
