import express from 'express';
import Seller from '../models/Seller.js';
import { createError, readId, searchRecords } from '../utils/validation.js';
import { hashPassword } from '../utils/password.js';
import { checkUniqueUser } from '../utils/userChecks.js';

export default function createSellerRouter(store) {
    const router = express.Router();

    function findSeller(data, userId) {
        const user = data.sellers.find(item => item.userId === userId);
        if (!user) throw createError('Seller not found.', 404);
        return user;
    }

    function publicData(user) {
        const data = { userId: user.userId, name: user.name, email: user.email };
        data.accountStatus = user.accountStatus;
        return data;
    }

    function buildSeller(body, userId, currentUser = null) {
        let passwordHash;
        // A blank password during editing keeps the saved hash.
        if (currentUser && (body.password === '' || body.password === undefined)) {
            passwordHash = currentUser.passwordHash;
        } else {
            passwordHash = hashPassword(body.password);
        }
        return new Seller(userId, body.name, body.email, passwordHash, body.accountStatus);
    }

    router.get('/', (req, res) => {
        res.json(store.readData().sellers.map(publicData));
    });

    router.get('/search', (req, res) => {
        const users = store.readData().sellers;
        const matches = searchRecords(users, req.query.field, req.query.q, ['userId', 'name', 'email', 'accountStatus']);
        res.json(matches.map(publicData));
    });

    router.get('/:id', (req, res) => {
        res.json(publicData(findSeller(store.readData(), readId(req.params.id))));
    });

    router.post('/', (req, res) => {
        const data = store.readData();
        const user = buildSeller(req.body, req.body.userId);
        checkUniqueUser(data, user, true);
        data.sellers.push(user);
        store.saveData(data);
        res.status(201).json({ message: 'Seller created successfully.', record: user.getPublicData() });
    });

    router.put('/:id', (req, res) => {
        const userId = readId(req.params.id);
        const data = store.readData();
        const currentUser = findSeller(data, userId);
        const user = buildSeller(req.body, userId, currentUser);
        checkUniqueUser(data, user, false);
        if (user.accountStatus !== 'Approved' && data.products.some(product => product.sellerId === userId)) {
            throw createError('Seller is used by a product. Reassign or delete the product before changing approval.', 409);
        }
        const index = data.sellers.findIndex(item => item.userId === userId);
        data.sellers[index] = user;
        store.saveData(data);
        res.json({ message: 'Seller updated successfully.', record: user.getPublicData() });
    });

    router.delete('/:id', (req, res) => {
        const userId = readId(req.params.id);
        const data = store.readData();
        findSeller(data, userId);
        if (data.products.some(product => product.sellerId === userId)) {
            throw createError('Seller is used by a product. Reassign or delete that product first.', 409);
        }
        data.sellers = data.sellers.filter(item => item.userId !== userId);
        store.saveData(data);
        res.json({ message: 'Seller deleted successfully.' });
    });

    return router;
}
