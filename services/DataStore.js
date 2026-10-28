import fs from 'fs';
import path from 'path';
export class DataStore {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = { users: [], products: [], categories: [], carts: [], orders: [], payments: [], counters: {} };
    if (fs.existsSync(filePath)) {
      const saved = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      if (saved.users) this.data = saved;
      // Reject populated legacy files instead of silently discarding records.
      else if (Object.keys(saved).some(key => Array.isArray(saved[key]) && saved[key].length)) {
        throw new Error('Old data format contains records. Back up and migrate it before starting.');
      }
    }
  }
  nextId(key) {
    this.data.counters[key] = (this.data.counters[key] || 0) + 1;
    return this.data.counters[key];
  }
  // Roll back memory too if validation or file writing fails.
  transaction(action) {
    const original = JSON.stringify(this.data);
    try { const result = action(); this.save(); return result; }
    catch (error) { this.data = JSON.parse(original); throw error; }
  }
  save() {
    // Write a temporary file before replacing the current data file.
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.writeFileSync(this.filePath + '.tmp', JSON.stringify(this.data, null, 2));
    fs.renameSync(this.filePath + '.tmp', this.filePath);
  }
}
