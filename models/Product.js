import { required, positiveId, stockValue } from './Validation.js';
export class Product {
  constructor(data) {
    this.productId = positiveId(data.productId, 'Product ID');
    this.productName = required(data.productName, 'Product name');
    this.price = Number(data.price);
    if (!Number.isFinite(this.price) || this.price <= 0 || this.price > 1000000) throw new Error('Price must be above 0 and at most RM 1,000,000.');
    this.price = Math.round(this.price * 100) / 100;
    // A positive input can still round below the minimum currency amount.
    if (this.price <= 0) throw new Error('Minimum price is RM 0.01.');
    this.stockQuantity = stockValue(data.stockQuantity);
    this.categoryId = positiveId(data.categoryId, 'Category');
    this.sellerId = positiveId(data.sellerId, 'Seller');
  }
  updateStock(quantity) { this.stockQuantity = stockValue(quantity); }
}
