import { Product } from '../models/Product.js';
export class ProductManager {
  constructor(store) { this.store = store; }
  getAll() { return this.store.data.products; }
  findById(id) { return this.getAll().find(p => p.productId === Number(id)); }
  search(keyword) {
    const text = String(keyword).toLowerCase();
    return this.getAll().filter(p => {
      const category = this.store.data.categories.find(c => c.categoryId === p.categoryId);
      return (p.productId + ' ' + p.productName + ' ' + (category ? category.categoryName : '')).toLowerCase().includes(text);
    });
  }
  save(id, data) {
    return this.store.transaction(() => {
      const old = id ? this.findById(id) : null;
      if (id && !old) throw new Error('Product not found.');
      const product = new Product(Object.assign({}, data, { productId: old ? old.productId : this.store.nextId('product') }));
      if (!this.store.data.categories.some(c => c.categoryId === product.categoryId)) throw new Error('Category not found.');
      if (!this.store.data.users.some(u => u.userId === product.sellerId && u.role === 'Seller' && u.accountStatus === 'Approved')) throw new Error('Choose an approved seller.');
      if (old && old.sellerId !== product.sellerId && (this.store.data.orders.some(o => o.items.some(i => i.productId === old.productId)) || this.store.data.carts.some(c => c.items.some(i => i.productId === old.productId)))) throw new Error('Cannot reassign a product used in a cart or order.');
      if (old) this.getAll()[this.getAll().indexOf(old)] = product;
      else this.getAll().push(product);
      return product;
    });
  }
  delete(id) {
    // Preserve products referenced by carts or historical orders.
    return this.store.transaction(() => {
      const product = this.findById(id);
      if (!product) throw new Error('Product not found.');
      if (this.store.data.carts.some(c => c.items.some(i => i.productId === product.productId)) || this.store.data.orders.some(o => o.items.some(i => i.productId === product.productId))) throw new Error('Product is linked to a cart or order.');
      this.getAll().splice(this.getAll().indexOf(product), 1);
    });
  }
}
