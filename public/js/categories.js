import { getElement, showMessage, request, runAction, readNumberInput,
    displayRows, displayResults, clearResults, showDeleteDetails } from './common.js';

const API_URL = '/api/categories';
const DISPLAY_FIELDS = [
    { key: 'categoryId', label: 'Category ID' },
    { key: 'categoryName', label: 'Category name' }
];
let editingId = null;
let deletingId = null;

function loadRecords() {
    return request(API_URL).then(records => {
        records.sort((first, second) => first.categoryId - second.categoryId);
        displayRows(records, DISPLAY_FIELDS);
    });
}

function readForm() {
    return {
        categoryId: readNumberInput('categoryId'),
        categoryName: getElement('categoryName').value
    };
}

function resetForm() {
    editingId = null;
    getElement('recordForm').reset();
    getElement('categoryId').readOnly = false;
    getElement('formTitle').textContent = 'Create category';
    getElement('saveButton').textContent = 'Create category';
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
                showMessage(records.length ? `${records.length} record(s) found.` : 'Category not found. No records were changed.');
            });
        });
    });
}

function editRecord(selectedRecord) {
    const recordId = selectedRecord.categoryId;
    return request(`${API_URL}/${recordId}`).then(record => {
        editingId = record.categoryId;
        getElement('categoryId').value = record.categoryId;
        getElement('categoryName').value = record.categoryName;
        getElement('categoryId').readOnly = true;
        getElement('formTitle').textContent = 'Edit category';
        getElement('saveButton').textContent = 'Save changes';
        getElement('cancelButton').textContent = 'Cancel edit';
        getElement('formHint').textContent = 'The ID stays fixed. Change the details, then save.';
        showMessage('Category found. Its current details are ready to edit.');
    });
}

function requestDeletion(selectedRecord) {
    return request(`${API_URL}/${selectedRecord.categoryId}`).then(record => {
        deletingId = record.categoryId;
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
runAction(() => loadRecords().then(() => showMessage('Ready. Create a category or search existing records.')));
