import { Validator } from '../utils/Validator.js';

export class Product {
  constructor(productId, productName, price, stockQuantity, categoryId, sellerId) {
    this.productId = productId;
    this.productName = productName;
    this.price = price;
    this.stockQuantity = stockQuantity;
    this.categoryId = categoryId;
    this.sellerId = sellerId;
  }

  get productId() { return this._productId; }
  set productId(productId) { this._productId = Validator.integer(productId, 'Product ID', 1); }

  get productName() { return this._productName; }
  set productName(productName) { this._productName = Validator.text(productName, 'Product name'); }

  get price() { return this._price; }
  set price(price) { this._price = Validator.number(price, 'Price'); }

  get stockQuantity() { return this._stockQuantity; }
  set stockQuantity(stockQuantity) { this._stockQuantity = Validator.integer(stockQuantity, 'Stock quantity'); }

  get categoryId() { return this._categoryId; }
  set categoryId(categoryId) { this._categoryId = Validator.integer(categoryId, 'Category', 1); }

  get sellerId() { return this._sellerId; }
  set sellerId(sellerId) { this._sellerId = Validator.integer(sellerId, 'Seller', 1); }
}
