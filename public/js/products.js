import { getElement, showMessage, request, runAction, readNumberInput,
    displayRows, displayResults, clearResults, showDeleteDetails } from './common.js';

const API_URL = '/api/products';
const DISPLAY_FIELDS = [
    { key: 'productId', label: 'Product ID' },
    { key: 'productName', label: 'Product name' },
    { key: 'price', label: 'Price (RM)' },
    { key: 'stockQuantity', label: 'Stock quantity' },
    { key: 'categoryId', label: 'Category ID' },
    { key: 'sellerId', label: 'Seller ID' }
];
let editingId = null;
let deletingId = null;

function loadRecords() {
    return request(API_URL).then(records => {
        records.sort((first, second) => first.productId - second.productId);
        displayRows(records, DISPLAY_FIELDS);
    });
}

function loadOptions() {
    return Promise.all([request('/api/categories'), request('/api/sellers')]).then(results => {
        const categories = results[0];
        const sellers = results[1].filter(seller => seller.accountStatus === 'Approved');
        fillOptions('categoryId', categories, 'categoryId', 'categoryName');
        fillOptions('sellerId', sellers, 'userId', 'name');
    });
}

function fillOptions(id, records, idField, nameField) {
    const select = getElement(id);
    const previousValue = select.value;
    select.textContent = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Choose an existing record';
    select.appendChild(placeholder);
    records.forEach(record => {
        const option = document.createElement('option');
        option.value = record[idField];
        option.textContent = `${record[idField]} - ${record[nameField]}`;
        select.appendChild(option);
    });
    select.value = previousValue;
}

function readForm() {
    return {
        productId: readNumberInput('productId'),
        productName: getElement('productName').value,
        price: readNumberInput('price'),
        stockQuantity: readNumberInput('stockQuantity'),
        categoryId: readNumberInput('categoryId'),
        sellerId: readNumberInput('sellerId')
    };
}

function resetForm() {
    editingId = null;
    getElement('recordForm').reset();
    getElement('productId').readOnly = false;
    getElement('formTitle').textContent = 'Create product';
    getElement('saveButton').textContent = 'Create product';
    getElement('cancelButton').textContent = 'Clear form';
    getElement('formHint').textContent = 'Use a unique ID. Complete all fields.';
}

function saveRecord(event) {
    event.preventDefault();
    runAction(() => {
        const data = readForm();
        const isEditing = editingId !== null;
        const url = isEditing ? `${API_URL}/${editingId}` : API_URL;
        const method = isEditing ? 'PUT' : 'POST';
        return request(url, method, data).then(result => {
            resetForm();
            clearResults();
            return loadRecords().then(() => showMessage(result.message));
        });
    });
}

function searchRecords(event) {
    event.preventDefault();
    clearResults();
    runAction(() => {
        const field = encodeURIComponent(getElement('searchBy').value);
        const query = encodeURIComponent(getElement('searchValue').value.trim());
        return request(`${API_URL}/search?field=${field}&q=${query}`).then(records => {
            displayResults(records, DISPLAY_FIELDS, editRecord, requestDeletion);
            return loadRecords().then(() => {
                showMessage(records.length ? `${records.length} record(s) found.` : 'Product not found. No records were changed.');
            });
        });
    });
}

function editRecord(selectedRecord) {
    const recordId = selectedRecord.productId;
    return loadOptions().then(() => request(`${API_URL}/${recordId}`)).then(record => {
        editingId = record.productId;
        getElement('productId').value = record.productId;
        getElement('productName').value = record.productName;
        getElement('price').value = record.price;
        getElement('stockQuantity').value = record.stockQuantity;
        getElement('categoryId').value = record.categoryId;
        getElement('sellerId').value = record.sellerId;
        getElement('productId').readOnly = true;
        getElement('formTitle').textContent = 'Edit product';
        getElement('saveButton').textContent = 'Save changes';
        getElement('cancelButton').textContent = 'Cancel edit';
        getElement('formHint').textContent = 'The ID stays fixed. Change the details, then save.';
        showMessage('Product found. Its current details are ready to edit.');
    });
}

function requestDeletion(selectedRecord) {
    return request(`${API_URL}/${selectedRecord.productId}`).then(record => {
        deletingId = record.productId;
        showDeleteDetails(record, DISPLAY_FIELDS);
    });
}

function cancelDeletion() {
    deletingId = null;
    getElement('deleteDialog').close();
    showMessage('Deletion cancelled. No records were changed.');
}

function confirmDeletion() {
    const recordId = deletingId;
    getElement('deleteDialog').close();
    runAction(() => request(`${API_URL}/${recordId}`, 'DELETE').then(result => {
        deletingId = null;
        if (editingId === recordId) resetForm();
        clearResults();
        return loadRecords().then(() => showMessage(result.message));
    }));
}

getElement('recordForm').addEventListener('submit', saveRecord);
getElement('searchForm').addEventListener('submit', searchRecords);
getElement('cancelButton').addEventListener('click', resetForm);
getElement('clearSearch').addEventListener('click', () => {
    getElement('searchForm').reset();
    clearResults();
    runAction(() => loadRecords().then(() => showMessage('Search cleared. All records are displayed.')));
});
getElement('refreshButton').addEventListener('click', () => {
    runAction(() => loadOptions().then(loadRecords).then(() => showMessage('All records refreshed from the server.')));
});
getElement('confirmDelete').addEventListener('click', confirmDeletion);
getElement('cancelDelete').addEventListener('click', cancelDeletion);
getElement('deleteDialog').addEventListener('cancel', event => {
    event.preventDefault();
    cancelDeletion();
});
runAction(() => loadOptions().then(loadRecords).then(() => showMessage('Ready. Create a product or search existing records.')));
