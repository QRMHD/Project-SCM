import { Validator } from '../utils/Validator.js';

export class Customer {
  constructor(customerId, name, email, phone, address) {
    this.customerId = customerId;
    this.name = name;
    this.email = email;
    this.phone = phone;
    this.address = address;
  }

  get customerId() { return this._customerId; }
  set customerId(customerId) { this._customerId = Validator.integer(customerId, 'Customer ID', 1); }

  get name() { return this._name; }
  set name(name) { this._name = Validator.text(name, 'Name'); }

  get email() { return this._email; }
  set email(email) { this._email = Validator.email(email); }

  get phone() { return this._phone; }
  set phone(phone) { this._phone = Validator.phone(phone); }

  get address() { return this._address; }
  set address(address) { this._address = Validator.text(address, 'Address'); }
}
