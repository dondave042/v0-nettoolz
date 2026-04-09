// scripts/auto-update-dashboard.js
// Example script to add polling for dashboard updates
// Install SWR first: npm install swr

import useSWR from 'swr';

const fetcher = (url) => fetch(url).then((res) => res.json());

export function useDashboardData() {
  const { data, error, mutate } = useSWR('/api/buyers/me', fetcher, {
    refreshInterval: 30000, // Poll every 30 seconds
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });

  const { data: stats } = useSWR('/api/buyers/stats', fetcher, {
    refreshInterval: 30000,
  });

  const { data: orders } = useSWR('/api/checkout', fetcher, {
    refreshInterval: 30000,
  });

  return {
    buyer: data,
    stats,
    orders,
    error,
    mutate, // Call this to manually refresh
  };
}

// Usage in dashboard component:
// const { buyer, stats, orders, mutate } = useDashboardData();