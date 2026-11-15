import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { System } from './services/System.js';
import { forms } from './services/Forms.js';
import { ORDER_ROLES, canViewOrder, canViewProduct } from './services/Visibility.js';
import {
  sanitiseBody,
  sanitiseId,
  limitBodyFields,
  validateLogin,
  validateRegister,
  validateProfileUpdate,
  validateCartItem,
  validatePayment,
  validateOrderStatus
} from './middleware/defensive.js';
import {
  BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError,
  notFoundHandler, errorHandler
} from './middleware/errorHandler.js';
import { createApiRouter } from './middleware/api.js';
import { flashMiddleware } from './middleware/flash.js';

const ROOT = path.resolve(process.env.OLMS_APP_ROOT || '.');
const PORT = Number(process.env.PORT || 3000);

const app = express();

const system = new System(
  process.env.OLMS_DATA_FILE || path.join(ROOT, 'data/olms.json')
);

const sessions = new Map();
const SESSION_SECONDS = 8 * 60 * 60;
const COOKIE_FLAGS = '; HttpOnly; SameSite=Lax; Path=/; Max-Age=';

app.set('view engine', 'ejs');
app.set('views', path.join(ROOT, 'views'));
app.use(express.static(path.join(ROOT, 'public')));

// Small local session implementation for the lab's login use case.
app.use((req, res, next) => {
  const match = (req.headers.cookie || '').match(/(?:^|; )olms=([a-f0-9]+)/);
  const session = match ? sessions.get(match[1]) : null;

  req.user = session && session.expires > Date.now()
    ? system.users.findById(session.userId)
    : null;
  req.sessionToken = match ? match[1] : null;

  res.locals.user = req.user;
  res.locals.message = '';
  res.locals.error = '';
  res.locals.money = value => Number(value).toFixed(2);

  next();
});

// Flash messages — must come after session middleware so req.sessionToken exists.
app.use(flashMiddleware(sessions));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(express.json({ limit: '100kb' }));
app.use(limitBodyFields(20));
app.use(sanitiseBody);

// The API needs req.user from the session middleware.
app.use('/api', createApiRouter(system));
app.param('id', sanitiseId);

function requireRole(req, roles) {
  if (!req.user) throw new UnauthorizedError();
  if (!roles.includes(req.user.role)) throw new ForbiddenError();
}

function signInRequired(req, res, next) {
  requireRole(req, ORDER_ROLES);
  next();
}

function startSession(req, res, user) {
  // Keep the user ID server-side; the cookie holds only a random token.
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, {
    userId: user.userId,
    expires: Date.now() + SESSION_SECONDS * 1000
  });
  req.sessionToken = token;
  setSessionCookie(res, token, SESSION_SECONDS);
}

function setSessionCookie(res, token, maxAge) {
  res.setHeader('Set-Cookie', 'olms=' + token + COOKIE_FLAGS + maxAge);
}

function orderAccess(req, orderId) {
  requireRole(req, ORDER_ROLES);
  const order = system.orders.findById(orderId);
  if (!canViewOrder(req.user, order)) throw new NotFoundError('Order not found.');
  return order;
}

function paymentAccess(req) {
  requireRole(req, ['Admin', 'Customer']);
  const payment = system.payments.findById(req.numericId);
  if (!payment) throw new NotFoundError('Payment not found.');
  orderAccess(req, payment.orderId);
  return payment;
}

app.get('/', (req, res) => res.redirect('/products'));

app.get('/login', (req, res) => res.render('login'));

app.post('/login', validateLogin, (req, res) => {
  try {
    const user = system.users.login(req.body.email, req.body.password);
    sessions.delete(req.sessionToken);
    startSession(req, res, user);
    req.flash('success', 'Welcome back, ' + user.name + '!');
    res.redirect('/products');
  } catch (error) {
    res.status(400).render('login', { error: error.message });
  }
});

app.post('/logout', (req, res) => {
  sessions.delete(req.sessionToken);
  setSessionCookie(res, '', 0);
  res.redirect('/login');
});

app.get('/register', (req, res) => res.render('register', { formData: {} }));

app.post('/register', validateRegister, (req, res) => {
  try {
    const data = Object.assign({}, req.body, { accountStatus: 'Pending' });
    system.users.create(req.body.role, data);
    res.render('login', {
      message: req.body.role === 'Seller'
        ? 'Account created. Sellers need administrator approval before adding products.'
        : 'Account created. You can now sign in.'
    });
  } catch (error) {
    res.status(400).render('register', {
      error: error.message,
      formData: req.body
    });
  }
});

app.get('/profile', signInRequired, (req, res) => {
  res.render('profile', { formData: req.user });
});

app.post('/profile', signInRequired, validateProfileUpdate, (req, res) => {
  try {
    const data = {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password
    };
    if (req.user.role === 'Customer') {
      Object.assign(data, {
        phone: req.body.phone,
        address: req.body.address
      });
    }
    const user = system.users.edit(req.user.role, req.user.userId, data);
    res.locals.user = user;
    req.flash('success', 'Profile updated.');
    res.redirect('/profile');
  } catch (error) {
    res.status(400).render('profile', {
      formData: req.body,
      error: error.message
    });
  }
});

function optionsFor(req) {
  // Sellers can select only their own approved account for products.
  return {
    categoryId: system.categories.getAll().map(c => ({
      value: c.categoryId,
      label: c.categoryName
    })),
    sellerId: system.users.getAll('Seller')
      .filter(s =>
        s.accountStatus === 'Approved' &&
        (req.user.role === 'Admin' || s.userId === req.user.userId)
      )
      .map(s => ({ value: s.userId, label: s.name })),
    accountStatus: ['Pending', 'Approved', 'Rejected'].map(s => ({
      value: s,
      label: s
    }))
  };
}

function canManage(req, key, record) {
  // Product writes require seller approval and ownership, or an admin.
  requireRole(req, key === 'products' ? ['Admin', 'Seller'] : ['Admin']);

  if (
    req.user.role === 'Seller' &&
    (req.user.accountStatus !== 'Approved' ||
      (record && record.sellerId !== req.user.userId))
  ) {
    throw new ForbiddenError(
      'You can only manage your own products after approval.'
    );
  }
}

function displayValue(record, name) {
  if (name === 'price') {
    return Number(record[name]).toFixed(2);
  }
  if (name === 'categoryId') {
    const c = system.categories.findById(record[name]);
    return c ? c.categoryName : '';
  }
  if (name === 'sellerId') {
    const s = system.users.findById(record[name]);
    return s ? s.name : '';
  }
  return record[name];
}

Object.keys(forms).forEach(key => {
  // Reuse each entity's field definitions for its CRUD routes and views.
  const config = forms[key];
  const manager = system[key];

  const list = (req, res, message = '', error = '') => {
    if (key !== 'products') {
      requireRole(req, ['Admin']);
    }

    let all = manager.getAll();
    let results = req.query.keyword === undefined
      ? null
      : manager.search(req.query.keyword);

    if (key === 'products') {
      const isVisible = product => canViewProduct(req.user, product, system.users);
      all = all.filter(isVisible);
      if (results) results = results.filter(isVisible);
    }

    res.render('list', {
      key, config, all, results,
      keyword: req.query.keyword || '',
      message: message || res.locals.message,
      error: error || res.locals.error,
      displayValue
    });
  };

  function renderForm(req, res, formData, id, error) {
    const fields = { key, config, formData, id, options: optionsFor(req) };
    res.render('form', error === undefined ? fields : Object.assign(fields, { error }));
  }

  app.get('/' + key, (req, res) => list(req, res));

  app.get('/' + key + '/new', (req, res) => {
    canManage(req, key);
    renderForm(req, res, {}, null);
  });

  app.get('/' + key + '/:id/edit', (req, res) => {
    const record = manager.findById(req.numericId);
    canManage(req, key, record);
    if (!record) {
      return list(req, res, '', config.single + ' not found.');
    }
    renderForm(req, res, record, record[config.id]);
  });

  const save = (req, res, id) => {
    canManage(req, key, id ? manager.findById(id) : null);
    try {
      const data = {};
      // Accept configured fields only; sellers cannot submit another seller ID.
      config.fields.forEach(f => {
        data[f.name] = req.body[f.name];
      });
      if (key === 'products' && req.user.role === 'Seller') {
        data.sellerId = req.user.userId;
      }
      manager.save(id, data);
      list(req, res, config.single + (id ? ' was updated.' : ' was added.'));
    } catch (error) {
      renderForm(req, res.status(400), req.body, id, error.message);
    }
  };

  app.post('/' + key, (req, res) => save(req, res, null));

  app.post('/' + key + '/:id/edit', (req, res) => {
    save(req, res, req.numericId);
  });

  app.get('/' + key + '/:id/delete', (req, res) => {
    const record = manager.findById(req.numericId);
    canManage(req, key, record);
    if (!record) {
      return list(req, res, '', config.single + ' not found.');
    }
    res.render('confirm', {
      title: 'Delete ' + config.single,
      action: '/' + key + '/' + record[config.id] + '/delete',
      back: '/' + key,
      details: [config.id]
        .concat(config.fields.filter(f => f.type !== 'password').map(f => f.name))
        .map(name => [name, displayValue(record, name)])
    });
  });

  app.post('/' + key + '/:id/delete', (req, res) => {
    canManage(req, key, manager.findById(req.numericId));
    try {
      if (config.id === 'userId' && req.numericId === req.user.userId) {
        throw new BadRequestError('You cannot delete your signed-in account here.');
      }
      manager.delete(req.numericId);
      list(req, res, config.single + ' was deleted.');
    } catch (error) {
      list(req, res, '', error.message);
    }
  });
});

app.get('/cart', (req, res) => {
  requireRole(req, ['Customer']);
  const cart = system.carts.get(req.user.userId);
  const items = cart.items.map(i =>
    Object.assign({}, i, { product: system.products.findById(i.productId) })
  );
  const total = items.reduce((sum, i) => sum + i.quantity * i.product.price, 0);
  res.render('cart', { items, total });
});

app.post('/cart/items', validateCartItem, (req, res) => {
  requireRole(req, ['Customer']);
  system.carts.setItem(
    req.user.userId,
    req.body.productId,
    req.body.quantity,
    req.body.operation === 'add'
  );
  req.flash('success', 'Cart updated.');
  res.redirect('/cart');
});

app.get('/cart/clear', (req, res) => {
  requireRole(req, ['Customer']);
  res.render('confirm', {
    title: 'Clear cart',
    action: '/cart/clear',
    back: '/cart',
    details: [['Items', system.carts.get(req.user.userId).items.length]]
  });
});

app.post('/cart/clear', (req, res) => {
  requireRole(req, ['Customer']);
  system.carts.clear(req.user.userId);
  req.flash('success', 'Cart cleared.');
  res.redirect('/cart');
});

app.post('/checkout', (req, res) => {
  requireRole(req, ['Customer']);
  const order = system.orders.checkout(req.user.userId);
  req.flash('success', 'Order #' + order.orderId + ' placed successfully!');
  res.redirect('/orders/' + order.orderId);
});

app.get('/orders', signInRequired, (req, res) => {
  const keyword = String(req.query.keyword || '').toLowerCase();
  const all = system.orders.getAll().filter(order => canViewOrder(req.user, order));
  const results = all.filter(o =>
    (o.orderId + ' ' + o.orderStatus).toLowerCase().includes(keyword)
  );
  res.render('orders', { all, results, keyword });
});

app.get('/orders/:id', (req, res) => {
  res.render('order', {
    order: orderAccess(req, req.numericId),
    payments: system.payments.findByOrder(req.numericId),
    system
  });
});

app.post('/orders/:id/status', validateOrderStatus, (req, res) => {
  const order = orderAccess(req, req.numericId);
  if (req.user.role === 'Customer' && req.body.orderStatus !== 'Cancelled') {
    throw new ForbiddenError('Customers may only cancel pending orders.');
  }
  system.orders.updateStatus(order.orderId, req.body.orderStatus);
  req.flash('success', 'Order status updated to ' + req.body.orderStatus + '.');
  res.redirect('/orders/' + order.orderId);
});

app.get('/orders/:id/delete', (req, res) => {
  const order = orderAccess(req, req.numericId);
  requireRole(req, ['Admin', 'Customer']);
  res.render('confirm', {
    title: 'Delete cancelled order',
    action: '/orders/' + order.orderId + '/delete',
    back: '/orders/' + order.orderId,
    details: Object.keys(order)
      .filter(k => k !== 'items')
      .map(k => [k, order[k]])
  });
});

app.post('/orders/:id/delete', (req, res) => {
  const order = orderAccess(req, req.numericId);
  requireRole(req, ['Admin', 'Customer']);
  system.orders.delete(order.orderId);
  req.flash('success', 'Order deleted.');
  res.redirect('/orders');
});

app.post('/orders/:id/pay', validatePayment, (req, res) => {
  const order = orderAccess(req, req.numericId);
  requireRole(req, ['Customer']);
  const payment = system.payments.makePayment(order.orderId, req.body.outcome);
  if (payment.paymentStatus === 'Failed') {
    req.flash('error', 'Payment failed. You can try again.');
  } else {
    req.flash('success', 'Payment processed.');
  }
  res.redirect('/orders/' + order.orderId);
});

app.get('/payments', signInRequired, (req, res) => {
  const keyword = String(req.query.keyword || '').toLowerCase();
  const all = system.payments.getAll().filter(payment =>
    canViewOrder(req.user, system.orders.findById(payment.orderId))
  );
  const results = all.filter(p =>
    (p.paymentId + ' ' + p.orderId + ' ' + p.paymentStatus)
      .toLowerCase()
      .includes(keyword)
  );
  res.render('payments', { all, results, keyword });
});

app.get('/payments/:id/delete', (req, res) => {
  const payment = paymentAccess(req);
  res.render('confirm', {
    title: 'Delete failed payment attempt',
    action: '/payments/' + payment.paymentId + '/delete',
    back: '/payments',
    details: Object.keys(payment).map(k => [k, payment[k]])
  });
});

app.post('/payments/:id/delete', (req, res) => {
  const payment = paymentAccess(req);
  system.payments.delete(payment.paymentId);
  req.flash('success', 'Payment record deleted.');
  res.redirect('/payments');
});

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(PORT, '127.0.0.1', () => {
  console.log('OLMS running at http://localhost:' + server.address().port);
});
