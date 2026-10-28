export class Payment {
  constructor(paymentId, amount) {
    this.paymentId = paymentId;
    this.amount = amount;
    this.paymentStatus = 'PENDING';
  }

  makePayment(gateway, cardNumber) {
    const isSuccess = gateway.processPayment(this.amount, cardNumber);
    this.paymentStatus = isSuccess ? 'PAID' : 'FAILED';
    return isSuccess;
  }
}
