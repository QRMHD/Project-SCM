import fs from 'node:fs';
import path from 'node:path';

// Small synchronous file store for a single-process classroom application.
export default class DataStore {
    constructor(filePath) {
        this.filePath = filePath;
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        if (!fs.existsSync(filePath)) {
            this.saveData({ products: [], categories: [], customers: [], sellers: [] });
        }
        this.readData();
    }

    readData() {
        const data = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
        const collections = ['products', 'categories', 'customers', 'sellers'];
        if (!data || collections.some(name => !Array.isArray(data[name]))) {
            throw new Error('Invalid data file. Check data/olms.json.');
        }
        return data;
    }

    saveData(data) {
        // Finish writing a temporary file before replacing the saved data.
        const temporaryPath = `${this.filePath}.tmp`;
        fs.writeFileSync(temporaryPath, JSON.stringify(data, null, 4), 'utf8');
        fs.renameSync(temporaryPath, this.filePath);
    }
}
