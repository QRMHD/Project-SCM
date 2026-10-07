import { Product } from '../models/Product.js';

// Holds all products and has the Create, Search, Edit, Delete and Display functions
export class ProductManager {
  constructor() {
    this.products = [];
    this.lastProductId = 0;
  }

  // 1. Create
  createProduct(productName, price, stockQuantity, category) {
    const product = new Product(this.lastProductId + 1, productName, price, stockQuantity, category);
    this.lastProductId += 1;
    this.products.push(product);
    return product;
  }

  // 2. Search: the keyword matches product name or category
  searchProducts(keyword) {
    const text = keyword.trim().toLowerCase();
    return this.products.filter(
      (p) => p.productName.toLowerCase().includes(text) || p.category.toLowerCase().includes(text)
    );
  }

  findProductById(productId) {
    return this.products.find((p) => p.productId === productId);
  }

  // 3. Edit: returns the edited product, or null if not found
  editProduct(productId, productName, price, stockQuantity, category) {
    const index = this.products.findIndex((p) => p.productId === productId);
    if (index === -1) return null;

    // A new Product checks all values first, so a bad value changes nothing
    const editedProduct = new Product(productId, productName, price, stockQuantity, category);
    this.products[index] = editedProduct;
    return editedProduct;
  }

  // 4. Delete: returns true if deleted, false if not found
  deleteProduct(productId) {
    const index = this.products.findIndex((p) => p.productId === productId);
    if (index === -1) return false;
    this.products.splice(index, 1);
    return true;
  }

  // 5. Display: get all products
  getAllProducts() {
    return this.products;
  }
}
