// Form definitions keep the shared EJS pages short and consistent.
const field = (name, label, type = 'text') => ({ name, label, type });
const userFields = [field('name', 'Name'), field('email', 'Email', 'email'), field('password', 'Password (blank keeps current password)', 'password')];
export const forms = {
  products: { title: 'Products', single: 'Product', id: 'productId', fields: [field('productName', 'Product name'), field('price', 'Price (RM)', 'number'), field('stockQuantity', 'Stock quantity', 'number'), field('categoryId', 'Category', 'select'), field('sellerId', 'Seller', 'select')] },
  categories: { title: 'Categories', single: 'Category', id: 'categoryId', fields: [field('categoryName', 'Category name')] },
  customers: { title: 'Customers', single: 'Customer', id: 'userId', fields: userFields.concat([field('phone', 'Phone'), field('address', 'Address')]) },
  sellers: { title: 'Sellers', single: 'Seller', id: 'userId', fields: userFields.concat([field('accountStatus', 'Account status', 'select')]) },
  admins: { title: 'Admins', single: 'Admin', id: 'userId', fields: userFields }
};
