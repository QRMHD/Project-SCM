// Local lab simulation only. No bank, card or external API is contacted.
export class PaymentGateway {
  processPayment(amount, outcome) {
    if (!Number.isFinite(amount) || amount <= 0) throw new Error('Invalid payment amount.');
    if (['Success', 'Failed'].indexOf(outcome) === -1) throw new Error('Choose a simulation result.');
    return outcome;
  }
}
