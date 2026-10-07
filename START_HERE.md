# 1.0 Run the ES6 + Express version

This replaces the earlier one-module, browser-storage implementation.

1. Extract the ZIP into a new folder.
2. Open the OLMS_Lab3_4_ES6_Express folder.
3. Make sure Node.js 22 or newer is installed. In Command Prompt, check:

```text
node --version
npm --version
```

4. Open Command Prompt in the folder containing package.json. On Windows, open the folder in File Explorer, type cmd in the address bar and press Enter.
5. Run:

```text
npm install
npm start
```

6. Open http://localhost:3000.
7. Leave the terminal open. Press Ctrl+C when you want to stop the app.

Do not double-click the HTML files. They use Express API requests. No database installation is needed. If port 3000 is already in use, stop the other app or use `set PORT=3001` in Command Prompt before `npm start`, then open http://localhost:3001.

# 2.0 Create the sample records

The package starts with empty data. Create records in this order:

| Step | Page | Values |
| --- | --- | --- |
| 1 | Categories | ID 1, name Groceries |
| 2 | Sellers | User ID 100, name Local Seller, email local@example.com, password DemoPass123, status Approved |
| 3 | Customers | User ID 300, name Ali Customer, email ali@example.com, password DemoPass123 |
| 4 | Products | ID 101, name Jasmine Rice 5kg, price 25.90, stock 40, category 1, seller 100 |

The passwords above are fictional demonstration values. There is no login screen in this version.

# 3.0 Demonstrate all four modules

For each module:

1. Create its sample record and check the complete table.
2. Search by its ID. Confirm the correct record appears.
3. Search by part of its name, using uppercase letters to demonstrate case-insensitive matching.
4. Search ID 9999. Confirm the Not found message.
5. Search the real ID and click Edit. The ID remains fixed.
6. Change the fields below, then Save changes:

| Module | Updated values |
| --- | --- |
| Category 1 | categoryName: Grocery Items |
| Seller 100 | name: Kajang Local Mart; email: kajang@example.com; keep Approved |
| Customer 300 | name: Ali Updated; email: ali.updated@example.com |
| Product 101 | productName: Premium Jasmine Rice 5kg; price: 27.50; stockQuantity: 35 |

For customers and sellers, leave password empty during editing to preserve it.

# 4.0 Demonstrate deletion and its cancellation

Create a temporary record in each module, then search and delete it:

| Module | Temporary record |
| --- | --- |
| Category | ID 2, Temporary Category |
| Seller | User ID 200, Temporary Seller, temp-seller@example.com, DemoPass123, Pending |
| Customer | User ID 301, Temporary Customer, temp-customer@example.com, DemoPass123 |
| Product | ID 102, Cooking Oil 1L, price 6.90, stock 60, category 1, seller 100 |

For each temporary record:

1. Search its ID, then click Delete.
2. Read the details in the confirmation dialog.
3. Choose Cancel and show that the record remains.
4. Click Delete again, then Confirm deletion.
5. Show the refreshed complete table without that record.

Products reference categories and sellers. Deleting category 1 or seller 100 while product 101 still uses them is blocked. Use the temporary unlinked records above to demonstrate successful deletion. Alternatively, delete or reassign linked products before deleting their category/seller.

# 5.0 Demonstrate validation and persistence

- Try creating product ID 101 again: duplicate ID rejected.
- Try a negative stock quantity: invalid input rejected.
- Try a Customer email already used by Seller: duplicate email rejected.
- Try deleting category 1 while product 101 exists: linked-record deletion rejected.
- Refresh the page: records remain.
- Stop the server with Ctrl+C and run npm start again: records remain.

Data is saved in data/olms.json on the server. Do not delete this file if you want to keep your records. If you deliberately want a fresh demonstration, stop the server, make a backup, remove the file, then restart. Empty collections will be created automatically.

# 6.0 Tests and report

Run from the project folder:

```text
npm test
```

The package contains 15 automated model/API tests. Browser checks and the screenshots were completed separately during preparation. The tests create temporary data and do not overwrite your working data file.

Review Lab3_4_Report.pdf. It describes all four modules, their screenshots and construction practices. Read CODE_WALKTHROUGH.md to prepare for questions about the code. Edit Lab3_4_Report.md if you need to change the wording; PDF regeneration is a separate document-editing step.

# 7.0 GitHub and submission

No GitHub upload has been performed. To integrate this version:

1. Open your group's existing repository and create a feature branch.
2. Preserve your old work before replacing or integrating app files.
3. Add this version's source, package.json, package-lock.json and documentation.
4. Do not upload node_modules. The included .gitignore also excludes the working data file.
5. Run npm ci and npm test, then repeat the browser demonstration.
6. Commit and push the branch; open a pull request for the team leader to review.
7. Check the supplied GitHub Actions workflow. It assumes package.json is at the repository root; adjust its working directory and lockfile path if you place the app in a subfolder.
8. Merge after review and passing checks. Submit the report as instructed by the lecturer.

The official outline gives the Labs 3 and 4 deadline as 7 October 2026, 12:00 pm. It requires a report with input/output screenshots and best-practice analysis, plus updated GitHub code.

# 8.0 Current scope

Exactly four user-facing modules are implemented: Product, Category, Customer and Seller. Each has CRUD and search. User is a shared base class; DataStore is a storage helper. Login, role permissions, Admin, Cart, Order and Payment are not implemented. Seller approval status is editable only as part of this local lab demonstration.
