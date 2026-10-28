export class SellerManager {
  constructor(users) { this.users = users; }
  getAll() { return this.users.getAll('Seller'); }
  search(keyword) { return this.users.search('Seller', keyword); }
  findById(id) { const user = this.users.findById(id); return user && user.role === 'Seller' ? user : null; }
  save(id, data) { return this.users.save('Seller', id, data); }
  delete(id) { if (!this.findById(id)) throw new Error('Seller not found.'); return this.users.delete(id); }
}
