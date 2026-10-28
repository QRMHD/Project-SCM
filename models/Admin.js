import { User } from './User.js';
export class Admin extends User {
  constructor(data) { super(data); this.role = 'Admin'; }
}
