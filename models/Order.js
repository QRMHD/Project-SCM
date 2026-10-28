export class Order {
  constructor(orderId, customerId, sellerId, items, address) {
    this.orderId = orderId;
    this.customerId = customerId;
    this.sellerId = sellerId;
    this.orderDate = new Date().toISOString();
    this.items = items;
    this.address = address;
    this.totalAmount = Math.round(items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100;
    this.orderStatus = 'Pending';
  }
  updateOrderStatus(status) { this.orderStatus = status; }
}
