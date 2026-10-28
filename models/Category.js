import { Validator } from '../utils/Validator.js';

export class Category {
  constructor(categoryId, categoryName) {
    this.categoryId = categoryId;
    this.categoryName = categoryName;
  }

  get categoryId() { return this._categoryId; }
  set categoryId(categoryId) { this._categoryId = Validator.integer(categoryId, 'Category ID', 1); }

  get categoryName() { return this._categoryName; }
  set categoryName(categoryName) { this._categoryName = Validator.text(categoryName, 'Category name'); }
}
