// src/services/email.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function sendEmail({ to, subject, html, text }) {
  if (!process.env.SMTP_HOST) {
    console.log('Email service not configured, skipping email send');
    return;
  }
  
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      text
    });
    console.log(`Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

export const emailTemplates = {
  orderConfirmation: (order) => ({
    subject: `Order Confirmation #${order._id.toString().slice(-8)}`,
    html: `
      <h2>Order Confirmed!</h2>
      <p>Your order has been successfully placed.</p>
      <p><strong>Order ID:</strong> ${order._id}</p>
      <p><strong>Total:</strong> ${order.subtotal.toFixed(2)}</p>
      <p>Thank you for your purchase!</p>
    `
  }),
  
  withdrawalApproved: (withdrawal) => ({
    subject: 'Withdrawal Approved',
    html: `
      <h2>Withdrawal Approved</h2>
      <p>Your withdrawal request has been approved and processed.</p>
      <p><strong>Amount:</strong> ${withdrawal.amount.toFixed(2)}</p>
      <p><strong>Reference:</strong> ${withdrawal.referenceNumber}</p>
    `
  }),
  
  productApproved: (product) => ({
    subject: 'Product Approved',
    html: `
      <h2>Product Approved!</h2>
      <p>Your product "${product.name}" has been approved and is now live.</p>
      <p>Start promoting it to earn sales!</p>
    `
  })
};