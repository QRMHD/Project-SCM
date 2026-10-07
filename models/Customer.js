// Customer object: attributes with data types, getters and setters
export class Customer {
  constructor(customerId, name, email, phone, address) {
    this.customerId = customerId;
    this.name = name;
    this.email = email;
    this.phone = phone;
    this.address = address;
  }

  get customerId() { return this._customerId; }
  set customerId(customerId) {
    if (!Number.isInteger(customerId)) throw new Error('Customer ID must be a whole number.');
    this._customerId = customerId;
  }

  get name() { return this._name; }
  set name(name) {
    if (typeof name !== 'string' || name.trim() === '') throw new Error('Name is required.');
    this._name = name.trim();
  }

  get email() { return this._email; }
  set email(email) {
    if (typeof email !== 'string' || !email.includes('@')) throw new Error('Enter a valid email.');
    this._email = email.trim();
  }

  get phone() { return this._phone; }
  set phone(phone) {
    if (typeof phone !== 'string' || !/^[0-9+\- ]{7,15}$/.test(phone.trim())) {
      throw new Error('Phone must have 7 to 15 digits.');
    }
    this._phone = phone.trim();
  }

  get address() { return this._address; }
  set address(address) {
    if (typeof address !== 'string' || address.trim() === '') throw new Error('Address is required.');
    this._address = address.trim();
  }
}
