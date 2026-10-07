import express from 'express';
import Category from '../models/Category.js';
import { createError, readId, searchRecords } from '../utils/validation.js';

export default function createCategoryRouter(store) {
    const router = express.Router();

    function findCategory(data, categoryId) {
        const category = data.categories.find(item => item.categoryId === categoryId);
        if (!category) throw createError('Category not found.', 404);
        return category;
    }

    function checkUniqueName(data, category) {
        const hasDuplicate = data.categories.some(item => item.categoryId !== category.categoryId &&
            item.categoryName.toLowerCase() === category.categoryName.toLowerCase());
        if (hasDuplicate) throw createError('Category name already exists.', 409);
    }

    router.get('/', (req, res) => {
        res.json(store.readData().categories);
    });

    router.get('/search', (req, res) => {
        res.json(searchRecords(store.readData().categories, req.query.field, req.query.q,
            ['categoryId', 'categoryName']));
    });

    router.get('/:id', (req, res) => {
        res.json(findCategory(store.readData(), readId(req.params.id)));
    });

    router.post('/', (req, res) => {
        const data = store.readData();
        const category = new Category(req.body.categoryId, req.body.categoryName);
        if (data.categories.some(item => item.categoryId === category.categoryId)) {
            throw createError('Category ID already exists.', 409);
        }
        checkUniqueName(data, category);
        data.categories.push(category);
        store.saveData(data);
        res.status(201).json({ message: 'Category created successfully.', record: category });
    });

    router.put('/:id', (req, res) => {
        const categoryId = readId(req.params.id);
        const data = store.readData();
        findCategory(data, categoryId);
        const category = new Category(categoryId, req.body.categoryName);
        checkUniqueName(data, category);
        const index = data.categories.findIndex(item => item.categoryId === categoryId);
        data.categories[index] = category;
        store.saveData(data);
        res.json({ message: 'Category updated successfully.', record: category });
    });

    router.delete('/:id', (req, res) => {
        const categoryId = readId(req.params.id);
        const data = store.readData();
        findCategory(data, categoryId);
        if (data.products.some(product => product.categoryId === categoryId)) {
            throw createError('Category is used by a product. Reassign or delete that product first.', 409);
        }
        data.categories = data.categories.filter(item => item.categoryId !== categoryId);
        store.saveData(data);
        res.json({ message: 'Category deleted successfully.' });
    });

    return router;
}
