// src/services/inventory.js
import Product from '../models/Product.js';
import { createNotification } from './notifications.js';

export async function updateStock(productId, quantity, operation = 'decrease') {
  try {
    const product = await Product.findById(productId);
    if (!product) throw new Error('Product not found');
    
    const newQuantity = operation === 'decrease' ? 
      product.stock_quantity - quantity : 
      product.stock_quantity + quantity;
    
    if (newQuantity < 0) {
      throw new Error('Insufficient stock');
    }
    
    product.stock_quantity = newQuantity;
    await product.save();
    
    // Notify vendor if stock is low
    if (newQuantity <= 5 && newQuantity > 0) {
      await createNotification(
        product.vendor,
        'Low Stock Alert',
        `Product "${product.name}" is running low on stock (${newQuantity} remaining)`,
        'product',
        { productId: product._id }
      );
    }
    
    return product;
  } catch (error) {
    console.error('Stock update failed:', error);
    throw error;
  }
}

export async function reserveStock(items) {
  const reservations = [];
  
  try {
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        throw new Error(`Product ${item.product} not found`);
      }
      
      if (product.stock_quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }
      
      // Reserve stock
      product.stock_quantity -= item.quantity;
      await product.save();
      
      reservations.push({
        productId: item.product,
        quantity: item.quantity,
        reserved: true
      });
    }
    
    return reservations;
  } catch (error) {
    // Rollback reservations on failure
    for (const reservation of reservations) {
      if (reservation.reserved) {
        await Product.findByIdAndUpdate(
          reservation.productId,
          { $inc: { stock_quantity: reservation.quantity } }
        );
      }
    }
    throw error;
  }
}