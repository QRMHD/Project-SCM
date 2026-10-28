export class CustomerManager {
  constructor(users) { this.users = users; }
  getAll() { return this.users.getAll('Customer'); }
  search(keyword) { return this.users.search('Customer', keyword); }
  findById(id) { const user = this.users.findById(id); return user && user.role === 'Customer' ? user : null; }
  save(id, data) { return this.users.save('Customer', id, data); }
  delete(id) { if (!this.findById(id)) throw new Error('Customer not found.'); return this.users.delete(id); }
}
