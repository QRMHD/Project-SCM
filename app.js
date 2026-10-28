import express from 'express';
import { registerCrudRoutes } from './routes/CrudRoutes.js';
import { ProductManager } from './managers/ProductManager.js';
import { CustomerManager } from './managers/CustomerManager.js';
import { CategoryManager } from './managers/CategoryManager.js';
import { SellerManager } from './managers/SellerManager.js';
import { OrderManager } from './managers/OrderManager.js';
import { ORDER_STATUSES } from './models/Order.js';

const PORT = 3000;
const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// One manager per module. OrderManager needs the Customer and Product managers.
const categoryManager = new CategoryManager();
const sellerManager = new SellerManager();
const productManager = new ProductManager();
const customerManager = new CustomerManager();
const orderManager = new OrderManager(customerManager, productManager);

// Starting data so every module has something to show
['Groceries', 'Drinks', 'Household'].forEach((name) => categoryManager.create(name));
sellerManager.create('Hana Yusof', 'hana@farm.com', '0111234567', 'Fresh Farm Store');
productManager.create('Fresh Milk 1L', 6.5, 40, 2, 1);
productManager.create('Basmati Rice 5kg', 24.9, 15, 1, 1);
productManager.create('Dish Soap', 4.2, 30, 3, 1);
customerManager.create('Aisha Rahman', 'aisha@mail.com', '0123456789', '12 Jalan Mawar, Kajang');
customerManager.create('Daniel Lee', 'daniel@mail.com', '0198765432', '8 Lorong Cempaka, Putrajaya');
orderManager.placeOrder(1, 1, 2, '1234123412341234');

const toInt = (text) => parseInt(text, 10);

// Drop-down options come from other modules (this is the integration)
const categoryOptions = () => categoryManager.getAll().map((c) => ({ value: c.categoryId, label: c.categoryName }));
const sellerOptions = () => sellerManager.getAll().map((s) => ({ value: s.sellerId, label: s.storeName }));
const customerOptions = () => customerManager.getAll().map((c) => ({ value: c.customerId, label: c.name }));
const productOptions = () => productManager.getAll().map((p) => ({
  value: p.productId, label: `${p.productName} (RM ${p.price.toFixed(2)}, ${p.stockQuantity} in stock)`
}));

// Lookup helpers for tables
const categoryName = (id) => categoryManager.findById(id)?.categoryName || '-';
const storeName = (id) => sellerManager.findById(id)?.storeName || '-';
const customerName = (id) => customerManager.findById(id)?.name || '-';
const productName = (id) => productManager.findById(id)?.productName || '-';

// Block deleting a record that other modules still use
function stopIfUsed(isUsed, message) {
  if (isUsed) throw new Error(message);
}

const modules = [
  {
    title: 'Products', singular: 'product', path: '/products', idKey: 'productId', manager: productManager,
    description: 'Items for sale. Linked to a category and a seller.',
    searchHint: 'Search by product name',
    columns: [
      { label: 'ID', value: (p) => p.productId },
      { label: 'Product name', value: (p) => p.productName },
      { label: 'Category', value: (p) => categoryName(p.categoryId) },
      { label: 'Seller', value: (p) => storeName(p.sellerId) },
      { label: 'Price (RM)', value: (p) => p.price.toFixed(2) },
      { label: 'Stock', value: (p) => p.stockQuantity }
    ],
    getFields: () => [
      { name: 'productName', label: 'Product name', type: 'text' },
      { name: 'price', label: 'Price (RM)', type: 'number', step: '0.01', parse: Number },
      { name: 'stockQuantity', label: 'Stock quantity', type: 'number', parse: toInt },
      { name: 'categoryId', label: 'Category', type: 'select', options: categoryOptions(), parse: toInt },
      { name: 'sellerId', label: 'Seller', type: 'select', options: sellerOptions(), parse: toInt }
    ],
    remove: (id) => {
      stopIfUsed(orderManager.getAll().some((o) => o.productId === id), 'This product is used in an order, so it cannot be deleted.');
      return productManager.delete(id);
    }
  },
  {
    title: 'Categories', singular: 'category', path: '/categories', idKey: 'categoryId', manager: categoryManager,
    description: 'Groups of products.',
    searchHint: 'Search by category name',
    columns: [
      { label: 'ID', value: (c) => c.categoryId },
      { label: 'Category name', value: (c) => c.categoryName }
    ],
    getFields: () => [{ name: 'categoryName', label: 'Category name', type: 'text' }],
    remove: (id) => {
      stopIfUsed(productManager.getAll().some((p) => p.categoryId === id), 'Products use this category, so it cannot be deleted.');
      return categoryManager.delete(id);
    }
  },
  {
    title: 'Sellers', singular: 'seller', path: '/sellers', idKey: 'sellerId', manager: sellerManager,
    description: 'Local shops that sell products.',
    searchHint: 'Search by name, email or store',
    columns: [
      { label: 'ID', value: (s) => s.sellerId },
      { label: 'Name', value: (s) => s.name },
      { label: 'Store', value: (s) => s.storeName },
      { label: 'Email', value: (s) => s.email },
      { label: 'Phone', value: (s) => s.phone }
    ],
    getFields: () => [
      { name: 'name', label: 'Name', type: 'text' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'phone', label: 'Phone', type: 'text' },
      { name: 'storeName', label: 'Store name', type: 'text' }
    ],
    remove: (id) => {
      stopIfUsed(productManager.getAll().some((p) => p.sellerId === id), 'This seller still has products, so it cannot be deleted.');
      return sellerManager.delete(id);
    }
  },
  {
    title: 'Customers', singular: 'customer', path: '/customers', idKey: 'customerId', manager: customerManager,
    description: 'People who buy products.',
    searchHint: 'Search by name or email',
    columns: [
      { label: 'ID', value: (c) => c.customerId },
      { label: 'Name', value: (c) => c.name },
      { label: 'Email', value: (c) => c.email },
      { label: 'Phone', value: (c) => c.phone },
      { label: 'Address', value: (c) => c.address }
    ],
    getFields: () => [
      { name: 'name', label: 'Name', type: 'text' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'phone', label: 'Phone', type: 'text' },
      { name: 'address', label: 'Address', type: 'text' }
    ],
    remove: (id) => {
      stopIfUsed(orderManager.getAll().some((o) => o.customerId === id), 'This customer has orders, so it cannot be deleted.');
      return customerManager.delete(id);
    }
  },
  {
    title: 'Orders', singular: 'order', path: '/orders', idKey: 'orderId', manager: orderManager,
    description: 'A customer buys a product and pays. Stock updates automatically.',
    searchHint: 'Search by order ID, customer name or status',
    columns: [
      { label: 'ID', value: (o) => o.orderId },
      { label: 'Customer', value: (o) => customerName(o.customerId) },
      { label: 'Product', value: (o) => productName(o.productId) },
      { label: 'Quantity', value: (o) => o.quantity },
      { label: 'Total (RM)', value: (o) => o.totalAmount.toFixed(2) },
      { label: 'Order status', value: (o) => o.orderStatus },
      { label: 'Payment', value: (o) => o.paymentStatus },
      { label: 'Date', value: (o) => o.orderDate.toLocaleDateString() }
    ],
    // Creating an order needs payment details. Editing only changes the status.
    getFields: (isEdit) => isEdit
      ? [{ name: 'orderStatus', label: 'Order status', type: 'select', options: ORDER_STATUSES.map((s) => ({ value: s, label: s })) }]
      : [
          { name: 'customerId', label: 'Customer', type: 'select', options: customerOptions(), parse: toInt },
          { name: 'productId', label: 'Product', type: 'select', options: productOptions(), parse: toInt },
          { name: 'quantity', label: 'Quantity', type: 'number', parse: toInt },
          { name: 'cardNumber', label: 'Card number (16 digits)', type: 'text', hint: 'Demo payment: any 16 digits work. Cards starting with 0000 are declined.' }
        ],
    create: (values) => orderManager.placeOrder(...values),
    edit: (id, values) => orderManager.updateOrderStatus(id, values[0]),
    remove: (id) => orderManager.cancelOrder(id)
  }
];

// Share the module list with every page (used by the menu)
app.use((req, res, next) => {
  res.locals.modules = modules;
  next();
});

// Home page: one card per module
app.get('/', (req, res) => res.render('home'));

modules.forEach((config) => registerCrudRoutes(app, config));

app.listen(PORT, () => console.log(`OLMS running at http://localhost:${PORT}`));
