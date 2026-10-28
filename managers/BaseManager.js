// Create, Search, Edit, Delete and Display functions shared by every module
export class BaseManager {
  constructor(ModelClass, searchFields) {
    this.ModelClass = ModelClass;
    this.searchFields = searchFields; // attributes the keyword is matched against
    this.items = [];
    this.lastId = 0;
  }

  create(...values) {
    const item = new this.ModelClass(this.lastId + 1, ...values);
    this.lastId += 1;
    this.items.push(item);
    return item;
  }

  search(keyword) {
    const text = keyword.trim().toLowerCase();
    return this.items.filter((item) =>
      this.searchFields.some((field) => String(item[field]).toLowerCase().includes(text))
    );
  }

  findById(id) {
    return this.items.find((item) => item[this.idKey()] === id);
  }

  // Returns the edited item, or null if not found
  edit(id, ...values) {
    const index = this.items.findIndex((item) => item[this.idKey()] === id);
    if (index === -1) return null;

    // A new object checks all values first, so a bad value changes nothing
    this.items[index] = new this.ModelClass(id, ...values);
    return this.items[index];
  }

  // Returns true if deleted, false if not found
  delete(id) {
    const index = this.items.findIndex((item) => item[this.idKey()] === id);
    if (index === -1) return false;
    this.items.splice(index, 1);
    return true;
  }

  getAll() {
    return this.items;
  }

  // The ID attribute is the first attribute of the model, e.g. productId
  idKey() {
    const name = this.ModelClass.name;
    return name.charAt(0).toLowerCase() + name.slice(1) + 'Id';
  }
}
