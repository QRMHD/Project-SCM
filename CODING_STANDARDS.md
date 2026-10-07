# 1.0 Lab 2 coding and documentation standards

| Lab 2 rule | Applied example |
| --- | --- |
| Classes use PascalCase | Product, Category, User, Customer, Seller, DataStore |
| Class file matches the class name | Product.js contains Product |
| Methods use camelCase | getProductName(), setPrice(), updateStock(), readData() |
| Variables use camelCase | productName, stockQuantity, currentUser, passwordHash |
| Constants use UPPER_CASE | PORT, DATA_FILE, API_URL, DISPLAY_FIELDS, ACCOUNT_STATUSES |
| Booleans begin with is/has/can | isEditing, isCreating, hasDuplicate, hasDuplicateEmail |
| Use the naming dictionary | productId, categoryId, userId, productName, stockQuantity |
| Each function has one clear purpose | hashPassword() hashes; displayRows() renders the table |
| Avoid duplicated common logic | validation.js and common.js contain shared checks/display functions |
| Use clear parameters and return values | checkId(value, label) returns a valid ID or throws an error |
| Keep comments short | Comments explain hash storage, blank-password editing and temporary-file saving |
| Clear documentation | README includes scope, features, technologies, setup, files and team information |
| Numbered report headings | 1.0 System overview, 2.0 Data and design, etc. |
| Light screenshots and brief captions | All report screenshots use the light interface |

Class files use PascalCase. Function-only files use descriptive camelCase names, for example productRoutes.js and userChecks.js. They contain no main class whose name must be matched.

# 2.0 ES6 syntax and student-level structure

The source uses standard ES6 classes, inheritance, import/export, const/let, arrow functions, default parameters, promises and template literals. There are no private # fields, async/await functions, decorators, TypeScript types, optional chaining, build tools or frontend frameworks.

Each module has its own model, route file, page and browser script. These explicit files make it easier to trace a request. Small repeated display tasks are shared in common.js; input checks are shared in validation.js. The project avoids generic CRUD factories and unnecessary service/repository layers.

Express and modern Node APIs are required at runtime. ES6 refers to the syntax of our files, not to running the application in an old JavaScript engine.

# 3.0 Changes from the initial design

- Customer and Seller inherit userId, name and email from User.
- Password is accepted as input, hashed with Node's crypto API, and saved as passwordHash. API responses never include either the original password or its hash.
- categoryId and sellerId are stored on Product to implement its links to Category and Seller.
- Seller still uses the inherited userId; Product.sellerId points to that value.
- IDs are fixed during editing to preserve existing references.
- Login, Admin, Cart, Order and Payment remain future work. No unused stubs claim these features exist.

# 4.0 Communication and integration

Use the group WhatsApp discussion for major changes. Assign tasks before editing the same files. Work on a feature branch, run npm test, review the interface, and have the team leader review the pull request. Configure required checks and review on main where supported. Branch separation alone is not a guarantee that main is stable.
