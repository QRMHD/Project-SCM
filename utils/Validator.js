// Shared checks used by the setters of every model
export class Validator {
  static text(value, label) {
    if (typeof value !== 'string' || value.trim() === '') {
      throw new Error(`${label} is required.`);
    }
    return value.trim();
  }

  static integer(value, label, min = 0) {
    if (!Number.isInteger(value) || value < min) {
      throw new Error(`${label} must be a whole number, ${min} or more.`);
    }
    return value;
  }

  static number(value, label) {
    if (typeof value !== 'number' || isNaN(value) || value <= 0) {
      throw new Error(`${label} must be a number above 0.`);
    }
    return value;
  }

  static email(value) {
    if (typeof value !== 'string' || !value.includes('@')) {
      throw new Error('Enter a valid email.');
    }
    return value.trim();
  }

  static phone(value) {
    if (typeof value !== 'string' || !/^[0-9+\- ]{7,15}$/.test(value.trim())) {
      throw new Error('Phone must have 7 to 15 digits.');
    }
    return value.trim();
  }

  static oneOf(value, label, list) {
    if (!list.includes(value)) {
      throw new Error(`${label} must be one of: ${list.join(', ')}.`);
    }
    return value;
  }
}
