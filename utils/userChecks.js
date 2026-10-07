import { createError } from './validation.js';

export function checkUniqueUser(data, user, isCreating) {
    const users = data.customers.concat(data.sellers);
    if (isCreating && users.some(item => item.userId === user.userId)) {
        throw createError('User ID already exists in Customer or Seller.', 409);
    }
    const hasDuplicateEmail = users.some(item => item.userId !== user.userId && item.email === user.email);
    if (hasDuplicateEmail) throw createError('Email already exists in Customer or Seller.', 409);
}
