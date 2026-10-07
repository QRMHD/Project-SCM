export function getElement(id) {
    return document.getElementById(id);
}

export function showMessage(message, isError = false) {
    getElement('message').textContent = message;
    getElement('message').className = isError ? 'message error' : 'message';
}

export function request(url, method = 'GET', data = null) {
    const options = { method, headers: { 'Content-Type': 'application/json' } };
    if (data !== null) options.body = JSON.stringify(data);
    return fetch(url, options).then(response => {
        return response.json().then(result => {
            if (!response.ok) throw new Error(result.message || 'Request failed.');
            return result;
        });
    });
}

export function runAction(action) {
    showMessage('Processing request...');
    document.querySelectorAll('button').forEach(button => button.disabled = true);
    return Promise.resolve().then(action).catch(error => {
        showMessage(error.message, true);
    }).then(() => {
        document.querySelectorAll('button').forEach(button => button.disabled = false);
    });
}

export function readNumberInput(id) {
    const value = getElement(id).value.trim();
    if (!value) throw new Error('Complete all required number fields and selections.');
    return Number(value);
}

function formatValue(record, field) {
    return field.key === 'price' ? Number(record[field.key]).toFixed(2) : record[field.key];
}

export function displayRows(records, fields) {
    const body = getElement('recordTable');
    body.textContent = '';
    records.forEach(record => {
        const row = document.createElement('tr');
        fields.forEach(field => {
            const cell = document.createElement('td');
            cell.textContent = formatValue(record, field);
            row.appendChild(cell);
        });
        body.appendChild(row);
    });
    if (!records.length) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = fields.length;
        cell.className = 'empty';
        cell.textContent = 'No records yet. Create a record using the form.';
        row.appendChild(cell);
        body.appendChild(row);
    }
    getElement('recordCount').textContent = records.length;
    getElement('tableSummary').textContent = `Showing all ${records.length} record(s).`;
}

export function displayResults(records, fields, onEdit, onDelete) {
    const container = getElement('searchResults');
    container.textContent = '';
    if (!records.length) container.textContent = 'Not found. Try another ID or search value.';
    records.forEach(record => {
        const card = document.createElement('article');
        card.className = 'resultCard';
        fields.forEach(field => {
            const line = document.createElement('p');
            line.textContent = `${field.label}: ${formatValue(record, field)}`;
            card.appendChild(line);
        });
        const actions = document.createElement('div');
        actions.className = 'actions';
        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.className = 'secondary';
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', () => runAction(() => onEdit(record)));
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'danger';
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => runAction(() => onDelete(record)));
        actions.appendChild(editButton);
        actions.appendChild(deleteButton);
        card.appendChild(actions);
        container.appendChild(card);
    });
}

export function clearResults() {
    getElement('searchResults').textContent = 'Search results will appear here.';
}

export function showDeleteDetails(record, fields) {
    const details = getElement('deleteDetails');
    details.textContent = '';
    fields.forEach(field => {
        const label = document.createElement('dt');
        const value = document.createElement('dd');
        label.textContent = field.label;
        value.textContent = formatValue(record, field);
        details.appendChild(label);
        details.appendChild(value);
    });
    getElement('deleteDialog').showModal();
    getElement('cancelDelete').focus();
}
