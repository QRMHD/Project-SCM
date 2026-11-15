import { BadRequestError, NotFoundError } from '../middleware/errorHandler.js';
import { Payment } from '../models/Payment.js';
import { PaymentGateway } from '../services/PaymentGateway.js';

export class PaymentManager {

  constructor(store, orders) {
    this.store = store;
    this.orders = orders;
    this.gateway = new PaymentGateway();
  }

  getAll() {
    return this.store.data.payments;
  }

  findById(paymentId) {
    return this.getAll().find(payment => payment.paymentId === Number(paymentId));
  }

  findByOrder(orderId) {
    return this.getAll().filter(payment => payment.orderId === Number(orderId));
  }

  makePayment(orderId, outcome) {
    return this.store.transaction(() => {
      const order = this.orders.findById(orderId);
      if (!order || order.orderStatus !== 'Pending') {
        throw new BadRequestError('Only pending orders can be paid.');
      }

      const status = this.gateway.processPayment(order.totalAmount, outcome);

      const payment = new Payment(
        this.store.nextId('payment'),
        order.orderId,
        order.totalAmount,
        status
      );

      this.getAll().push(payment);

      // Failed attempts stay recorded and leave the order pending for retry.
      if (status === 'Success') {
        order.orderStatus = 'Paid';
      }

      return payment;
    });
  }

  delete(id) {
    return this.store.transaction(() => {
      const payment = this.findById(id);
      if (!payment) {
        throw new NotFoundError('Payment not found.');
      }

      if (payment.paymentStatus !== 'Failed') {
        throw new BadRequestError('Successful payment records cannot be deleted.');
      }

      this.getAll().splice(this.getAll().indexOf(payment), 1);
    });
  }

}
