/**
 * Vercel Serverless Function for Razorpay Webhooks
 */

export default async function handler(req, res) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Razorpay-Signature');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const webhookSecret = process.env.VITE_RAZORPAY_WEBHOOK_SECRET;
    const receivedSignature = req.headers['x-razorpay-signature'];

    if (!webhookSecret) {
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    // In production, verify webhook signature here
    // const crypto = require('crypto');
    // const body = JSON.stringify(req.body);
    // const expectedSignature = crypto
    //   .createHmac('sha256', webhookSecret)
    //   .update(body)
    //   .digest('hex');

    // if (receivedSignature !== expectedSignature) {
    //   return res.status(400).json({ error: 'Invalid signature' });
    // }

    const { event, payload } = req.body;

    console.log('Razorpay Webhook:', { event, payload });

    // Process webhook events
    switch (event) {
      case 'payment.captured':
        // Handle successful payment
        const paymentData = {
          paymentId: payload.payment?.id,
          orderId: payload.order?.id,
          amount: payload.payment?.amount,
          currency: payload.payment?.currency,
          email: payload.payment?.email,
          contact: payload.payment?.contact,
          status: 'captured',
          timestamp: new Date().toISOString(),
        };

        // Store payment data in your database
        // await storePaymentData(paymentData);

        // Send admin notification
        // await adminNotifications.notifyPaymentSuccess(paymentData);

        console.log('Payment captured:', paymentData);
        return res.status(200).json({
          message: 'Payment captured successfully',
          data: paymentData
        });

      case 'payment.failed':
        // Handle failed payment
        const failureData = {
          paymentId: payload.payment?.id,
          orderId: payload.order?.id,
          error: payload.error?.description,
          code: payload.error?.code,
          timestamp: new Date().toISOString(),
        };

        // Send admin notification
        // await adminNotifications.notifyPaymentFailure(failureData);

        console.log('Payment failed:', failureData);
        return res.status(200).json({
          message: 'Payment failure processed',
          data: failureData
        });

      case 'subscription.authorized':
        // Handle subscription authorization
        const subscriptionData = {
          subscriptionId: payload.subscription?.id,
          planId: payload.plan?.id,
          customerId: payload.customer?.id,
          status: 'authorized',
          timestamp: new Date().toISOString(),
        };

        console.log('Subscription authorized:', subscriptionData);
        return res.status(200).json({
          message: 'Subscription authorized',
          data: subscriptionData
        });

      case 'subscription.cancelled':
        // Handle subscription cancellation
        const cancellationData = {
          subscriptionId: payload.subscription?.id,
          customerId: payload.customer?.id,
          cancelledAt: new Date().toISOString(),
        };

        // Send admin notification
        // await adminNotifications.notifySubscriptionCancelled(cancellationData);

        console.log('Subscription cancelled:', cancellationData);
        return res.status(200).json({
          message: 'Subscription cancelled',
          data: cancellationData
        });

      default:
        return res.status(200).json({
          message: 'Webhook received',
          event,
          timestamp: new Date().toISOString(),
        });
    }

  } catch (error) {
    console.error('Razorpay Webhook Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}