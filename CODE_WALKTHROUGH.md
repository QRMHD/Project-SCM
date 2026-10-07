# 1.0 Start with the Product module

Read these files in order:

1. models/Product.js: the product's attributes and validation.
2. routes/productRoutes.js: the six HTTP routes for this module.
3. public/products.html: input fields and output areas.
4. public/js/products.js: form actions and requests to the server.
5. models/DataStore.js: reading and saving the JSON file.

Then read Category, Customer and Seller. Their route files follow the same pattern.

# 2.0 What happens when Create product is clicked?

1. The form calls saveRecord() in products.js.
2. readForm() collects the input. Number fields are converted with Number().
3. request() sends JSON to POST /api/products.
4. Express reads the JSON with express.json().
5. productRoutes.js constructs a Product object.
6. The Product setters validate the name, price, stock and IDs.
7. The route checks that the ID is unique and the selected category and approved seller exist.
8. The product is added to the products array and DataStore saves the JSON file.
9. The server returns a success message.
10. The browser clears the form and calls loadRecords() to show the saved data.

# 3.0 Search, edit and delete

Search sends a GET request with a field and query, such as:

```text
/api/products/search?field=productName&q=rice
```

ID searches are exact. Text searches use lowercase comparisons to ignore case. An empty result array produces the Not found message.

Edit fetches the selected record by ID and fills the form. editingId tells saveRecord() to send PUT instead of POST. The route uses the ID in the URL, so it cannot accidentally create a second record. A new valid object replaces the old record only after validation succeeds.

Delete fetches the selected record and shows the confirmation dialog. Cancel leaves it unchanged. Confirm sends DELETE. The complete table reloads after the server saves the change.

# 4.0 Why use a shared User class?

Customer and Seller both have userId, name and email. User defines these common attributes and methods. Customer extends User. Seller extends User and adds accountStatus. This follows the inheritance shown in Lab 2.

User is a supporting base class rather than a fifth module. Its constructor prevents creating a plain User directly. The ordinary properties are not private language fields; the getters and setters provide a consistent way to access and validate them.

# 5.0 Why is passwordHash different from password?

The form accepts a password, but the application should not save its original text. hashPassword() adds a random salt and uses Node's scryptSync() to make a hash. The JSON file stores the salt and hash together. The password and hash are omitted from responses, tables, searches and delete details.

An empty password when editing keeps the saved hash. A new non-empty password replaces it. This does not implement login: checking a password and creating a session remain later work.

# 6.0 Why use JSON storage?

A JSON file makes the server-side data flow easy to understand without installing a database. DataStore reads the file into an object and saves that object after a change. It writes a temporary file first, then replaces the saved file. Synchronous file operations keep these small lab transactions sequential in a single Node process.

This is appropriate for a small demonstration, but a larger application needs a database and better concurrency handling.

# 7.0 What should each group member understand?

Each member should be able to explain one complete module: its model, input fields, GET/POST/PUT/DELETE routes, validation, search and output. Everyone should understand the shared User class and why Product refers to Category and Seller. Do not claim tasks were completed by a particular member unless your group actually assigns and reviews them that way.

# 8.0 Short presentation script

Our system is the Online Local Mart System. For this stage, we implemented four modules: Product, Category, Customer and Seller. We used ES6 JavaScript and Express. Each module allows us to create, display, search, edit and delete records. Customer and Seller inherit common fields from User. Products are connected to a category and an approved seller. Express validates requests and saves records in a JSON file on the server. The interface displays not-found messages and asks for confirmation before deletion. We followed the naming and documentation standards from Lab 2. Login, orders, cart and payments are planned for later stages.
