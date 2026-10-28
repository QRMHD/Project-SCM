import { required, positiveId } from './Validation.js';
export class Category {
  constructor(data) {
    this.categoryId = positiveId(data.categoryId, 'Category ID');
    this.categoryName = required(data.categoryName, 'Category name');
  }
}
