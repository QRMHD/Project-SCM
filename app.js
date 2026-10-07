import express from 'express';
import path from 'node:path';
import DataStore from './models/DataStore.js';
import createProductRouter from './routes/productRoutes.js';
import createCategoryRouter from './routes/categoryRoutes.js';
import createCustomerRouter from './routes/customerRoutes.js';
import createSellerRouter from './routes/sellerRoutes.js';

export default function createApp(dataFile) {
    const app = express();
    const store = new DataStore(dataFile);
    app.disable('x-powered-by');
    app.use(express.json({ limit: '20kb' }));

    app.use('/api', (req, res, next) => {
        res.set('Cache-Control', 'no-store');
        if ((req.method === 'POST' || req.method === 'PUT') &&
            (!req.body || typeof req.body !== 'object' || Array.isArray(req.body))) {
            return res.status(400).json({ message: 'Send a JSON object with the required fields.' });
        }
        next();
    });

    app.use('/api/products', createProductRouter(store));
    app.use('/api/categories', createCategoryRouter(store));
    app.use('/api/customers', createCustomerRouter(store));
    app.use('/api/sellers', createSellerRouter(store));
    app.use('/api', (req, res) => res.status(404).json({ message: 'API route not found.' }));

    app.get('/', (req, res) => res.redirect('/products.html'));
    app.use(express.static(path.join(process.cwd(), 'public')));

    app.use((error, req, res, next) => {
        if (error.type === 'entity.parse.failed') {
            return res.status(400).json({ message: 'Invalid JSON request.' });
        }
        const statusCode = error.statusCode || error.status || 500;
        const message = statusCode >= 500 ? 'Server error. Check the terminal and data file.' : error.message;
        if (statusCode >= 500) console.error(error.message);
        res.status(statusCode).json({ message });
    });
    return app;
}
