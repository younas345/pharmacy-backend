import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { updateSubscriptionFromStripe } from '../services/subscriptionService';
import { AppError } from '../utils/appError';
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-11-17.clover',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!webhookSecret) {
  console.warn('STRIPE_WEBHOOK_SECRET is not set. Webhook signature verification will be disabled.');
}

/**
 * Handle Stripe webhook events
 * @swagger
 * /api/subscriptions/webhook:
 *   post:
 *     summary: Stripe webhook endpoint
 *     tags: [Subscriptions]
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 */
export const handleWebhook = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    return next(new AppError('Missing stripe-signature header', 400));
  }

  if (!webhookSecret) {
    // In development, you might want to skip verification
    // In production, always verify webhooks
    console.warn('Processing webhook without signature verification (STRIPE_WEBHOOK_SECRET not set)');
    
    // For development, parse the event directly
    const event = req.body;
    await processWebhookEvent(event);
    return res.status(200).json({ received: true });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return next(new AppError(`Webhook Error: ${err.message}`, 400));
  }

  await processWebhookEvent(event);

  res.status(200).json({ received: true });
});

/**
 * Process Stripe webhook event
 */
async function processWebhookEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      
      if (session.mode === 'subscription' && session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string,
          { expand: ['default_payment_method'] }
        );
        await updateSubscriptionFromStripe(subscription);
      }
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      await updateSubscriptionFromStripe(subscription);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await updateSubscriptionFromStripe(subscription);
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      // Invoice has subscription property but TypeScript types may not include it
      const subscriptionId = (invoice as any).subscription as string | Stripe.Subscription | null;
      if (subscriptionId) {
        const subscription = typeof subscriptionId === 'string'
          ? await stripe.subscriptions.retrieve(subscriptionId)
          : subscriptionId;
        await updateSubscriptionFromStripe(subscription);
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      // Invoice has subscription property but TypeScript types may not include it
      const subscriptionId = (invoice as any).subscription as string | Stripe.Subscription | null;
      if (subscriptionId) {
        const subscription = typeof subscriptionId === 'string'
          ? await stripe.subscriptions.retrieve(subscriptionId)
          : subscriptionId;
        await updateSubscriptionFromStripe(subscription);
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

