import express from 'express';
import Customer from '../models/Customer.js';
import { createError, readId, searchRecords } from '../utils/validation.js';
import { hashPassword } from '../utils/password.js';
import { checkUniqueUser } from '../utils/userChecks.js';

export default function createCustomerRouter(store) {
    const router = express.Router();

    function findCustomer(data, userId) {
        const user = data.customers.find(item => item.userId === userId);
        if (!user) throw createError('Customer not found.', 404);
        return user;
    }

    function publicData(user) {
        const data = { userId: user.userId, name: user.name, email: user.email };

        return data;
    }

    function buildCustomer(body, userId, currentUser = null) {
        let passwordHash;
        // A blank password during editing keeps the saved hash.
        if (currentUser && (body.password === '' || body.password === undefined)) {
            passwordHash = currentUser.passwordHash;
        } else {
            passwordHash = hashPassword(body.password);
        }
        return new Customer(userId, body.name, body.email, passwordHash);
    }

    router.get('/', (req, res) => {
        res.json(store.readData().customers.map(publicData));
    });

    router.get('/search', (req, res) => {
        const users = store.readData().customers;
        const matches = searchRecords(users, req.query.field, req.query.q, ['userId', 'name', 'email']);
        res.json(matches.map(publicData));
    });

    router.get('/:id', (req, res) => {
        res.json(publicData(findCustomer(store.readData(), readId(req.params.id))));
    });

    router.post('/', (req, res) => {
        const data = store.readData();
        const user = buildCustomer(req.body, req.body.userId);
        checkUniqueUser(data, user, true);
        data.customers.push(user);
        store.saveData(data);
        res.status(201).json({ message: 'Customer created successfully.', record: user.getPublicData() });
    });

    router.put('/:id', (req, res) => {
        const userId = readId(req.params.id);
        const data = store.readData();
        const currentUser = findCustomer(data, userId);
        const user = buildCustomer(req.body, userId, currentUser);
        checkUniqueUser(data, user, false);
        const index = data.customers.findIndex(item => item.userId === userId);
        data.customers[index] = user;
        store.saveData(data);
        res.json({ message: 'Customer updated successfully.', record: user.getPublicData() });
    });

    router.delete('/:id', (req, res) => {
        const userId = readId(req.params.id);
        const data = store.readData();
        findCustomer(data, userId);
        data.customers = data.customers.filter(item => item.userId !== userId);
        store.saveData(data);
        res.json({ message: 'Customer deleted successfully.' });
    });

    return router;
}
