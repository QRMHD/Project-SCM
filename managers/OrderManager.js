import { Order } from '../models/Order.js';
export class OrderManager {
  constructor(store, products, carts) { this.store = store; this.products = products; this.carts = carts; }
  getAll() { return this.store.data.orders; }
  findById(id) { return this.getAll().find(o => o.orderId === Number(id)); }
  checkout(customerId) {
    // Validate, reserve stock, create the order and empty the cart together.
    return this.store.transaction(() => {
      const cart = this.carts.get(customerId);
      if (!cart.items.length) throw new Error('Cart is empty.');
      const customer = this.store.data.users.find(u => u.userId === customerId && u.role === 'Customer');
      if (!customer) throw new Error('Customer not found.');
      const items = cart.items.map(item => {
        // Recheck availability and snapshot names and prices for order history.
        const p = this.products.findById(item.productId);
        if (!p || p.stockQuantity < item.quantity) throw new Error('Stock changed. Update the cart.');
        const seller = this.store.data.users.find(u => u.userId === p.sellerId && u.accountStatus === 'Approved');
        if (!seller) throw new Error('Seller is not approved.');
        return { productId: p.productId, productName: p.productName, price: p.price, quantity: item.quantity };
      });
      const sellerId = this.products.findById(items[0].productId).sellerId;
      if (items.some(i => this.products.findById(i.productId).sellerId !== sellerId)) throw new Error('An order must use one seller.');
      const order = new Order(this.store.nextId('order'), customerId, sellerId, items, customer.address);
      items.forEach(i => { this.products.findById(i.productId).stockQuantity -= i.quantity; });
      this.getAll().push(order);
      cart.items = [];
      return order;
    });
  }
  updateStatus(id, status) {
    return this.store.transaction(() => {
      const order = this.findById(id);
      if (!order) throw new Error('Order not found.');
      const next = { Pending: ['Cancelled'], Paid: ['Processing'], Processing: ['Shipped'], Shipped: ['Completed'], Completed: [], Cancelled: [] };
      // Allowed transitions prevent skipped fulfilment and repeated stock returns.
      if (next[order.orderStatus].indexOf(status) === -1) throw new Error('Invalid order status change.');
      if (status === 'Cancelled') order.items.forEach(i => { this.products.findById(i.productId).stockQuantity += i.quantity; });
      order.orderStatus = status;
      return order;
    });
  }
  delete(id) {
    return this.store.transaction(() => {
      const order = this.findById(id);
      if (!order) throw new Error('Order not found.');
      if (order.orderStatus !== 'Cancelled') throw new Error('Only cancelled orders can be deleted.');
      if (this.store.data.payments.some(p => p.orderId === order.orderId)) throw new Error('Delete failed payment attempts first.');
      this.getAll().splice(this.getAll().indexOf(order), 1);
    });
  }
}
