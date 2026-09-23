# Online Local Mart System (OLMS)

The **Online Local Mart System (OLMS)** is a web-based e-commerce platform designed to facilitate transactions and interactions between local sellers, customers, and administrative staff[cite: 1]. The system streamlines product browsing, cart management, payment processing, stock tracking, and platform governance[cite: 1].

---

## Key Features

### 👤 Customer
- **Account Management:** Register a new account, log in, and update profile details[cite: 1].
- **Catalog Navigation:** Browse available products and search for specific items[cite: 1].
- **Cart & Ordering:** Add products to the cart, review cart details, and place orders[cite: 1].
- **Payment Processing:** Make payments via an integrated third-party payment gateway[cite: 1].

### 🏪 Seller
- **Authentication:** Account registration and secure login[cite: 1].
- **Inventory Management:** Add new products, delete existing products, and update real-time stock levels[cite: 1].
- **Order Handling:** View incoming customer orders and update their fulfillment statuses[cite: 1].

### 🛡️ Admin
- **User Governance:** Review and approve seller accounts[cite: 1].
- **Category Control:** Create and configure product categories[cite: 1].
- **System Monitoring:** View the complete catalog of product listings and inspect all system orders[cite: 1].

### 💳 Payment Gateway
- **Transaction Handling:** Securely processes payment authorization and returns status outcomes to complete or fail orders[cite: 1].

---

## System Architecture & Workflow

### Object-Oriented Design
- **Abstract User Inheritance:** An abstract base class `User` defines core identity attributes (`userId`, `name`, `email`, `password`) and core methods (`login()`, `updateProfile()`), which are inherited by `Customer`, `Seller`, and `Admin`[cite: 1].
- **Core Entities:** Structured interactions across `Cart`, `Category`, `Product`, `Order`, and `Payment`[cite: 1].

### Order Workflow
1. **Authentication:** User logs in or registers an account[cite: 1].
2. **Product Selection:** User searches or browses products, views details, and adds items to the cart[cite: 1].
3. **Cart Review & Checkout:** User reviews the cart and proceeds to order placement[cite: 1].
4. **Payment:** Payment is submitted to the gateway[cite: 1].
   - **On Success:** System creates the order, deducts product stock, and displays an order confirmation[cite: 1].
   - **On Failure:** System displays a payment failed notification[cite: 1].

---

## Technologies & Coding Standards

- **Primary Language:** Java[cite: 1]
- **Paradigm:** Object-Oriented Programming (OOP)[cite: 1]
- **Version Control:** Git & GitHub[cite: 1]

### Naming Conventions

| Element | Rule | Example |
| :--- | :--- | :--- |
| **Classes** | PascalCase | `Customer`, `Product`[cite: 1] |
| **Methods** | camelCase | `placeOrder()`, `updateStock()`[cite: 1] |
| **Variables** | camelCase | `productName`, `totalAmount`[cite: 1] |
| **Constants** | UPPER CASE | `MAX_LOGIN_ATTEMPTS`[cite: 1] |
| **Booleans** | Start with `is`, `has`, `can` | `isApproved`, `hasStock`[cite: 1] |
| **Files** | Matches main class name | `Customer.java`[cite: 1] |

### Standard Dictionary
- `userId`, `productId`, `orderId`, `paymentId`, `categoryId`[cite: 1]
- `productName`, `stockQuantity`, `orderStatus`, `paymentStatus`, `totalAmount`[cite: 1]

### Code Modularity
- Each method must serve a single clear purpose[cite: 1].
- Methods should remain short, readable, and avoid redundancy across classes[cite: 1].
- Large functions should be decomposed into smaller helper routines[cite: 1].
- Comments should be brief, explaining only complex or critical business logic, and kept in sync with code updates[cite: 1].

---

## Repository & Collaboration Guidelines

- **Branching Strategy:** Keep the `main` branch stable at all times[cite: 1]. Develop features and bug fixes on dedicated branches using descriptive names (e.g., `feature-product`, `fix-login`)[cite: 1].
- **Continuous Integration (CI):**
  - Code must compile without errors before merging[cite: 1].
  - Basic unit tests must pass before pull requests are approved[cite: 1].
  - New commits must not break existing system features[cite: 1].
  - Local branches must be updated with `main` before finalizing a merge[cite: 1].
- **Team Communication:** Major architecture and logic updates must be coordinated and discussed in advance via WhatsApp before implementation to avoid duplicate efforts and conflicts[cite: 1].

---

## Team Information

**Institution:** Universiti Tenaga Nasional (Putrajaya Campus)[cite: 1]  
**Course:** CSEB5213 – Software Construction & Methods[cite: 1]  
**Semester:** Semester 1 2026/2027[cite: 1]  
**Lab Group:** Group 5 (Class 01B)[cite: 1]  

| No. | Full Name | Student ID | Class Group |
| :---: | :--- | :---: | :---: |
| 1 | Mohamed Ali Abdelbagi Eltahir | BSW01086109 | 01B[cite: 1] |
| 2 | Babikir Elfadil Mohamed Elfadil | BSW01085748 | 01B[cite: 1] |
| 3 | Ahmed Yaseen Mohamed Ali Suleiman | BSW01085736 | 01B[cite: 1] |
| 4 | Omer Hassan Ahmed Masoud Hibah | BSW01085805 | 01B[cite: 1] |
