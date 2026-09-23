# Online Local Mart System (OLMS)

The **Online Local Mart System (OLMS)** is a web-based e-commerce platform designed to facilitate transactions and interactions between local sellers, customers, and administrative staff. The system streamlines product browsing, cart management, payment processing, stock tracking, and platform governance.

---

## Key Features

### 👤 Customer
- **Account Management:** Register a new account, log in, and update profile details.
- **Catalog Navigation:** Browse available products and search for specific items.
- **Cart & Ordering:** Add products to the cart, review cart details, and place orders.
- **Payment Processing:** Make payments via an integrated third-party payment gateway.

### 🏪 Seller
- **Authentication:** Account registration and secure login.
- **Inventory Management:** Add new products, delete existing products, and update real-time stock levels.
- **Order Handling:** View incoming customer orders and update their fulfillment statuses.

### 🛡️ Admin
- **User Governance:** Review and approve seller accounts.
- **Category Control:** Create and configure product categories.
- **System Monitoring:** View the complete catalog of product listings and inspect all system orders.

### 💳 Payment Gateway
- **Transaction Handling:** Securely processes payment authorization and returns status outcomes to complete or fail orders.

---

## System Architecture & Workflow

### Object-Oriented Design
- **Abstract User Inheritance:** An abstract base class `User` defines core identity attributes (`userId`, `name`, `email`, `password`) and core methods (`login()`, `updateProfile()`), which are inherited by `Customer`, `Seller`, and `Admin`.
- **Core Entities:** Structured interactions across `Cart`, `Category`, `Product`, `Order`, and `Payment`.

### Order Workflow
1. **Authentication:** User logs in or registers an account.
2. **Product Selection:** User searches or browses products, views details, and adds items to the cart.
3. **Cart Review & Checkout:** User reviews the cart and proceeds to order placement.
4. **Payment:** Payment is submitted to the gateway.
   - **On Success:** System creates the order, deducts product stock, and displays an order confirmation.
   - **On Failure:** System displays a payment failed notification.

---

## Technologies & Coding Standards

- **Primary Language:** JavaScript
- **Paradigm:** Object-Oriented Programming (OOP)
- **Version Control:** Git & GitHub

### Naming Conventions

| Element | Rule | Example |
| :--- | :--- | :--- |
| **Classes** | PascalCase | `Customer`, `Product` |
| **Methods** | camelCase | `placeOrder()`, `updateStock()` |
| **Variables** | camelCase | `productName`, `totalAmount` |
| **Constants** | UPPER CASE | `MAX_LOGIN_ATTEMPTS` |
| **Booleans** | Start with `is`, `has`, `can` | `isApproved`, `hasStock` |
| **Files** | Matches main class name | `Customer.js` |

### Standard Dictionary
- `userId`, `productId`, `orderId`, `paymentId`, `categoryId`
- `productName`, `stockQuantity`, `orderStatus`, `paymentStatus`, `totalAmount`

### Code Modularity
- Each method must serve a single clear purpose.
- Methods should remain short, readable, and avoid redundancy across classes.
- Large functions should be decomposed into smaller helper routines.
- Comments should be brief, explaining only complex or critical business logic, and kept in sync with code updates.

---

## Repository & Collaboration Guidelines

- **Branching Strategy:** Keep the `main` branch stable at all times. Develop features and bug fixes on dedicated branches using descriptive names (e.g., `feature-product`, `fix-login`).
- **Continuous Integration (CI):**
  - Code must run and build without errors before merging.
  - Basic unit tests must pass before pull requests are approved.
  - New commits must not break existing system features.
  - Local branches must be updated with `main` before finalizing a merge.
- **Team Communication:** Major architecture and logic updates must be coordinated and discussed in advance via WhatsApp before implementation to avoid duplicate efforts and conflicts.

---

## Team Information

**Institution:** Universiti Tenaga Nasional (Putrajaya Campus)  
**Course:** CSEB5213 – Software Construction & Methods  
**Semester:** Semester 1 2026/2027  
**Lab Group:** Group 5 (Class 01B)  

| No. | Full Name | Student ID | Class Group |
| :---: | :--- | :---: | :---: |
| 1 | Mohamed Ali Abdelbagi Eltahir | BSW01086109 | 01B |
| 2 | Babikir Elfadil Mohamed Elfadil | BSW01085748 | 01B |
| 3 | Ahmed Yaseen Mohamed Ali Suleiman | BSW01085736 | 01B |
| 4 | Omer Hassan Ahmed Masoud Hibah | BSW01085805 | 01B |
