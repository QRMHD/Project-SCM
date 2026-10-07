import { checkId, checkText, checkEmail, createError } from '../utils/validation.js';

// Base class for Customer and Seller. There is no separate User CRUD screen.
export default class User {
    constructor(userId, name, email, passwordHash) {
        if (new.target === User) {
            throw createError('Create a Customer or Seller instead of a plain User.');
        }
        this.userId = checkId(userId, 'User ID');
        this.setName(name);
        this.setEmail(email);
        this.passwordHash = passwordHash;
    }

    getUserId() { return this.userId; }
    getName() { return this.name; }
    getEmail() { return this.email; }

    setName(name) {
        this.name = checkText(name, 'Name');
    }

    setEmail(email) {
        this.email = checkEmail(email);
    }

    updateProfile(name, email) {
        const validName = checkText(name, 'Name');
        const validEmail = checkEmail(email);
        this.name = validName;
        this.email = validEmail;
    }

    getPublicData() {
        return { userId: this.userId, name: this.name, email: this.email };
    }
}
