import { checkId, checkText, createError } from '../utils/validation.js';

export default class Product {
    constructor(productId, productName, price, stockQuantity, categoryId, sellerId) {
        this.productId = checkId(productId, 'Product ID');
        this.setProductName(productName);
        this.setPrice(price);
        this.setStockQuantity(stockQuantity);
        this.setCategoryId(categoryId);
        this.setSellerId(sellerId);
    }

    getProductId() { return this.productId; }
    getProductName() { return this.productName; }
    getPrice() { return this.price; }
    getStockQuantity() { return this.stockQuantity; }
    getCategoryId() { return this.categoryId; }
    getSellerId() { return this.sellerId; }

    setProductName(productName) {
        this.productName = checkText(productName, 'Product name');
    }

    setPrice(price) {
        if (typeof price !== 'number' || !Number.isFinite(price) || price < 0 || price > 999999.99) {
            throw createError('Price must be between RM 0.00 and RM 999,999.99.');
        }
        if (Math.abs(price * 100 - Math.round(price * 100)) > 0.000001) {
            throw createError('Price must have at most two decimal places.');
        }
        this.price = Math.round(price * 100) / 100;
    }

    setStockQuantity(stockQuantity) {
        if (!Number.isSafeInteger(stockQuantity) || stockQuantity < 0) {
            throw createError('Stock quantity must be a non-negative whole number.');
        }
        this.stockQuantity = stockQuantity;
    }

    updateStock(stockQuantity) {
        this.setStockQuantity(stockQuantity);
    }

    setCategoryId(categoryId) {
        this.categoryId = checkId(categoryId, 'Category ID');
    }

    setSellerId(sellerId) {
        this.sellerId = checkId(sellerId, 'Seller ID');
    }
}
