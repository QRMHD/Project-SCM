import express from 'express';
import Product from '../models/Product.js';
import { createError, readId, searchRecords } from '../utils/validation.js';

export default function createProductRouter(store) {
    const router = express.Router();

    function findProduct(data, productId) {
        const product = data.products.find(item => item.productId === productId);
        if (!product) throw createError('Product not found.', 404);
        return product;
    }

    function buildProduct(body, productId, data) {
        const product = new Product(productId, body.productName, body.price,
            body.stockQuantity, body.categoryId, body.sellerId);
        if (!data.categories.some(category => category.categoryId === product.categoryId)) {
            throw createError('Category not found. Create or choose an existing category.');
        }
        const seller = data.sellers.find(item => item.userId === product.sellerId);
        if (!seller) throw createError('Seller not found. Create or choose an existing seller.');
        if (seller.accountStatus !== 'Approved') {
            throw createError('The selected seller must have Approved status.');
        }
        return product;
    }

    router.get('/', (req, res) => {
        res.json(store.readData().products);
    });

    router.get('/search', (req, res) => {
        const products = store.readData().products;
        res.json(searchRecords(products, req.query.field, req.query.q, ['productId', 'productName']));
    });

    router.get('/:id', (req, res) => {
        res.json(findProduct(store.readData(), readId(req.params.id)));
    });

    router.post('/', (req, res) => {
        const data = store.readData();
        const product = buildProduct(req.body, req.body.productId, data);
        if (data.products.some(item => item.productId === product.productId)) {
            throw createError('Product ID already exists.', 409);
        }
        data.products.push(product);
        store.saveData(data);
        res.status(201).json({ message: 'Product created successfully.', record: product });
    });

    router.put('/:id', (req, res) => {
        const productId = readId(req.params.id);
        const data = store.readData();
        findProduct(data, productId);
        const product = buildProduct(req.body, productId, data);
        const index = data.products.findIndex(item => item.productId === productId);
        data.products[index] = product;
        store.saveData(data);
        res.json({ message: 'Product updated successfully.', record: product });
    });

    router.delete('/:id', (req, res) => {
        const productId = readId(req.params.id);
        const data = store.readData();
        findProduct(data, productId);
        data.products = data.products.filter(item => item.productId !== productId);
        store.saveData(data);
        res.json({ message: 'Product deleted successfully.' });
    });

    return router;
}
