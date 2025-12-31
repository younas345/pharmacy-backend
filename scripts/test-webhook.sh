#!/bin/bash

# Quick script to test Stripe webhook setup
# Usage: ./scripts/test-webhook.sh

echo "🔍 Checking Stripe Webhook Configuration..."
echo ""

# Check if STRIPE_WEBHOOK_SECRET is set
if [ -z "$STRIPE_WEBHOOK_SECRET" ]; then
    echo "❌ STRIPE_WEBHOOK_SECRET is not set in environment"
    echo "   Add it to your .env.local file:"
    echo "   STRIPE_WEBHOOK_SECRET=whsec_..."
    echo ""
else
    echo "✅ STRIPE_WEBHOOK_SECRET is set"
    echo ""
fi

# Check if STRIPE_SECRET_KEY is set
if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo "❌ STRIPE_SECRET_KEY is not set in environment"
    echo "   Add it to your .env.local file:"
    echo "   STRIPE_SECRET_KEY=sk_test_..."
    echo ""
else
    echo "✅ STRIPE_SECRET_KEY is set"
    echo ""
fi

# Check if backend is running
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Backend server is running on http://localhost:3000"
    echo ""
else
    echo "❌ Backend server is not running"
    echo "   Start it with: npm run dev"
    echo ""
fi

# Check webhook endpoint
if curl -s http://localhost:3000/api/subscriptions/webhook -X POST -H "Content-Type: application/json" -d '{}' > /dev/null 2>&1; then
    echo "✅ Webhook endpoint is accessible: /api/subscriptions/webhook"
    echo ""
else
    echo "⚠️  Webhook endpoint might not be accessible"
    echo "   Make sure your server is running"
    echo ""
fi

echo "📋 Next Steps:"
echo "1. Install ngrok: npm install -g ngrok"
echo "2. Start ngrok: ngrok http 3000"
echo "3. Copy the HTTPS URL from ngrok"
echo "4. Add webhook in Stripe Dashboard: https://your-url.ngrok.io/api/subscriptions/webhook"
echo "5. Select events: checkout.session.completed, payment_intent.succeeded"
echo "6. Copy webhook signing secret and add to .env.local"
echo ""
echo "📖 Full guide: See STRIPE_WEBHOOK_SETUP.md"

