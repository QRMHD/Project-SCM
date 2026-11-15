export class RoleManager {
  constructor(users, role) {
    this.users = users;
    this.role = role;
  }

  getAll() {
    return this.users.getAll(this.role);
  }

  search(keyword) {
    return this.users.search(this.role, keyword);
  }

  findById(id) {
    const user = this.users.findById(id);
    return user && user.role === this.role ? user : null;
  }

  save(id, data) {
    return this.users.save(this.role, id, data);
  }

  delete(id) {
    if (!this.findById(id)) {
      throw new Error(this.role + ' not found.');
    }
    return this.users.delete(id);
  }
}
