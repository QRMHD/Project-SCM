import { Customer } from '../models/Customer.js';
import { Seller } from '../models/Seller.js';
import { Admin } from '../models/Admin.js';
export class UserManager {
  constructor(store) { this.store = store; }
  getAll(role) { return this.store.data.users.filter(user => user.role === role); }
  findById(id) { return this.store.data.users.find(user => user.userId === Number(id)); }
  search(role, keyword) {
    const text = String(keyword).toLowerCase();
    return this.getAll(role).filter(user => [user.userId, user.name, user.email].some(value => String(value).toLowerCase().includes(text)));
  }
  create(role, data) { return this.save(role, null, data); }
  edit(role, id, data) { return this.save(role, id, data); }
  save(role, id, data) {
    return this.store.transaction(() => {
      const old = id ? this.findById(id) : null;
      if (id && (!old || old.role !== role)) throw new Error('User not found.');
      const Model = { Customer, Seller, Admin }[role];
      if (!Model) throw new Error('Invalid role.');
      const user = new Model(Object.assign({}, old || {}, data, { userId: old ? old.userId : this.store.nextId('user') }));
      // Email uniqueness applies across all roles after model normalization.
      if (this.store.data.users.some(item => item.userId !== user.userId && item.email === user.email)) throw new Error('Email is already registered.');
      if (old) this.store.data.users[this.store.data.users.indexOf(old)] = user;
      else this.store.data.users.push(user);
      return user;
    });
  }
  delete(id) {
    // Keep an administrator and protect users referenced by products or orders.
    return this.store.transaction(() => {
      const user = this.findById(id);
      if (!user) throw new Error('User not found.');
      if (user.role === 'Admin' && this.getAll('Admin').length === 1) throw new Error('Keep at least one administrator.');
      if (this.store.data.products.some(p => p.sellerId === user.userId) || this.store.data.orders.some(o => o.customerId === user.userId || o.sellerId === user.userId)) throw new Error('This user is linked to products or orders.');
      this.store.data.carts = this.store.data.carts.filter(cart => cart.customerId !== user.userId);
      this.store.data.users.splice(this.store.data.users.indexOf(user), 1);
    });
  }
  login(email, password) {
    const user = this.store.data.users.find(u => u.email === String(email).trim().toLowerCase());
    if (!user) throw new Error('Incorrect email or password.');
    const Model = { Customer, Seller, Admin }[user.role];
    // Restore model methods for user records loaded from JSON.
    if (!new Model(user).login(password)) throw new Error('Incorrect email or password.');
    return user;
  }
}
