import { BaseManager } from './BaseManager.js';
import { Product } from '../models/Product.js';

export class ProductManager extends BaseManager {
  constructor() {
    super(Product, ['productName']);
  }
}
