import { BaseManager } from './BaseManager.js';
import { Customer } from '../models/Customer.js';

export class CustomerManager extends BaseManager {
  constructor() {
    super(Customer, ['name', 'email']);
  }
}
