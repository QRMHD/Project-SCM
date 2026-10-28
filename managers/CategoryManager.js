import { BaseManager } from './BaseManager.js';
import { Category } from '../models/Category.js';

export class CategoryManager extends BaseManager {
  constructor() {
    super(Category, ['categoryName']);
  }
}
