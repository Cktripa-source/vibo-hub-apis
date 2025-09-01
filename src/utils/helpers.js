// src/utils/helpers.js
import { v4 as uuid } from 'uuid';

export function generateSKU(productName, vendorId) {
  const prefix = productName.substring(0, 3).toUpperCase();
  const vendorPrefix = vendorId.toString().slice(-4);
  const unique = uuid().slice(0, 8).toUpperCase();
  return `${prefix}-${vendorPrefix}-${unique}`;
}

export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
}

export function calculateShipping(weight, distance, method = 'standard') {
  const baseRate = 5.00;
  const weightRate = weight * 0.50;
  const distanceRate = distance * 0.01;
  const methodMultiplier = method === 'express' ? 2 : 1;
  
  return Math.max(baseRate + weightRate + distanceRate, 0) * methodMultiplier;
}

export function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
}
