import { Router } from 'express';
import { sanitiseOutput } from './defensive.js';
import { positiveIdSchema } from '../models/schemas.js';
import { ORDER_ROLES, canViewOrder, canViewProduct } from '../services/Visibility.js';

export function createApiRouter(system) {
  const router = Router();

  function ok(res, data) {
    res.json({ success: true, data: sanitiseOutput(data) });
  }

  function fail(res, status, message) {
    res.status(status).json({ success: false, error: message });
  }

  function requireRoles(roles) {
    return (req, res, next) => {
      if (!req.user) return fail(res, 401, 'Sign in to access this resource.');
      if (!roles.includes(req.user.role)) {
        return fail(res, 403, 'You do not have permission to access this resource.');
      }
      next();
    };
  }

  // Check the role first on protected routes, then the ID and record visibility.
  function sendRecord(req, res, findRecord, notFound) {
    const id = positiveIdSchema.safeParse(req.params.id);
    if (!id.success) return fail(res, 400, 'Invalid ID parameter.');
    const record = findRecord(id.data);
    if (!record) return fail(res, 404, notFound);
    ok(res, record);
  }

  const requireOrderRole = requireRoles(ORDER_ROLES);
  const requireAdmin = requireRoles(['Admin']);

  router.get('/products', (req, res) => {
    const products = system.products.getAll().filter(
      product => canViewProduct(req.user, product, system.users)
    );
    const keyword = req.query.keyword;
    if (keyword === undefined) return ok(res, products);

    const text = String(keyword).toLowerCase();
    ok(res, products.filter(product =>
      (product.productId + ' ' + product.productName).toLowerCase().includes(text)
    ));
  });

  router.get('/products/:id', (req, res) => {
    sendRecord(req, res, id => {
      const product = system.products.findById(id);
      return product && canViewProduct(req.user, product, system.users) ? product : null;
    }, 'Product not found.');
  });

  router.get('/categories', (req, res) => ok(res, system.categories.getAll()));
  router.get('/categories/:id', (req, res) => {
    sendRecord(req, res, id => system.categories.findById(id), 'Category not found.');
  });

  router.get('/orders', requireOrderRole, (req, res) => {
    ok(res, system.orders.getAll().filter(order => canViewOrder(req.user, order)));
  });

  router.get('/orders/:id', requireOrderRole, (req, res) => {
    sendRecord(req, res, id => {
      const order = system.orders.findById(id);
      return canViewOrder(req.user, order) ? order : null;
    }, 'Order not found.');
  });

  router.get('/payments', requireOrderRole, (req, res) => {
    ok(res, system.payments.getAll().filter(payment =>
      canViewOrder(req.user, system.orders.findById(payment.orderId))
    ));
  });

  router.get('/users', requireAdmin, (req, res) => {
    const role = req.query.role;
    const all = role ? system.users.getAll(role) : [].concat(
      system.users.getAll('Admin'), system.users.getAll('Seller'), system.users.getAll('Customer')
    );
    ok(res, all);
  });

  router.get('/users/:id', requireAdmin, (req, res) => {
    sendRecord(req, res, id => system.users.findById(id), 'User not found.');
  });

  router.use((req, res) => fail(res, 404, 'API endpoint not found.'));
  return router;
}
