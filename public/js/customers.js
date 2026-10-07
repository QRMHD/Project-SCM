import { getElement, showMessage, request, runAction, readNumberInput,
    displayRows, displayResults, clearResults, showDeleteDetails } from './common.js';

const API_URL = '/api/customers';
const DISPLAY_FIELDS = [
    { key: 'userId', label: 'User ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' }
];
let editingId = null;
let deletingId = null;

function loadRecords() {
    return request(API_URL).then(records => {
        records.sort((first, second) => first.userId - second.userId);
        displayRows(records, DISPLAY_FIELDS);
    });
}

function readForm() {
    return {
        userId: readNumberInput('userId'),
        name: getElement('name').value,
        email: getElement('email').value,
        password: getElement('password').value
    };
}

function resetForm() {
    editingId = null;
    getElement('recordForm').reset();
    getElement('userId').readOnly = false;
    getElement('formTitle').textContent = 'Create customer';
    getElement('saveButton').textContent = 'Create customer';
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
                showMessage(records.length ? `${records.length} record(s) found.` : 'Customer not found. No records were changed.');
            });
        });
    });
}

function editRecord(selectedRecord) {
    const recordId = selectedRecord.userId;
    return request(`${API_URL}/${recordId}`).then(record => {
        editingId = record.userId;
        getElement('userId').value = record.userId;
        getElement('name').value = record.name;
        getElement('email').value = record.email;
        getElement('password').value = '';
        getElement('userId').readOnly = true;
        getElement('formTitle').textContent = 'Edit customer';
        getElement('saveButton').textContent = 'Save changes';
        getElement('cancelButton').textContent = 'Cancel edit';
        getElement('formHint').textContent = 'The ID stays fixed. Change the details, then save. Leave the password blank to keep it.';
        showMessage('Customer found. Its current details are ready to edit.');
    });
}

function requestDeletion(selectedRecord) {
    return request(`${API_URL}/${selectedRecord.userId}`).then(record => {
        deletingId = record.userId;
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
    runAction(() => loadRecords().then(() => showMessage('All records refreshed from the server.')));
});
getElement('confirmDelete').addEventListener('click', confirmDeletion);
getElement('cancelDelete').addEventListener('click', cancelDeletion);
getElement('deleteDialog').addEventListener('cancel', event => {
    event.preventDefault();
    cancelDeletion();
});
runAction(() => loadRecords().then(() => showMessage('Ready. Create a customer or search existing records.')));
