export class Payment {
  constructor(paymentId, orderId, amount, paymentStatus) {
    this.paymentId = paymentId;
    this.orderId = orderId;
    this.amount = amount;
    this.paymentStatus = paymentStatus;
    this.paymentDate = new Date().toISOString();
  }
}
