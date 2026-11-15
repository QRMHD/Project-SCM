import { RoleManager } from './RoleManager.js';

export class AdminManager extends RoleManager {
  constructor(users) {
    super(users, 'Admin');
  }
}
