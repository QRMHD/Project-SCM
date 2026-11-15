import { RoleManager } from './RoleManager.js';

export class SellerManager extends RoleManager {
  constructor(users) {
    super(users, 'Seller');
  }
}
