export class Cart {
  constructor(cartId, customerId, items = []) {
    this.cartId = cartId;
    this.customerId = customerId;
    this.items = items;
  }
  calculateTotal(products) {
    return Math.round(this.items.reduce((total, item) => {
      const product = products.find(p => p.productId === item.productId);
      return total + (product ? product.price * item.quantity : 0);
    }, 0) * 100) / 100;
  }
}
