export function required(value, label) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(label + ' is required.');
  return value.trim();
}
export function positiveId(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 1) throw new Error(label + ' must be a positive integer.');
  return number;
}
export function stockValue(value) {
  if (!/^[0-9]+$/.test(String(value))) throw new Error('Stock must be a whole number, 0 or more.');
  const number = Number(value);
  if (!Number.isSafeInteger(number)) throw new Error('Stock is too large.');
  return number;
}
