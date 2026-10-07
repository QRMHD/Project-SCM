import { randomBytes, scryptSync } from 'node:crypto';
import { createError } from './validation.js';

export function hashPassword(password) {
    if (typeof password !== 'string' || password.trim().length < 8 || password.length > 100) {
        throw createError('Password must contain 8 to 100 characters.');
    }
    // Store a salted hash, never the original password.
    const salt = randomBytes(16).toString('hex');
    const passwordHash = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${passwordHash}`;
}
