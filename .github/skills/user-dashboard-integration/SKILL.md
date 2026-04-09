---
name: user-dashboard-integration
description: 'Automate user dashboard updates with balance and purchase history after all payments. Use for payment integration workflows, real-time updates, and API integrations.'
argument-hint: 'Specify the payment type (e.g., korapay, dashboard) or component to update'
---

# User Dashboard Payment Integration

## What It Accomplishes

This skill guides the automation of user dashboard updates, ensuring balance reflects immediately after payments and purchase history is added automatically. It covers both dashboard balance payments and external payment integrations like Korapay.

## When to Use

- After successful payment completion
- When implementing real-time dashboard updates
- For integrating payment webhooks with dashboard refresh
- When adding new purchase history entries

## Step-by-Step Procedure

1. **Identify Payment Type**
   - Determine if it's dashboard balance payment or external payment (Korapay)
   - Check current balance and order status

2. **Update Balance**
   - For dashboard payments: Deduct from buyer.balance immediately
   - For external payments: Add to buyer.balance via webhook
   - Ensure atomic transactions to prevent race conditions

3. **Add Purchase History**
   - Create order record with payment_status='completed'
   - Assign credentials from inventory
   - Link credentials to order

4. **Trigger Dashboard Update**
   - Implement polling mechanism for real-time balance display
   - Or add WebSocket notifications for instant updates
   - Refresh order history list
   - See [Dashboard Refresh Options](./references/dashboard-refresh.md) for detailed implementations

5. **Handle Errors and Edge Cases**
   - Validate webhook signatures for external payments
   - Prevent duplicate processing
   - Handle failed payments appropriately

## References

- [Dashboard Components](./references/dashboard-components.md)
- [Payment API Endpoints](./references/payment-apis.md)
- [Dashboard Refresh After External Payments](./references/dashboard-refresh.md)
- [Auto-Update Script](./scripts/auto-update-dashboard.js)

## Related Skills

- `payment-webhook-handler` — Robust webhook processing with duplicate prevention
- `real-time-notifications` — WebSocket / SSE notifications across the app
- `order-fulfillment-automation` — Automatic credential assignment and delivery
- `admin-dashboard-integration` — Real-time admin panel updates for pending deliveries

## Quality Checks

- Balance updates correctly after payment
- Purchase history appears immediately
- No duplicate orders or credential assignments
- Dashboard refreshes without manual intervention
