# Online Local Mart System

CSEB5223 Software Construction & Methods | Section 01B | Group 5

## Labs 5 and 6

This version continues the supplied Product and Customer application. It completes the remaining local modules and integrates accounts, catalogue management, carts, orders and simulated payments. The code uses JavaScript ES6 syntax, Express 4 and EJS, with short classes, managers and shared views. Use Node.js 22 or newer; ES6 describes our source syntax, not the runtime or dependency requirements.

## Run in VS Code

1. Extract the ZIP and open the Project-SCM folder (the one with package.json).
2. Open Terminal > New Terminal.
3. Run `npm.cmd install` on Windows PowerShell, or `npm install` on other terminals.
4. Run `npm.cmd start` (or `npm start`).
5. Open http://localhost:3000. Keep the terminal open. Ctrl+C stops the server.
6. Run `npm.cmd test` to repeat 11 integration test groups using temporary data.

Start commands must run inside the project folder. The server binds to 127.0.0.1 for local use.

## Demo accounts

These accounts are created only when the data file has no users. All are fictional local demonstration accounts.

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@olms.test | Admin123! |
| Seller | seller@olms.test | Seller123! |
| Customer | customer@olms.test | Customer123! |
| Customer | daniel@olms.test | Customer123! |

Passwords are stored as salted hashes. Login sessions stay in server memory for eight hours and end on restart. This is a local lab application, not a production authentication system.

## Features and access

- Customers and sellers can register; sellers start Pending. Admin approves them on Sellers > Edit.
- Customers, sellers and admins inherit userId, name, email and password behaviour from User.
- Admin can create, search, edit and delete eligible customer, seller, admin, category and product records.
- Approved sellers can manage their own products and view/update their own orders.
- Customers can edit their profile, search the catalogue, add/update/remove cart items, place orders, simulate payment and view their own order/payment history.
- Public visitors can browse products from approved sellers.
- Search results and full lists are shown together. Delete operations have confirmation pages.

## Integrated workflow

1. Register a seller. Log in as Admin and approve the seller.
2. Create a category and product, linking the product to an approved seller.
3. Log in as Customer. Search products, add them to the cart and change quantities.
4. Place order. Checkout validates current stock, stores product names/prices and delivery address, deducts stock and empties the cart.
5. Run a simulated failed payment: order remains Pending. Retry with Success: order becomes Paid.
6. Log in as Seller. Advance the order through Processing, Shipped and Completed.
7. For a separate unpaid order, cancel it. Stock returns once. A cancelled order can be deleted if no payment records remain.

The class diagram has one seller per order, so each cart is restricted to one seller. Checkout uses current prices; placed orders keep their price/address snapshots.

## Applicable CRUD boundaries

| Module | Create/read | Update | Delete |
| --- | --- | --- | --- |
| Customer, Seller, Admin | Register/add, search and list | Profile and authorised admin edits | Unlinked accounts; keep one admin; no self-deletion in admin UI |
| Category, Product | Add, search and list | Edit attributes and relationships | Unlinked records only |
| Cart | Add items and display | Quantity changes | Remove item with zero quantity or confirm clearing the cart |
| Order | Create from cart, search/list/detail | Valid status transitions | Cancelled orders without payment records |
| Payment | Create attempt from pending order, search/list/detail | Failed payment can be retried as a new attempt | Failed attempts only; successful history retained |
| User, PaymentGateway | Supporting classes | Shared profile/login and simulated processing | No separate CRUD screens |

Order status: Pending -> Paid -> Processing -> Shipped -> Completed. Pending -> Cancelled is the only cancellation path. A paid order cannot be cancelled in this lab version because refunds are not implemented. Payment records are immutable transaction history; they do not have an arbitrary edit form.

## Persistence and migration

The uploaded data/olms.json contained empty arrays and was not read by the old app. This version replaces that empty format with users, categories, products, carts, orders, payments and ID counters. First start creates the sample data. Later starts retain records. Non-empty legacy data is not silently overwritten; startup stops so it can be migrated separately.

Back up data/olms.json before replacing your project. For a fresh demo, stop the server and move that file to a backup location, then start again. Do not remove real records without a backup. The JSON file is for one local Node process, not concurrent servers. To use a separate test/demo file, set OLMS_DATA_FILE to its path.

## Files and coding standards

- models/: domain classes, inheritance and attribute validation.
- managers/: record operations and cross-module rules.
- services/DataStore.js: load, transaction rollback and JSON save.
- services/System.js: manager wiring and first-start sample records.
- services/Forms.js: shared form descriptions.
- services/PaymentGateway.js: simulated success/failure, with no external connection.
- views/: reusable EJS forms, tables and workflow pages.
- app.js: Express request handling and local sessions.
- tests/integration.js: repeatable integration checks, with isolated temporary storage.

Class names use PascalCase, methods and variables use camelCase, and constants use UPPER_CASE. The source uses two-space indentation. New userId/categoryId/orderId/paymentId fields align with the Lab 2 naming dictionary. Product's old category text becomes a Category reference; Customer's customerId becomes inherited userId. Phone/address remain as useful extensions of the earlier design.

## Lab scope and limitations

Lab 5: remaining classes and applicable CRUD. Lab 6: local module integration, evidence and construction-practice analysis. No real payment gateway, external API or dedicated Lab 7/8 middleware assignment is implemented. Basic login, validation and route checks support the existing use cases. No production deployment is intended. Email format checks do not verify mailbox ownership; phone validation is basic. Cart stock is reserved at checkout, with no automatic timeout for unpaid orders.

## Verification

`npm test` covers 11 integration groups: login, user CRUD, category/product relationships, seller approval, cart changes, checkout, payment retry, fulfilment, cancellation, deletion and storage reload. Additional browser checks covered all five managed CRUD modules, not-found results, cancel/confirm deletion, registration, profile, shopping, ownership restrictions and invalid stock submitted directly. All 41 application/test JavaScript and EJS files passed an ES6 syntax parser check during preparation. The parser/browser tools are verification tools, not project dependencies.

## Team

- Mohamed Ali Abdelbagi Eltahir - BSW01086109
- Babikir Elfadil Mohamed Elfadil - BSW01085748
- Ahmed Yaseen Mohamed Ali Suleiman - BSW01085736
- Omer Hassan Ahmed Masoud Hibah - BSW01085805
- Ahmad Talhah bin Ashaari - BSW01085934

## GitHub handoff

Changes are prepared only; nothing has been pushed. Supply the repository URL and new branch name for the push. Keep node_modules out of Git. Review the diff against the current branch and run npm test before merging. The ZIP has no Git history; preserve your existing .git directory when copying the updated source into your checkout.
