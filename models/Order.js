import { Validator } from '../utils/Validator.js';

export const ORDER_STATUSES = ['PLACED', 'PACKED', 'SHIPPED', 'DELIVERED'];

export class Order {
  constructor(orderId, customerId, productId, quantity, totalAmount, orderStatus, paymentStatus) {
    this.orderId = orderId;
    this.customerId = customerId;
    this.productId = productId;
    this.quantity = quantity;
    this.totalAmount = totalAmount;
    this.orderStatus = orderStatus;
    this.paymentStatus = paymentStatus;
    this.orderDate = new Date();
  }

  get orderId() { return this._orderId; }
  set orderId(orderId) { this._orderId = Validator.integer(orderId, 'Order ID', 1); }

  get customerId() { return this._customerId; }
  set customerId(customerId) { this._customerId = Validator.integer(customerId, 'Customer', 1); }

  get productId() { return this._productId; }
  set productId(productId) { this._productId = Validator.integer(productId, 'Product', 1); }

  get quantity() { return this._quantity; }
  set quantity(quantity) { this._quantity = Validator.integer(quantity, 'Quantity', 1); }

  get totalAmount() { return this._totalAmount; }
  set totalAmount(totalAmount) { this._totalAmount = Validator.number(totalAmount, 'Total amount'); }

  get orderStatus() { return this._orderStatus; }
  set orderStatus(orderStatus) { this._orderStatus = Validator.oneOf(orderStatus, 'Order status', ORDER_STATUSES); }

  get paymentStatus() { return this._paymentStatus; }
  set paymentStatus(paymentStatus) { this._paymentStatus = Validator.text(paymentStatus, 'Payment status'); }
}
