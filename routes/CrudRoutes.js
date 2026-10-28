// Adds the Create, Search, Edit, Delete and Display pages for one module
export function registerCrudRoutes(app, config) {
  const { path, singular, manager, idKey } = config;
  const notFoundText = `${singular.charAt(0).toUpperCase()}${singular.slice(1)} not found.`;

  // Use the module's own functions if given, otherwise the manager's
  const create = config.create || ((values) => manager.create(...values));
  const edit = config.edit || ((id, values) => manager.edit(id, ...values));
  const remove = config.remove || ((id) => manager.delete(id));

  // 5. Display function: all data, plus optional search results or edited data
  function display(res, options = {}) {
    res.render('list', {
      config, items: manager.getAll(),
      results: null, keyword: '', message: null, isError: false, highlight: null,
      ...options
    });
  }

  function showForm(res, title, action, isEdit, formData, error) {
    res.render('form', { config, title, action, fields: config.getFields(isEdit), formData, error });
  }

  // Convert the form text into the right data types
  function readForm(isEdit, body) {
    return config.getFields(isEdit).map((field) => (field.parse || String)(body[field.name]));
  }

  // 2. Search
  app.get(path, (req, res) => {
    if (req.query.keyword === undefined) return display(res);
    display(res, { results: manager.search(req.query.keyword), keyword: req.query.keyword });
  });

  // 1. Create
  app.get(`${path}/new`, (req, res) => {
    showForm(res, `Add ${singular}`, path, false, {}, null);
  });

  app.post(path, (req, res) => {
    try {
      create(readForm(false, req.body));
      display(res, { message: `New ${singular} was added.` });
    } catch (error) {
      showForm(res, `Add ${singular}`, path, false, req.body, error.message);
    }
  });

  // 3. Edit
  app.get(`${path}/:id/edit`, (req, res) => {
    const item = manager.findById(Number(req.params.id));
    if (!item) return display(res, { message: notFoundText, isError: true });
    showForm(res, `Edit ${singular} #${item[idKey]}`, `${path}/${item[idKey]}/edit`, true, item, null);
  });

  app.post(`${path}/:id/edit`, (req, res) => {
    const id = Number(req.params.id);
    try {
      const item = edit(id, readForm(true, req.body));
      if (!item) return display(res, { message: notFoundText, isError: true });
      display(res, { message: `${singular} was updated. See the new data below.`, highlight: item });
    } catch (error) {
      showForm(res, `Edit ${singular} #${id}`, `${path}/${id}/edit`, true, req.body, error.message);
    }
  });

  // 4. Delete: confirm page first, then delete
  app.get(`${path}/:id/delete`, (req, res) => {
    const item = manager.findById(Number(req.params.id));
    if (!item) return display(res, { message: notFoundText, isError: true });
    res.render('delete', { config, item });
  });

  app.post(`${path}/:id/delete`, (req, res) => {
    try {
      const isDeleted = remove(Number(req.params.id));
      display(res, isDeleted
        ? { message: `${singular} was deleted.` }
        : { message: notFoundText, isError: true });
    } catch (error) {
      display(res, { message: error.message, isError: true });
    }
  });
}
