// DEPRECATED: This file is no longer used.
// The dashboard page has been moved to app/admin/(dashboard)/page.tsx.
export { }

      <StatCard
        label="Categories"
        value={categories.count}
        icon={FolderOpen}
        color="blue"
        description="Product categories"
      />
      <StatCard
        label="Total Orders"
        value={orders.count}
        icon={ShoppingCart}
        color="cyan"
        description="Transactions"
      />
      <StatCard
        label="Active Announcements"
        value={announcements.count}
        icon={Megaphone}
        color="purple"
        description="Published"
      />
      <StatCard
        label="Total Stock"
        value={totalStock.total}
        icon={Archive}
        color="green"
        description="Units in inventory"
      />
    </div >

  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
    <StatCard
      label="Registered Buyers"
      value={buyerStats.buyers}
      icon={ShoppingCart}
      color="blue"
      description="Total accounts"
    />
    <StatCard
      label="Wallet Balances"
      value={formatCurrency(buyerStats.total_balance)}
      icon={Banknote}
      color="green"
      description="Combined buyer balance"
    />
    <StatCard
      label="Failed Payments"
      value={paymentStats.failed_count}
      icon={CreditCard}
      color="red"
      description={`${paymentStats.cancelled_count} cancelled`}
    />
    <StatCard
      label="Pending Payments"
      value={paymentStats.pending_count}
      icon={CreditCard}
      color="purple"
      description="Needs manual review"
    />
  </div>

{/* Payment Section */ }
<div className="space-y-6">
  <h2 className="text-xl font-bold text-foreground">Payment Overview</h2>
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <StatCard
      label="Total Revenue"
      value={formatCurrency(paymentStats.total_revenue)}
      icon={DollarSign}
      color="green"
      description={`${paymentStats.completed_count} completed transactions`}
    />
    <StatCard
      label="Total Transactions"
      value={paymentStats.total_transactions}
      icon={CreditCard}
      color="cyan"
      description={`${paymentStats.pending_count} pending payments`}
    />
    <div className="lg:col-span-1">
      <PaymentMethodCard />
    </div>
  </div>
</div>

{/* Operations Snapshot */ }
<div className="grid gap-6 xl:grid-cols-5">
  <div className="rounded-xl border border-border bg-card xl:col-span-2">
    <div className="flex items-center justify-between border-b border-border px-6 py-4">
      <h2 className="font-semibold text-foreground">Low Stock Alerts</h2>
      <Link href="/products" className="text-xs font-medium text-[#38bdf8] hover:underline">
        View storefront
      </Link>
    </div>
    <div className="space-y-2 px-6 py-4">
      {lowStockProducts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No low-stock items right now 🎉</p>
      ) : (
        lowStockProducts.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
              <p className="text-xs text-muted-foreground">Product ID: {item.id}</p>
            </div>
            <div className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
              <AlertTriangle className="h-3 w-3" />
              {item.available_qty} left
            </div>
          </div>
        ))
      )}
    </div>
  </div>

  <div className="rounded-xl border border-border bg-card xl:col-span-3">
    <div className="border-b border-border px-6 py-4">
      <h2 className="font-semibold text-foreground">Recent Orders</h2>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <th className="px-6 py-3">Order</th>
            <th className="px-6 py-3">Buyer</th>
            <th className="px-6 py-3">Product</th>
            <th className="px-6 py-3">Method</th>
            <th className="px-6 py-3">Status</th>
            <th className="px-6 py-3">Amount</th>
          </tr>
        </thead>
        <tbody>
          {recentOrders.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">
                No orders yet.
              </td>
            </tr>
          ) : (
            recentOrders.map((order) => (
              <tr key={order.id} className="border-b border-border last:border-0">
                <td className="px-6 py-3 text-sm font-mono text-foreground">#{order.id}</td>
                <td className="px-6 py-3 text-sm text-muted-foreground">{order.buyer_email || "Guest"}</td>
                <td className="px-6 py-3 text-sm text-foreground">{order.product_name || "Unknown product"}</td>
                <td className="px-6 py-3 text-sm text-muted-foreground">
                  {order.payment_method_type || "N/A"}
                </td>
                <td className="px-6 py-3">
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium capitalize text-foreground">
                    {order.payment_status}
                  </span>
                </td>
                <td className="px-6 py-3 text-sm font-semibold text-foreground">
                  {formatCurrency(order.total_price)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
</div>

{/* Payments Overview Section */ }
<div>
  <h2 className="mb-4 font-semibold text-foreground">Payment Transactions</h2>
  <PaymentsOverview />
</div>

{/* Recent Products */ }
<div className="rounded-xl border border-border bg-card">
  <div className="border-b border-border px-6 py-4">
    <h2 className="font-semibold text-foreground">Recent Products</h2>
  </div>
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead>
        <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
          <th className="px-6 py-3">Name</th>
          <th className="px-6 py-3">Category</th>
          <th className="px-6 py-3">Price</th>
          <th className="px-6 py-3">Stock</th>
          <th className="px-6 py-3">Badge</th>
        </tr>
      </thead>
      <tbody>
        {recentProducts.map((p, i) => (
          <tr key={i} className="border-b border-border last:border-0">
            <td className="px-6 py-3 text-sm font-medium text-foreground">{p.name}</td>
            <td className="px-6 py-3 text-sm text-muted-foreground">{p.category_name}</td>
            <td className="px-6 py-3 text-sm text-foreground">{formatCurrency(p.price)}</td>
            <td className="px-6 py-3 text-sm text-foreground">{p.available_qty}</td>
            <td className="px-6 py-3">
              {p.badge ? (
                <span className="rounded-full bg-[#e0f2fe] px-2.5 py-0.5 text-xs font-medium text-[#0284c7]">
                  {p.badge}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">-</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</div>
  </div >
)
}
