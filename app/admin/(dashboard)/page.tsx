import Link from "next/link"
import { getDb } from "@/lib/db"
import {
  Package,
  FolderOpen,
  ShoppingCart,
  Megaphone,
  Archive,
  CreditCard,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  Banknote,
} from "lucide-react"
import { PaymentMethodCard } from "@/components/admin/payment-method-card"
import { PaymentsOverview } from "@/components/admin/payments-overview"
import { StatCard } from "@/components/dashboard/stat-card"
import { DashboardHeader } from "@/components/dashboard/header"

function formatCurrency(value: string | number | null | undefined) {
  const amount = Number(value ?? 0)
  return `₦${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export default async function AdminDashboardPage() {
  const sql = getDb()

  const [products] = await sql`SELECT COUNT(*)::int as count FROM products`
  const [categories] = await sql`SELECT COUNT(*)::int as count FROM categories`
  const [orders] = await sql`SELECT COUNT(*)::int as count FROM orders`
  const [announcements] = await sql`SELECT COUNT(*)::int as count FROM announcements WHERE is_active = true`
  const [totalStock] = await sql`SELECT COALESCE(SUM(available_qty), 0)::int as total FROM products`
  
  // Payment stats
  const [paymentStats] = await sql`
    SELECT 
      COUNT(*)::int as total_transactions,
      COUNT(CASE WHEN payment_status = 'completed' THEN 1 END)::int as completed_count,
      COUNT(CASE WHEN payment_status = 'failed' THEN 1 END)::int as failed_count,
      COUNT(CASE WHEN payment_status = 'cancelled' THEN 1 END)::int as cancelled_count,
      COALESCE(SUM(CASE WHEN payment_status = 'completed' THEN total_price ELSE 0 END), 0) as total_revenue,
      COUNT(CASE WHEN payment_status = 'pending' THEN 1 END)::int as pending_count
    FROM orders
  `

  const [buyerStats] = await sql`
    SELECT
      COUNT(*)::int as buyers,
      COALESCE(SUM(balance), 0) as total_balance
    FROM buyers
  `

  const lowStockProducts = await sql`
    SELECT id, name, available_qty
    FROM products
    WHERE available_qty <= 5
    ORDER BY available_qty ASC, created_at DESC
    LIMIT 6
  `

  const recentOrders = await sql`
    SELECT
      o.id,
      o.total_price,
      o.payment_status,
      o.payment_method_type,
      o.created_at,
      b.email as buyer_email,
      p.name as product_name
    FROM orders o
    LEFT JOIN buyers b ON o.buyer_id = b.id
    LEFT JOIN products p ON o.product_id = p.id
    ORDER BY o.created_at DESC
    LIMIT 8
  `
  
  const recentProducts = await sql`
    SELECT p.name, p.price, p.available_qty, p.badge, c.name as category_name
    FROM products p LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.created_at DESC LIMIT 5
  `

  return (
    <div className="space-y-8">
      <DashboardHeader
        title="Admin Dashboard"
        description="Welcome back! Here’s a live overview of sales, inventory, payments, and recent activity."
        action={
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-2 rounded-lg bg-[#38bdf8] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0ea5e9]"
          >
            Manage products
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Total Products"
          value={products.count}
          icon={Package}
          color="cyan"
          description="Available products"
        />
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
      </div>

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

      {/* Payment Section */}
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

      {/* Operations Snapshot */}
      <div className="grid gap-6 xl:grid-cols-5">
        <div className="rounded-xl border border-border bg-card xl:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="font-semibold text-foreground">Low Stock Alerts</h2>
            <Link href="/admin/products" className="text-xs font-medium text-[#38bdf8] hover:underline">
              Open catalog
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

      {/* Payments Overview Section */}
      <div>
        <h2 className="mb-4 font-semibold text-foreground">Payment Transactions</h2>
        <PaymentsOverview />
      </div>

      {/* Recent Products */}
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
    </div>
  )
}
