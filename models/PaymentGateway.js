// Demo gateway: no real money is used
export class PaymentGateway {
  processPayment(amount, cardNumber) {
    const isValidCard = /^\d{16}$/.test(cardNumber);
    const isDeclinedCard = cardNumber.startsWith('0000'); // test card that always fails
    return amount > 0 && isValidCard && !isDeclinedCard;
  }
}
