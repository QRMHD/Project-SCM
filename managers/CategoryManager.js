import { Category } from '../models/Category.js';
export class CategoryManager {
  constructor(store) { this.store = store; }
  getAll() { return this.store.data.categories; }
  findById(id) { return this.getAll().find(c => c.categoryId === Number(id)); }
  search(keyword) { return this.getAll().filter(c => (c.categoryId + ' ' + c.categoryName).toLowerCase().includes(String(keyword).toLowerCase())); }
  save(id, data) {
    return this.store.transaction(() => {
      const old = id ? this.findById(id) : null;
      if (id && !old) throw new Error('Category not found.');
      const category = new Category(Object.assign({}, data, { categoryId: old ? old.categoryId : this.store.nextId('category') }));
      if (this.getAll().some(c => c.categoryId !== category.categoryId && c.categoryName.toLowerCase() === category.categoryName.toLowerCase())) throw new Error('Category already exists.');
      if (old) this.getAll()[this.getAll().indexOf(old)] = category;
      else this.getAll().push(category);
      return category;
    });
  }
  delete(id) {
    return this.store.transaction(() => {
      const category = this.findById(id);
      if (!category) throw new Error('Category not found.');
      if (this.store.data.products.some(p => p.categoryId === category.categoryId)) throw new Error('Category is used by a product.');
      this.getAll().splice(this.getAll().indexOf(category), 1);
    });
  }
}
