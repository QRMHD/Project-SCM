import { RoleManager } from './RoleManager.js';

export class CustomerManager extends RoleManager {
  constructor(users) {
    super(users, 'Customer');
  }
}
