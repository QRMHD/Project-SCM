import path from 'node:path';
import createApp from './app.js';

const PORT = Number(process.env.PORT || 3000);
const DATA_FILE = process.env.OLMS_DATA_FILE || path.join(process.cwd(), 'data', 'olms.json');
const app = createApp(DATA_FILE);

app.listen(PORT, '127.0.0.1', () => {
    console.log(`OLMS is running at http://localhost:${PORT}`);
    console.log('Press Ctrl+C to stop the server.');
});
