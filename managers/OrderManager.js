import { BaseManager } from './BaseManager.js';
import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { PaymentGateway } from '../models/PaymentGateway.js';

// Order links the Customer, Product and Payment modules together
export class OrderManager extends BaseManager {
  constructor(customerManager, productManager) {
    super(Order, []);
    this.customerManager = customerManager;
    this.productManager = productManager;
    this.paymentGateway = new PaymentGateway();
  }

  // Create: check stock -> pay -> reduce stock -> save order
  placeOrder(customerId, productId, quantity, cardNumber) {
    const customer = this.customerManager.findById(customerId);
    const product = this.productManager.findById(productId);

    if (!customer || !product) throw new Error('Choose a customer and a product.');
    if (!Number.isInteger(quantity) || quantity < 1) throw new Error('Quantity must be 1 or more.');
    if (product.stockQuantity < quantity) throw new Error(`Only ${product.stockQuantity} in stock.`);

    const totalAmount = product.price * quantity;
    const payment = new Payment(this.lastId + 1, totalAmount);
    if (!payment.makePayment(this.paymentGateway, cardNumber)) {
      throw new Error('Payment failed. Check the card number.');
    }

    product.stockQuantity -= quantity;
    return this.create(customerId, productId, quantity, totalAmount, 'PLACED', payment.paymentStatus);
  }

  // Edit: only the order status can change
  updateOrderStatus(orderId, orderStatus) {
    const order = this.findById(orderId);
    if (!order) return null;
    order.orderStatus = orderStatus;
    return order;
  }

  // Delete: cancel the order and give the stock back
  cancelOrder(orderId) {
    const order = this.findById(orderId);
    if (!order) return false;

    const product = this.productManager.findById(order.productId);
    if (product) product.stockQuantity += order.quantity;
    return this.delete(orderId);
  }

  // Search by order ID, customer name or order status
  search(keyword) {
    const text = keyword.trim().toLowerCase();
    return this.items.filter((order) => {
      const customer = this.customerManager.findById(order.customerId);
      const searchText = `${order.orderId} ${customer ? customer.name : ''} ${order.orderStatus}`;
      return searchText.toLowerCase().includes(text);
    });
  }
}
