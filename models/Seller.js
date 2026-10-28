import { Validator } from '../utils/Validator.js';

export class Seller {
  constructor(sellerId, name, email, phone, storeName) {
    this.sellerId = sellerId;
    this.name = name;
    this.email = email;
    this.phone = phone;
    this.storeName = storeName;
  }

  get sellerId() { return this._sellerId; }
  set sellerId(sellerId) { this._sellerId = Validator.integer(sellerId, 'Seller ID', 1); }

  get name() { return this._name; }
  set name(name) { this._name = Validator.text(name, 'Name'); }

  get email() { return this._email; }
  set email(email) { this._email = Validator.email(email); }

  get phone() { return this._phone; }
  set phone(phone) { this._phone = Validator.phone(phone); }

  get storeName() { return this._storeName; }
  set storeName(storeName) { this._storeName = Validator.text(storeName, 'Store name'); }
}
