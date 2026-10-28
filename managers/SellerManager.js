import { BaseManager } from './BaseManager.js';
import { Seller } from '../models/Seller.js';

export class SellerManager extends BaseManager {
  constructor() {
    super(Seller, ['name', 'email', 'storeName']);
  }
}
