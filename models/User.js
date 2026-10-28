import crypto from 'crypto';
import { required, positiveId } from './Validation.js';
export class User {
  constructor(data) {
    if (new.target === User) throw new Error('Create a Customer, Seller or Admin.');
    this.userId = positiveId(data.userId, 'User ID');
    this.name = required(data.name, 'Name');
    this.email = required(data.email, 'Email').toLowerCase();
    if (!/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(this.email)) throw new Error('Enter a valid email.');
    this.passwordHash = data.passwordHash || '';
    if (data.password) this.setPassword(data.password);
    if (!this.passwordHash) throw new Error('Password is required.');
  }
  setPassword(password) {
    if (typeof password !== 'string' || password.length < 8) throw new Error('Password needs at least 8 characters.');
    const salt = crypto.randomBytes(16).toString('hex');
    this.passwordHash = salt + ':' + crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex');
  }
  login(password) {
    const parts = this.passwordHash.split(':');
    const actual = crypto.pbkdf2Sync(String(password), parts[0], 100000, 32, 'sha256');
    return crypto.timingSafeEqual(actual, Buffer.from(parts[1], 'hex'));
  }
  updateProfile(name, email) {
    const updated = new this.constructor(Object.assign({}, this, { name, email }));
    this.name = updated.name;
    this.email = updated.email;
  }
}
