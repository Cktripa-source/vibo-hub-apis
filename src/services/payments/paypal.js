import paypal from '@paypal/checkout-server-sdk';

function environment() {
  return new paypal.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID || 'test',
    process.env.PAYPAL_CLIENT_SECRET || 'test'
  );
}

const client = new paypal.core.PayPalHttpClient(environment());

export async function createOrder(order) {
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) return { note: 'PayPal keys not set. Using stub.' };
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [{ amount: { currency_code: 'USD', value: String(order.subtotal.toFixed(2)) } }]
  });
  const response = await client.execute(request);
  return { id: response.result.id, status: response.result.status };
}
