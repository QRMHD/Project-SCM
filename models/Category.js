import { checkId, checkText } from '../utils/validation.js';

export default class Category {
    constructor(categoryId, categoryName) {
        this.categoryId = checkId(categoryId, 'Category ID');
        this.setCategoryName(categoryName);
    }

    getCategoryId() {
        return this.categoryId;
    }

    getCategoryName() {
        return this.categoryName;
    }

    setCategoryName(categoryName) {
        this.categoryName = checkText(categoryName, 'Category name');
    }
}
