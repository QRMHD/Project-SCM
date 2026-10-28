import { User } from './User.js';
export class Seller extends User {
  constructor(data) {
    super(data);
    this.role = 'Seller';
    this.accountStatus = data.accountStatus || 'Pending';
    if (['Pending', 'Approved', 'Rejected'].indexOf(this.accountStatus) === -1) throw new Error('Invalid seller status.');
  }
}
