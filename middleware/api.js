/**
 * middleware/api.js
 *
 * REST JSON API middleware for OLMS.
 *
 * Mounts a /api sub-router that exposes read-only (GET) endpoints for the
 * main entities.  All responses are JSON; sensitive fields are stripped by
 * sanitiseOutput before the data leaves the server.
 *
 * Endpoints:
 *   GET /api/products           — list all products (public)
 *   GET /api/products/:id       — single product (public)
 *   GET /api/categories         — list all categories (public)
 *   GET /api/categories/:id     — single category (public)
 *   GET /api/orders             — orders owned by the signed-in user (auth)
 *   GET /api/orders/:id         — single order (auth + ownership)
 *   GET /api/payments           — payments owned by the signed-in user (auth)
 *   GET /api/users              — all users (Admin only)
 *   GET /api/users/:id          — single user (Admin only)
 */

import { Router } from 'express';
import { sanitiseOutput, sanitiseId } from './defensive.js';
import { positiveIdSchema } from '../models/schemas.js';

/**
 * Build and return the API router.
 * @param {import('../services/System.js').System} system
 */
export function createApiRouter(system) {
  const router = Router();

  // ── Helpers ──────────────────────────────────────────────────────────────

  /** Send a sanitised JSON success response. */
  function ok(res, data) {
    res.json({ success: true, data: sanitiseOutput(data) });
  }

  /** Send a JSON error response. */
  function fail(res, status, message) {
    res.status(status).json({ success: false, error: message });
  }

  /**
   * Require the request to carry a valid session user with one of the given
   * roles.  Returns true if access is granted; sends 401/403 and returns
   * false otherwise.
   */
  function requireAuth(req, res, roles = []) {
    if (!req.user) {
      fail(res, 401, 'Sign in to access this resource.');
      return false;
    }
    if (roles.length && !roles.includes(req.user.role)) {
      fail(res, 403, 'You do not have permission to access this resource.');
      return false;
    }
    return true;
  }

  /**
   * Validate the :id param from the path and return the numeric value, or
   * send a 400 and return null.
   */
  function parseId(req, res) {
    const result = positiveIdSchema.safeParse(req.params.id);
    if (!result.success) {
      fail(res, 400, 'Invalid ID parameter.');
      return null;
    }
    return result.data;
  }

  // ── Products (public) ─────────────────────────────────────────────────────

  router.get('/products', (req, res) => {
    let products = system.products.getAll();

    // Filter to approved-seller products for unauthenticated / Customer views.
    if (!req.user || req.user.role === 'Customer') {
      products = products.filter(p => {
        const seller = system.users.findById(p.sellerId);
        return seller && seller.accountStatus === 'Approved';
      });
    }

    // Optional keyword search via ?keyword=
    const keyword = req.query.keyword;
    if (keyword !== undefined) {
      const text = String(keyword).toLowerCase();
      products = products.filter(p =>
        (p.productId + ' ' + p.productName).toLowerCase().includes(text)
      );
    }

    ok(res, products);
  });

  router.get('/products/:id', (req, res) => {
    const id = parseId(req, res);
    if (id === null) return;

    const product = system.products.findById(id);
    if (!product) return fail(res, 404, 'Product not found.');

    // Non-admin users cannot see products from unapproved sellers.
    if (!req.user || req.user.role === 'Customer') {
      const seller = system.users.findById(product.sellerId);
      if (!seller || seller.accountStatus !== 'Approved') {
        return fail(res, 404, 'Product not found.');
      }
    }

    ok(res, product);
  });

  // ── Categories (public) ───────────────────────────────────────────────────

  router.get('/categories', (req, res) => {
    ok(res, system.categories.getAll());
  });

  router.get('/categories/:id', (req, res) => {
    const id = parseId(req, res);
    if (id === null) return;

    const category = system.categories.findById(id);
    if (!category) return fail(res, 404, 'Category not found.');

    ok(res, category);
  });

  // ── Orders (authenticated) ────────────────────────────────────────────────

  router.get('/orders', (req, res) => {
    if (!requireAuth(req, res, ['Admin', 'Seller', 'Customer'])) return;

    const all = system.orders.getAll().filter(o =>
      req.user.role === 'Admin' ||
      (req.user.role === 'Seller' ? o.sellerId : o.customerId) === req.user.userId
    );

    ok(res, all);
  });

  router.get('/orders/:id', (req, res) => {
    if (!requireAuth(req, res, ['Admin', 'Seller', 'Customer'])) return;

    const id = parseId(req, res);
    if (id === null) return;

    const order = system.orders.findById(id);
    if (
      !order ||
      (req.user.role === 'Customer' && order.customerId !== req.user.userId) ||
      (req.user.role === 'Seller' && order.sellerId !== req.user.userId)
    ) {
      return fail(res, 404, 'Order not found.');
    }

    ok(res, order);
  });

  // ── Payments (authenticated) ──────────────────────────────────────────────

  router.get('/payments', (req, res) => {
    if (!requireAuth(req, res, ['Admin', 'Seller', 'Customer'])) return;

    const all = system.payments.getAll().filter(p => {
      const order = system.orders.findById(p.orderId);
      return order && (
        req.user.role === 'Admin' ||
        (req.user.role === 'Seller' ? order.sellerId : order.customerId) === req.user.userId
      );
    });

    ok(res, all);
  });

  // ── Users (Admin only) ────────────────────────────────────────────────────

  router.get('/users', (req, res) => {
    if (!requireAuth(req, res, ['Admin'])) return;

    const role = req.query.role;
    const all = role
      ? system.users.getAll(role)
      : [
          ...system.users.getAll('Admin'),
          ...system.users.getAll('Seller'),
          ...system.users.getAll('Customer')
        ];

    ok(res, all);
  });

  router.get('/users/:id', (req, res) => {
    if (!requireAuth(req, res, ['Admin'])) return;

    const id = parseId(req, res);
    if (id === null) return;

    const user = system.users.findById(id);
    if (!user) return fail(res, 404, 'User not found.');

    ok(res, user);
  });

  // ── Catch-all for unknown /api routes ─────────────────────────────────────

  router.use((req, res) => {
    fail(res, 404, 'API endpoint not found.');
  });

  return router;
}

