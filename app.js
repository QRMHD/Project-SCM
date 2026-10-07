import express from 'express';
import { ProductManager } from './managers/ProductManager.js';
import { CustomerManager } from './managers/CustomerManager.js';

const PORT = 3000;
const app = express();
const productManager = new ProductManager();
const customerManager = new CustomerManager();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Starting data so there is something to search, edit and delete
productManager.createProduct('Fresh Milk 1L', 6.5, 40, 'Drinks');
productManager.createProduct('Basmati Rice 5kg', 24.9, 15, 'Groceries');
productManager.createProduct('Dish Soap', 4.2, 30, 'Household');
customerManager.createCustomer('Aisha Rahman', 'aisha@mail.com', '0123456789', '12 Jalan Mawar, Kajang');
customerManager.createCustomer('Daniel Lee', 'daniel@mail.com', '0198765432', '8 Lorong Cempaka, Putrajaya');

app.get('/', (req, res) => res.redirect('/products'));

/* ================= LAB 3: PRODUCT MODULE ================= */

// 5. Display function: shows all products, plus optional search results or edited data
function displayProducts(res, options = {}) {
  res.render('products', {
    products: productManager.getAllProducts(),
    results: null, keyword: '', message: null, highlight: null,
    ...options
  });
}

// Read form text into the right data types
function readProductForm(body) {
  return [body.productName, Number(body.price), parseInt(body.stockQuantity, 10), body.category];
}

app.get('/products', (req, res) => {
  if (req.query.keyword === undefined) return displayProducts(res);
  const results = productManager.searchProducts(req.query.keyword);
  displayProducts(res, { results, keyword: req.query.keyword });
});

app.get('/products/new', (req, res) => {
  res.render('productForm', { title: 'Add product', action: '/products', formData: {}, error: null });
});

app.post('/products', (req, res) => {
  try {
    const product = productManager.createProduct(...readProductForm(req.body));
    displayProducts(res, { message: `Product "${product.productName}" was added.` });
  } catch (error) {
    res.render('productForm', { title: 'Add product', action: '/products', formData: req.body, error: error.message });
  }
});

app.get('/products/:productId/edit', (req, res) => {
  const product = productManager.findProductById(Number(req.params.productId));
  if (!product) return displayProducts(res, { message: 'Product not found.' });
  res.render('productForm', {
    title: 'Edit product', action: `/products/${product.productId}/edit`, formData: product, error: null
  });
});

app.post('/products/:productId/edit', (req, res) => {
  const productId = Number(req.params.productId);
  const action = `/products/${productId}/edit`;
  try {
    const product = productManager.editProduct(productId, ...readProductForm(req.body));
    if (!product) return displayProducts(res, { message: 'Product not found.' });
    displayProducts(res, { message: 'Product was updated. See the new data below.', highlight: product });
  } catch (error) {
    res.render('productForm', { title: 'Edit product', action, formData: req.body, error: error.message });
  }
});

app.get('/products/:productId/delete', (req, res) => {
  const product = productManager.findProductById(Number(req.params.productId));
  if (!product) return displayProducts(res, { message: 'Product not found.' });
  res.render('productDelete', { product });
});

app.post('/products/:productId/delete', (req, res) => {
  const isDeleted = productManager.deleteProduct(Number(req.params.productId));
  displayProducts(res, { message: isDeleted ? 'Product was deleted.' : 'Product not found.' });
});

/* ================= LAB 4: CUSTOMER MODULE ================= */

function displayCustomers(res, options = {}) {
  res.render('customers', {
    customers: customerManager.getAllCustomers(),
    results: null, keyword: '', message: null, highlight: null,
    ...options
  });
}

function readCustomerForm(body) {
  return [body.name, body.email, body.phone, body.address];
}

app.get('/customers', (req, res) => {
  if (req.query.keyword === undefined) return displayCustomers(res);
  const results = customerManager.searchCustomers(req.query.keyword);
  displayCustomers(res, { results, keyword: req.query.keyword });
});

app.get('/customers/new', (req, res) => {
  res.render('customerForm', { title: 'Add customer', action: '/customers', formData: {}, error: null });
});

app.post('/customers', (req, res) => {
  try {
    const customer = customerManager.createCustomer(...readCustomerForm(req.body));
    displayCustomers(res, { message: `Customer "${customer.name}" was added.` });
  } catch (error) {
    res.render('customerForm', { title: 'Add customer', action: '/customers', formData: req.body, error: error.message });
  }
});

app.get('/customers/:customerId/edit', (req, res) => {
  const customer = customerManager.findCustomerById(Number(req.params.customerId));
  if (!customer) return displayCustomers(res, { message: 'Customer not found.' });
  res.render('customerForm', {
    title: 'Edit customer', action: `/customers/${customer.customerId}/edit`, formData: customer, error: null
  });
});

app.post('/customers/:customerId/edit', (req, res) => {
  const customerId = Number(req.params.customerId);
  const action = `/customers/${customerId}/edit`;
  try {
    const customer = customerManager.editCustomer(customerId, ...readCustomerForm(req.body));
    if (!customer) return displayCustomers(res, { message: 'Customer not found.' });
    displayCustomers(res, { message: 'Customer was updated. See the new data below.', highlight: customer });
  } catch (error) {
    res.render('customerForm', { title: 'Edit customer', action, formData: req.body, error: error.message });
  }
});

app.get('/customers/:customerId/delete', (req, res) => {
  const customer = customerManager.findCustomerById(Number(req.params.customerId));
  if (!customer) return displayCustomers(res, { message: 'Customer not found.' });
  res.render('customerDelete', { customer });
});

app.post('/customers/:customerId/delete', (req, res) => {
  const isDeleted = customerManager.deleteCustomer(Number(req.params.customerId));
  displayCustomers(res, { message: isDeleted ? 'Customer was deleted.' : 'Customer not found.' });
});

app.listen(PORT, () => console.log(`OLMS running at http://localhost:${PORT}`));
