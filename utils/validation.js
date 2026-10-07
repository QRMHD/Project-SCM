// Shared checks keep the same input rules across the four modules.
export function createError(message, statusCode = 400) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

export function checkId(value, label) {
    if (!Number.isSafeInteger(value) || value <= 0) {
        throw createError(`${label} must be a positive whole number.`);
    }
    return value;
}

export function readId(value) {
    if (typeof value !== 'string' || !/^\d+$/.test(value)) {
        throw createError('ID must be a positive whole number.');
    }
    return checkId(Number(value), 'ID');
}

export function checkText(value, label, maxLength = 80) {
    if (typeof value !== 'string' || !value.trim() || value.trim().length > maxLength) {
        throw createError(`${label} must contain 1 to ${maxLength} characters.`);
    }
    return value.trim();
}

export function checkEmail(value) {
    const email = checkText(value, 'Email', 120).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw createError('Enter a valid email address.');
    }
    return email;
}

export function searchRecords(records, field, query, allowedFields) {
    if (allowedFields.indexOf(field) === -1) {
        throw createError('Choose a valid search field.');
    }
    const searchValue = checkText(query, 'Search value', 120).toLowerCase();
    if (field === 'productId' || field === 'categoryId' || field === 'userId') {
        const searchId = readId(searchValue);
        return records.filter(record => record[field] === searchId);
    }
    return records.filter(record => String(record[field]).toLowerCase().indexOf(searchValue) !== -1);
}
