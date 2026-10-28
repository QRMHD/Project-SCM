import { User } from './User.js';
import { required } from './Validation.js';
export class Customer extends User {
  constructor(data) {
    super(data);
    this.role = 'Customer';
    this.phone = required(data.phone, 'Phone');
    if (!/^[0-9+\- ]{7,20}$/.test(this.phone)) throw new Error('Enter a valid phone number.');
    this.address = required(data.address, 'Address');
  }
}
