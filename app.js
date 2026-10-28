import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { System } from './services/System.js';
import { forms } from './services/Forms.js';
const ROOT = path.resolve(process.env.OLMS_APP_ROOT || '.');
const PORT = Number(process.env.PORT || 3000);
const app = express();
const system = new System(process.env.OLMS_DATA_FILE || path.join(ROOT, 'data/olms.json'));
const sessions = new Map();
app.set('view engine', 'ejs');
app.set('views', path.join(ROOT, 'views'));
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(ROOT, 'public')));
// Small local session implementation for the lab's login use case.
app.use((req, res, next) => {
  const match = (req.headers.cookie || '').match(/(?:^|; )olms=([a-f0-9]+)/);
  const session = match ? sessions.get(match[1]) : null;
  req.user = session && session.expires > Date.now() ? system.users.findById(session.userId) : null;
  req.sessionToken = match ? match[1] : null;
  res.locals.user = req.user;
  res.locals.message = '';
  res.locals.error = '';
  res.locals.money = value => Number(value).toFixed(2);
  next();
});
function requireRole(req, roles) {
  if (!req.user || roles.indexOf(req.user.role) === -1) throw new Error('Please sign in with an authorised account.');
}
function startSession(res, user) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { userId: user.userId, expires: Date.now() + 8 * 60 * 60 * 1000 });
  res.setHeader('Set-Cookie', 'olms=' + token + '; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800');
}
function orderAccess(req, id) {
  requireRole(req, ['Admin', 'Seller', 'Customer']);
  const order = system.orders.findById(id);
  if (!order || (req.user.role === 'Customer' && order.customerId !== req.user.userId) || (req.user.role === 'Seller' && order.sellerId !== req.user.userId)) throw new Error('Order not found.');
  return order;
}
app.get('/', (req, res) => res.redirect('/products'));
app.get('/login', (req, res) => res.render('login'));
app.post('/login', (req, res) => {
  try {
    const user = system.users.login(req.body.email, req.body.password);
    if (req.sessionToken) sessions.delete(req.sessionToken);
    startSession(res, user);
    res.redirect('/products');
  } catch (error) { res.status(400).render('login', { error: error.message }); }
});
app.post('/logout', (req, res) => {
  sessions.delete(req.sessionToken);
  res.setHeader('Set-Cookie', 'olms=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
  res.redirect('/login');
});
app.get('/register', (req, res) => res.render('register', { formData: {} }));
app.post('/register', (req, res) => {
  try {
    if (['Customer', 'Seller'].indexOf(req.body.role) === -1) throw new Error('Select Customer or Seller.');
    const data = Object.assign({}, req.body, { accountStatus: 'Pending' });
    system.users.create(req.body.role, data);
    res.render('login', { message: 'Account created. Sellers need administrator approval before adding products.' });
  } catch (error) { res.status(400).render('register', { error: error.message, formData: req.body }); }
});
app.get('/profile', (req, res) => {
  requireRole(req, ['Admin', 'Seller', 'Customer']);
  res.render('profile', { formData: req.user });
});
app.post('/profile', (req, res) => {
  requireRole(req, ['Admin', 'Seller', 'Customer']);
  try {
    const data = { name: req.body.name, email: req.body.email, password: req.body.password };
    if (req.user.role === 'Customer') Object.assign(data, { phone: req.body.phone, address: req.body.address });
    const user = system.users.edit(req.user.role, req.user.userId, data);
    res.locals.user = user;
    res.render('profile', { formData: user, message: 'Profile updated.' });
  } catch (error) { res.status(400).render('profile', { formData: req.body, error: error.message }); }
});
function optionsFor(req) {
  return {
    categoryId: system.categories.getAll().map(c => ({ value: c.categoryId, label: c.categoryName })),
    sellerId: system.users.getAll('Seller').filter(s => s.accountStatus === 'Approved' && (req.user.role === 'Admin' || s.userId === req.user.userId)).map(s => ({ value: s.userId, label: s.name })),
    accountStatus: ['Pending', 'Approved', 'Rejected'].map(s => ({ value: s, label: s }))
  };
}
function canManage(req, key, record) {
  requireRole(req, key === 'products' ? ['Admin', 'Seller'] : ['Admin']);
  if (req.user.role === 'Seller' && (req.user.accountStatus !== 'Approved' || (record && record.sellerId !== req.user.userId))) throw new Error('You can only manage your own products after approval.');
}
function displayValue(record, name) {
  if (name === 'price') return Number(record[name]).toFixed(2);
  if (name === 'categoryId') { const c = system.categories.findById(record[name]); return c ? c.categoryName : ''; }
  if (name === 'sellerId') { const s = system.users.findById(record[name]); return s ? s.name : ''; }
  return record[name];
}
Object.keys(forms).forEach(key => {
  const config = forms[key];
  const manager = system[key];
  const list = (req, res, message = '', error = '') => {
    if (key !== 'products') requireRole(req, ['Admin']);
    let all = manager.getAll();
    let results = req.query.keyword === undefined ? null : manager.search(req.query.keyword);
    if (key === 'products' && (!req.user || req.user.role === 'Customer')) {
      const visible = p => { const seller = system.users.findById(p.sellerId); return seller && seller.accountStatus === 'Approved'; };
      all = all.filter(visible);
      if (results) results = results.filter(visible);
    }
    res.render('list', { key, config, all, results, keyword: req.query.keyword || '', message, error, displayValue });
  };
  app.get('/' + key, (req, res) => list(req, res));
  app.get('/' + key + '/new', (req, res) => {
    canManage(req, key);
    res.render('form', { key, config, formData: {}, options: optionsFor(req), id: null });
  });
  app.get('/' + key + '/:id/edit', (req, res) => {
    const record = manager.findById(req.params.id);
    canManage(req, key, record);
    if (!record) return list(req, res, '', config.single + ' not found.');
    res.render('form', { key, config, formData: record, options: optionsFor(req), id: record[config.id] });
  });
  const save = (req, res, id) => {
    canManage(req, key, id ? manager.findById(id) : null);
    try {
      const data = {};
      config.fields.forEach(f => { data[f.name] = req.body[f.name]; });
      if (key === 'products' && req.user.role === 'Seller') data.sellerId = req.user.userId;
      manager.save(id, data);
      list(req, res, config.single + (id ? ' was updated.' : ' was added.'));
    } catch (error) {
      res.status(400).render('form', { key, config, formData: req.body, options: optionsFor(req), id, error: error.message });
    }
  };
  app.post('/' + key, (req, res) => save(req, res, null));
  app.post('/' + key + '/:id/edit', (req, res) => save(req, res, Number(req.params.id)));
  app.get('/' + key + '/:id/delete', (req, res) => {
    const record = manager.findById(req.params.id);
    canManage(req, key, record);
    if (!record) return list(req, res, '', config.single + ' not found.');
    res.render('confirm', { title: 'Delete ' + config.single, action: '/' + key + '/' + record[config.id] + '/delete', back: '/' + key, details: [config.id].concat(config.fields.filter(f => f.type !== 'password').map(f => f.name)).map(name => [name, displayValue(record, name)]) });
  });
  app.post('/' + key + '/:id/delete', (req, res) => {
    canManage(req, key, manager.findById(req.params.id));
    try {
      if (config.id === 'userId' && Number(req.params.id) === req.user.userId) throw new Error('You cannot delete your signed-in account here.');
      manager.delete(req.params.id);list(req, res, config.single + ' was deleted.');
    } catch (error) { list(req, res, '', error.message); }
  });
});
app.get('/cart', (req, res) => {
  requireRole(req, ['Customer']);
  const cart = system.carts.get(req.user.userId);
  const items = cart.items.map(i => Object.assign({}, i, { product: system.products.findById(i.productId) }));
  const total = items.reduce((sum, i) => sum + i.quantity * i.product.price, 0);
  res.render('cart', { items, total });
});
app.post('/cart/items', (req, res) => {
  requireRole(req, ['Customer']);
  system.carts.setItem(req.user.userId, req.body.productId, req.body.quantity, req.body.operation === 'add');
  res.redirect('/cart');
});
app.get('/cart/clear', (req, res) => {
  requireRole(req, ['Customer']);
  res.render('confirm', { title: 'Clear cart', action: '/cart/clear', back: '/cart', details: [['Items', system.carts.get(req.user.userId).items.length]] });
});
app.post('/cart/clear', (req, res) => { requireRole(req, ['Customer']);system.carts.clear(req.user.userId);res.redirect('/cart'); });
app.post('/checkout', (req, res) => {
  requireRole(req, ['Customer']);
  const order = system.orders.checkout(req.user.userId);
  res.redirect('/orders/' + order.orderId);
});
app.get('/orders', (req, res) => {
  requireRole(req, ['Admin', 'Seller', 'Customer']);
  const keyword = String(req.query.keyword || '').toLowerCase();
  const all = system.orders.getAll().filter(o => req.user.role === 'Admin' || (req.user.role === 'Seller' ? o.sellerId : o.customerId) === req.user.userId);
  const results = all.filter(o => (o.orderId + ' ' + o.orderStatus).toLowerCase().includes(keyword));
  res.render('orders', { all, results, keyword });
});
app.get('/orders/:id', (req, res) => res.render('order', { order: orderAccess(req, req.params.id), payments: system.payments.getAll().filter(p => p.orderId === Number(req.params.id)), system }));
app.post('/orders/:id/status', (req, res) => {
  const order = orderAccess(req, req.params.id);
  if (req.user.role === 'Customer' && req.body.orderStatus !== 'Cancelled') throw new Error('Customers may only cancel pending orders.');
  system.orders.updateStatus(order.orderId, req.body.orderStatus);
  res.redirect('/orders/' + order.orderId);
});
app.get('/orders/:id/delete', (req, res) => {
  const order = orderAccess(req, req.params.id);requireRole(req, ['Admin', 'Customer']);
  res.render('confirm', { title: 'Delete cancelled order', action: '/orders/' + order.orderId + '/delete', back: '/orders/' + order.orderId, details: Object.keys(order).filter(k => k !== 'items').map(k => [k, order[k]]) });
});
app.post('/orders/:id/delete', (req, res) => { const order = orderAccess(req, req.params.id);requireRole(req, ['Admin', 'Customer']);system.orders.delete(order.orderId);res.redirect('/orders'); });
app.post('/orders/:id/pay', (req, res) => {
  const order = orderAccess(req, req.params.id);requireRole(req, ['Customer']);
  system.payments.makePayment(order.orderId, req.body.outcome);res.redirect('/orders/' + order.orderId);
});
app.get('/payments', (req, res) => {
  requireRole(req, ['Admin', 'Seller', 'Customer']);
  const keyword = String(req.query.keyword || '').toLowerCase();
  const all = system.payments.getAll().filter(p => { const o = system.orders.findById(p.orderId);return o && (req.user.role === 'Admin' || (req.user.role === 'Seller' ? o.sellerId : o.customerId) === req.user.userId); });
  const results = all.filter(p => (p.paymentId + ' ' + p.orderId + ' ' + p.paymentStatus).toLowerCase().includes(keyword));
  res.render('payments', { all, results, keyword });
});
app.get('/payments/:id/delete', (req, res) => {
  requireRole(req, ['Admin', 'Customer']);
  const payment = system.payments.getAll().find(p => p.paymentId === Number(req.params.id));
  if (!payment) throw new Error('Payment not found.');
  orderAccess(req, payment.orderId);
  res.render('confirm', { title: 'Delete failed payment attempt', action: '/payments/' + payment.paymentId + '/delete', back: '/payments', details: Object.keys(payment).map(k => [k, payment[k]]) });
});
app.post('/payments/:id/delete', (req, res) => {
  requireRole(req, ['Admin', 'Customer']);
  const payment = system.payments.getAll().find(p => p.paymentId === Number(req.params.id));
  if (!payment) throw new Error('Payment not found.');orderAccess(req, payment.orderId);
  system.payments.delete(payment.paymentId);res.redirect('/payments');
});
app.use((req, res) => res.status(404).render('error', { error: 'Page not found.' }));
app.use((error, req, res, next) => res.status(400).render('error', { error: error.message }));
app.listen(PORT, '127.0.0.1', () => console.log('OLMS running at http://localhost:' + PORT));
