# Payment System Setup Guide

This document describes the Korapay payment integration for the NetToolz application.

## Overview

The payment system uses **Korapay** as the payment gateway to handle all payment transactions. The system includes:

- Order creation with payment tracking
- Korapay webhook integration for payment confirmation
- Automatic credential assignment upon successful payment
- Comprehensive error handling and status tracking
- Real-time payment status monitoring

## Architecture

### Key Components

1. **Payment Configuration** (`lib/payment-config.ts`)
   - Validates and manages all payment credentials
   - Ensures all required environment variables are set
   - Provides configuration access to API routes

2. **Payment Error Handling** (`lib/payment-errors.ts`)
   - Structured error classes for different payment scenarios
   - Consistent error reporting and logging

3. **Payment Status Utils** (`lib/payment-status.ts`)
   - Tracks payment lifecycle (pending, completed, failed, cancelled)
   - Manages status transitions and validation

4. **Webhook Handler** (`app/api/webhooks/korapay/route.ts`)
   - Validates webhook signatures with HMAC-SHA256
   - Prevents duplicate webhook processing
   - Updates order status based on payment events
   - Handles: charge.completed, charge.failed, charge.cancelled

5. **Updated APIs**
   - `POST /api/checkout` - Creates order with payment reference
   - `POST /api/payment` - Initializes payment with Korapay
   - `GET /api/payment?order_id=` - Checks payment status

## Environment Variables

All Korapay credentials are required. Get them from your Korapay dashboard at https://dashboard.korapay.com

### Required Variables

```env
# Korapay API Key (secret key for server-side requests)
KORAPAY_SECRET_KEY=your_secret_key_here

# Korapay Public Key (optional, for client-side requests)
KORAPAY_PUBLIC_KEY=your_public_key_here

# Webhook Secret for signature validation
KORAPAY_WEBHOOK_SECRET=your_webhook_secret_here

# Application URL for webhook notifications
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Validation

The payment configuration validator will check on startup if all required credentials are present. If any are missing, the system will:
- Log a clear error message
- Return 500 errors when payment operations are attempted
- Prevent order checkout from proceeding

## Payment Flow

### 1. Customer Places Order

```
POST /api/checkout
{
  "product_id": "123",
  "quantity": 1,
  "payment_method_id": 1
}
```

**Response:**
```json
{
  "order": {
    "id": "order-123",
    "product_id": "123",
    "quantity": 1,
    "total_price": 5000,
    "payment_status": "pending",
    "payment_reference_id": "ORD-1234567890-abc123def"
  }
}
```

The order is created with `payment_status: "pending"` and a unique payment reference.

### 2. Initialize Payment

```
POST /api/payment
{
  "orderId": "order-123",
  "amount": 5000,
  "currency": "NGN",
  "email": "customer@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "checkout_url": "https://checkout.korapay.com/...",
  "reference": "ORD-1234567890-abc123def",
  "order_id": "order-123"
}
```

The customer is redirected to the Korapay checkout URL.

### 3. Customer Completes Payment

The customer enters payment details on Korapay and completes the transaction.

### 4. Webhook Notification

Korapay sends a webhook to:
```
POST /api/webhooks/korapay
```

With payload:
```json
{
  "event": "charge.completed",
  "data": {
    "reference": "ORD-1234567890-abc123def",
    "status": "success",
    "amount": 500000,
    "currency": "NGN",
    "customer": {
      "email": "customer@example.com",
      "name": "John Doe"
    }
  }
}
```

### 5. Webhook Processing

The webhook handler:
1. Validates the signature using HMAC-SHA256
2. Checks for duplicate webhooks
3. Finds the associated order
4. Updates order status to `completed`
5. Assigns credentials to the buyer
6. Logs the event for audit trail

### 6. Customer Views Purchase

Customer can view their order in My Purchases with:
- Payment status (Paid, Pending, Failed, Cancelled)
- Assigned credentials (only visible when payment is complete)
- Error messages (if payment failed)

## Webhook Configuration

### Setting Up Webhooks in Korapay Dashboard

1. Go to [Korapay Dashboard](https://dashboard.korapay.com)
2. Navigate to Settings → Webhooks
3. Add webhook endpoint:
   ```
   https://yourdomain.com/api/webhooks/korapay
   ```
4. Select events:
   - `charge.completed`
   - `charge.failed`
   - `charge.cancelled`
5. Copy the webhook secret and set `KORAPAY_WEBHOOK_SECRET` in `.env.local`

## Payment Status States

- **pending** - Order created, awaiting payment
- **completed** - Payment received, credentials assigned
- **failed** - Payment rejected by bank or Korapay
- **cancelled** - Customer cancelled the payment

## Error Handling

### Common Errors

**PaymentConfigError**
- Missing or invalid Korapay credentials
- **Fix**: Set all required environment variables

**ValidationError**
- Invalid order data, negative amount, etc.
- **Fix**: Check request payload is correct

**PaymentAPIError**
- Korapay API returned an error
- **Fix**: Check Korapay dashboard for service status

**WebhookProcessingError**
- Webhook processing failed
- **Fix**: Check server logs and webhook audit trail

### Error Responses

All payment errors are logged with timestamps and context. Check logs:
```bash
# Look for [Checkout], [Payment], or [Webhook] prefixes
grep "\[Payment\]\|\[Webhook\]\|\[Checkout\]" application.log
```

## Testing

### Test Credentials

Korapay provides test mode. Make sure you're using test credentials:

```env
KORAPAY_SECRET_KEY=test_pk_xxx  # Starts with "test_pk_"
```

### Test Payment Flow

1. Create an order via API
2. Initialize payment
3. In Korapay checkout, use test card: `4111 1111 1111 1111`
4. Complete payment
5. Korapay sends webhook to your endpoint
6. Check order status updated to completed

### Local Testing with ngrok

For local development, use ngrok to expose your webhook endpoint:

```bash
ngrok http 3000
```

Then set:
```env
NEXT_PUBLIC_APP_URL=https://your-ngrok-domain.ngrok.io
```

## Monitoring

### Database Tables

**orders** - Updated with payment tracking columns:
- `payment_status` - Current payment status
- `payment_reference_id` - Unique Korapay reference
- `payment_amount` - Final payment amount
- `payment_currency` - Payment currency
- `payment_completed_at` - Completion timestamp
- `payment_failed_at` - Failure timestamp
- `payment_error_message` - Error details

**payment_webhooks** - Audit trail:
- `reference_id` - Korapay reference
- `order_id` - Associated order
- `event_type` - Webhook event (charge.completed, etc.)
- `payload` - Raw webhook data
- `status` - Processing status (processed/failed/skipped)
- `created_at` - Receipt timestamp

## Troubleshooting

### Webhook Not Processing

1. Check webhook is registered in Korapay dashboard
2. Verify `KORAPAY_WEBHOOK_SECRET` matches dashboard setting
3. Check `NEXT_PUBLIC_APP_URL` is publicly accessible
4. Look for errors in `payment_webhooks` table with status='failed'

### Payment Status Not Updating

1. Verify webhook is actually being sent (check Korapay logs)
2. Check database connection is working
3. Look for logs with `[Webhook]` prefix
4. Verify `payment_reference_id` matches in webhook payload

### Credentials Not Assigned

1. Check webhook processed successfully
2. Verify credentials exist in `buyer_credentials_inventory`
3. Check order has available credentials matching quantity
4. Look for errors in webhook processing logs

## Security

- All webhook signatures are validated with HMAC-SHA256
- Duplicate webhooks are prevented via reference ID checking
- Database queries use parameterized statements
- Webhook processing is idempotent (safe to replay)
- Payment errors are logged but don't expose sensitive data
- Credentials are only shown to the buyer after successful payment

## Next Steps

1. Set environment variables in `.env.local`
2. Run database migration: `node scripts/005-enhance-payment-tracking.js`
3. Register webhook in Korapay dashboard
4. Test payment flow in test mode
5. Move to production credentials when ready
