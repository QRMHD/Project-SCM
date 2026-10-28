export class AdminManager {
  constructor(users) { this.users = users; }
  getAll() { return this.users.getAll('Admin'); }
  search(keyword) { return this.users.search('Admin', keyword); }
  findById(id) { const user = this.users.findById(id); return user && user.role === 'Admin' ? user : null; }
  save(id, data) { return this.users.save('Admin', id, data); }
  delete(id) { if (!this.findById(id)) throw new Error('Admin not found.'); return this.users.delete(id); }
}
