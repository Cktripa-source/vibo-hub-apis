// src/utils/analytics.js
export function calculateCommissionBreakdown(subtotal, commissionRate = 0.1) {
  const platformFeeRate = 0.05; // 5% platform fee
  const affiliateCommission = subtotal * commissionRate;
  const platformFee = subtotal * platformFeeRate;
  const vendorPayout = subtotal - affiliateCommission - platformFee;
  
  return {
    subtotal,
    affiliateCommission,
    platformFee,
    vendorPayout,
    commissionRate,
    platformFeeRate
  };
}

export function generateAnalyticsReport(orders, dateRange) {
  const report = {
    totalOrders: orders.length,
    totalRevenue: 0,
    averageOrderValue: 0,
    topProducts: new Map(),
    revenueByDay: new Map()
  };
  
  orders.forEach(order => {
    report.totalRevenue += order.subtotal;
    
    // Track products
    order.items.forEach(item => {
      const productId = item.product.toString();
      const current = report.topProducts.get(productId) || { 
        product: item.product, 
        quantity: 0, 
        revenue: 0 
      };
      current.quantity += item.quantity;
      current.revenue += item.price * item.quantity;
      report.topProducts.set(productId, current);
    });
    
    // Track daily revenue
    const day = order.createdAt.toISOString().split('T')[0];
    report.revenueByDay.set(day, (report.revenueByDay.get(day) || 0) + order.subtotal);
  });
  
  report.averageOrderValue = report.totalOrders > 0 ? 
    report.totalRevenue / report.totalOrders : 0;
  
  report.topProducts = Array.from(report.topProducts.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
  
  return report;
}
