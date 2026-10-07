import User from './User.js';

export default class Customer extends User {
    constructor(userId, name, email, passwordHash) {
        super(userId, name, email, passwordHash);
    }
}
