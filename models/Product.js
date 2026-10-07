// Product object: attributes with data types, getters and setters
export class Product {
  constructor(productId, productName, price, stockQuantity, category) {
    this.productId = productId;
    this.productName = productName;
    this.price = price;
    this.stockQuantity = stockQuantity;
    this.category = category;
  }

  get productId() { return this._productId; }
  set productId(productId) {
    if (!Number.isInteger(productId)) throw new Error('Product ID must be a whole number.');
    this._productId = productId;
  }

  get productName() { return this._productName; }
  set productName(productName) {
    if (typeof productName !== 'string' || productName.trim() === '') {
      throw new Error('Product name is required.');
    }
    this._productName = productName.trim();
  }

  get price() { return this._price; }
  set price(price) {
    if (typeof price !== 'number' || isNaN(price) || price <= 0) {
      throw new Error('Price must be a number above 0.');
    }
    this._price = price;
  }

  get stockQuantity() { return this._stockQuantity; }
  set stockQuantity(stockQuantity) {
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
      throw new Error('Stock quantity must be a whole number, 0 or more.');
    }
    this._stockQuantity = stockQuantity;
  }

  get category() { return this._category; }
  set category(category) {
    if (typeof category !== 'string' || category.trim() === '') {
      throw new Error('Category is required.');
    }
    this._category = category.trim();
  }
}
