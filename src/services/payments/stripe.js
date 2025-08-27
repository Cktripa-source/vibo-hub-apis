import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

export async function createPaymentIntent(order) {
  if (!process.env.STRIPE_SECRET_KEY) return { note: 'Stripe key not set. Using stub.' };
  const pi = await stripe.paymentIntents.create({
    amount: Math.round(order.subtotal * 100),
    currency: 'usd',
    metadata: { orderId: String(order._id) }
  });
  return { clientSecret: pi.client_secret, id: pi.id };
}
