import { DataStore } from './DataStore.js';
import { UserManager } from '../managers/UserManager.js';
import { CustomerManager } from '../managers/CustomerManager.js';
import { SellerManager } from '../managers/SellerManager.js';
import { AdminManager } from '../managers/AdminManager.js';
import { ProductManager } from '../managers/ProductManager.js';
import { CategoryManager } from '../managers/CategoryManager.js';
import { CartManager } from '../managers/CartManager.js';
import { OrderManager } from '../managers/OrderManager.js';
import { PaymentManager } from '../managers/PaymentManager.js';
export class System {
  constructor(filePath) {
    this.store = new DataStore(filePath);
    this.users = new UserManager(this.store);
    this.customers = new CustomerManager(this.users);
    this.sellers = new SellerManager(this.users);
    this.admins = new AdminManager(this.users);
    this.products = new ProductManager(this.store);
    this.categories = new CategoryManager(this.store);
    this.carts = new CartManager(this.store, this.products);
    this.orders = new OrderManager(this.store, this.products, this.carts);
    this.payments = new PaymentManager(this.store, this.orders);
    if (!this.store.data.users.length) this.seed();
  }
  seed() {
    this.users.create('Admin', { name: 'OLMS Admin', email: 'admin@olms.test', password: 'Admin123!' });
    const seller = this.users.create('Seller', { name: 'Kajang Local Mart', email: 'seller@olms.test', password: 'Seller123!', accountStatus: 'Approved' });
    this.users.create('Customer', { name: 'Aisha Rahman', email: 'customer@olms.test', password: 'Customer123!', phone: '0123456789', address: '12 Jalan Mawar, Kajang' });
    this.users.create('Customer', { name: 'Daniel Lee', email: 'daniel@olms.test', password: 'Customer123!', phone: '0198765432', address: '8 Lorong Cempaka, Putrajaya' });
    const drinks = this.categories.save(null, { categoryName: 'Drinks' });
    const groceries = this.categories.save(null, { categoryName: 'Groceries' });
    const household = this.categories.save(null, { categoryName: 'Household' });
    [['Fresh Milk 1L', 6.5, 40, drinks], ['Basmati Rice 5kg', 24.9, 15, groceries], ['Dish Soap', 4.2, 30, household]].forEach(row => {
      this.products.save(null, { productName: row[0], price: row[1], stockQuantity: row[2], categoryId: row[3].categoryId, sellerId: seller.userId });
    });
  }
}
