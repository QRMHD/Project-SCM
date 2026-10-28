import { Cart } from '../models/Cart.js';
import { positiveId } from '../models/Validation.js';
export class CartManager {
  constructor(store, products) { this.store = store; this.products = products; }
  get(customerId) {
    // Reading an absent cart returns an empty cart without persisting it.
    return this.store.data.carts.find(c => c.customerId === customerId) || new Cart(0, customerId);
  }
  setItem(customerId, productId, quantity, isAdding = false) {
    return this.store.transaction(() => {
      const customer = this.store.data.users.find(u => u.userId === customerId && u.role === 'Customer');
      if (!customer) throw new Error('Customer not found.');
      const product = this.products.findById(productId);
      if (!product) throw new Error('Product not found.');
      let cart = this.get(customerId);
      if (!cart.cartId) { cart = new Cart(this.store.nextId('cart'), customerId); this.store.data.carts.push(cart); }
      const existing = cart.items.find(i => i.productId === product.productId);
      // Setting zero removes an item; adding increments the existing quantity.
      if (Number(quantity) === 0 && !isAdding) { cart.items = cart.items.filter(i => i.productId !== product.productId); return cart; }
      const amount = positiveId(quantity, 'Quantity') + (isAdding && existing ? existing.quantity : 0);
      const seller = this.store.data.users.find(u => u.userId === product.sellerId);
      if (!seller || seller.accountStatus !== 'Approved') throw new Error('Seller is not approved.');
      if (cart.items.some(i => this.products.findById(i.productId).sellerId !== product.sellerId)) throw new Error('Use one seller per order. Checkout or clear the current cart first.');
      if (amount > product.stockQuantity) throw new Error('Not enough stock.');
      if (existing) existing.quantity = amount;
      else cart.items.push({ productId: product.productId, quantity: amount });
      return cart;
    });
  }
  clear(customerId) { return this.store.transaction(() => { this.store.data.carts = this.store.data.carts.filter(c => c.customerId !== customerId); }); }
}
