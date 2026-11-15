export const ORDER_ROLES = ['Admin', 'Seller', 'Customer'];

export function canViewOrder(user, order) {
  if (!order) return false;
  if (user.role === 'Admin') return true;
  if (user.role === 'Seller') return order.sellerId === user.userId;
  return user.role === 'Customer' && order.customerId === user.userId;
}

export function canViewProduct(user, product, users) {
  if (user && user.role !== 'Customer') return true;
  const seller = users.findById(product.sellerId);
  return Boolean(seller && seller.accountStatus === 'Approved');
}
