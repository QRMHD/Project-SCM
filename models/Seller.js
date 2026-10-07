import User from './User.js';
import { createError } from '../utils/validation.js';

const ACCOUNT_STATUSES = ['Pending', 'Approved', 'Rejected'];

export default class Seller extends User {
    constructor(userId, name, email, passwordHash, accountStatus) {
        super(userId, name, email, passwordHash);
        this.setAccountStatus(accountStatus);
    }

    getAccountStatus() {
        return this.accountStatus;
    }

    setAccountStatus(accountStatus) {
        if (ACCOUNT_STATUSES.indexOf(accountStatus) === -1) {
            throw createError('Account status must be Pending, Approved or Rejected.');
        }
        this.accountStatus = accountStatus;
    }

    getPublicData() {
        const data = super.getPublicData();
        data.accountStatus = this.accountStatus;
        return data;
    }
}
