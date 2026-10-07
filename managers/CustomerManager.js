import { Customer } from '../models/Customer.js';

// Holds all customers and has the Create, Search, Edit, Delete and Display functions
export class CustomerManager {
  constructor() {
    this.customers = [];
    this.lastCustomerId = 0;
  }

  // 1. Create
  createCustomer(name, email, phone, address) {
    const customer = new Customer(this.lastCustomerId + 1, name, email, phone, address);
    this.lastCustomerId += 1;
    this.customers.push(customer);
    return customer;
  }

  // 2. Search: the keyword matches name or email
  searchCustomers(keyword) {
    const text = keyword.trim().toLowerCase();
    return this.customers.filter(
      (c) => c.name.toLowerCase().includes(text) || c.email.toLowerCase().includes(text)
    );
  }

  findCustomerById(customerId) {
    return this.customers.find((c) => c.customerId === customerId);
  }

  // 3. Edit: returns the edited customer, or null if not found
  editCustomer(customerId, name, email, phone, address) {
    const index = this.customers.findIndex((c) => c.customerId === customerId);
    if (index === -1) return null;

    const editedCustomer = new Customer(customerId, name, email, phone, address);
    this.customers[index] = editedCustomer;
    return editedCustomer;
  }

  // 4. Delete: returns true if deleted, false if not found
  deleteCustomer(customerId) {
    const index = this.customers.findIndex((c) => c.customerId === customerId);
    if (index === -1) return false;
    this.customers.splice(index, 1);
    return true;
  }

  // 5. Display: get all customers
  getAllCustomers() {
    return this.customers;
  }
}
