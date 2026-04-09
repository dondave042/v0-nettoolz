# Handling Dashboard Refresh After External Payments

Since webhooks are server-side and cannot directly update the client UI, here are several approaches to handle dashboard refresh after external payments (e.g., Korapay):

## Option 1: Polling (Recommended for Simplicity)

Add automatic polling to the dashboard to check for balance/order updates.

**Pros**: Simple to implement, works reliably
**Cons**: Slight delay, unnecessary requests if no changes

```javascript
// In app/dashboard/page.tsx
'use client';

import { useDashboardData } from '../../.github/skills/user-dashboard-integration/scripts/auto-update-dashboard';

export default function Dashboard() {
  const { buyer, stats, orders, error } = useDashboardData();

  if (error) return <div>Error loading dashboard</div>;
  if (!buyer) return <div>Loading...</div>;

  return (
    <div>
      <h1>Balance: ₦{buyer.balance}</h1>
      {/* Other dashboard content */}
    </div>
  );
}
```

## Option 2: Redirect with Success Parameter

After payment completion, redirect user back to dashboard with a query parameter to trigger refresh.

**Pros**: Immediate update on return
**Cons**: Only updates when user navigates back

```javascript
// In app/dashboard/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    // Check for success parameter on mount
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment_success') === 'true') {
      // Force refresh data
      window.location.reload();
      // Or use mutate() if using SWR
    }
  }, []);

  // ... rest of component
}
```

## Option 3: WebSocket Notifications (Advanced)

Implement WebSocket connection for real-time updates.

**Pros**: Instant updates
**Cons**: More complex, requires WebSocket server

```javascript
// Requires additional setup (e.g., Socket.io)
// Not implemented in current codebase
```

## Option 4: Server-Sent Events

Use SSE for push notifications from server.

**Pros**: Server-initiated, efficient
**Cons**: Not supported in all browsers, requires server changes

## Recommended Approach

Start with **Option 1 (Polling)** as it's the simplest and most reliable for this use case. The 30-second interval provides near real-time updates without excessive API calls.

For external payments, combine with success redirects to ensure immediate feedback when users return to the dashboard.
