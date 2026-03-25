import { getDb } from "@/lib/db"
import { Package, FolderOpen, ShoppingCart, Megaphone, Archive, CreditCard, TrendingUp } from "lucide-react"
import { PaymentMethodCard } from "@/components/admin/payment-method-card"
import { PaymentsOverview } from "@/components/admin/payments-overview"

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
      COALESCE(SUM(CASE WHEN payment_status = 'completed' THEN total_price ELSE 0 END), 0) as total_revenue,
      COUNT(CASE WHEN payment_status = 'pending' THEN 1 END)::int as pending_count
    FROM orders
  `
  
  const recentProducts = await sql`
    SELECT p.name, p.price, p.available_qty, p.badge, c.name as category_name
    FROM products p LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.created_at DESC LIMIT 5
  `

  const stats = [
    { label: "Products", value: products.count, icon: Package, color: "bg-[#38bdf8]" },
    { label: "Categories", value: categories.count, icon: FolderOpen, color: "bg-[#0ea5e9]" },
    { label: "Orders", value: orders.count, icon: ShoppingCart, color: "bg-[#0284c7]" },
    { label: "Announcements", value: announcements.count, icon: Megaphone, color: "bg-[#7dd3fc]" },
    { label: "Total Stock", value: totalStock.total, icon: Archive, color: "bg-[#0c4a6e]" },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[var(--font-heading)] text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome back to your NETTOOLZ admin panel</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="flex items-center gap-4 rounded-xl border border-border bg-card p-5"
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${color} text-white`}>
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Payment Method & Overview Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Payment Method Card - Takes 1 column on large screens */}
        <div className="lg:col-span-1">
          <PaymentMethodCard />
        </div>
        
        {/* Payment Summary Cards - Takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                  <p className="mt-2 text-2xl font-bold text-green-600">
                    ₦{paymentStats.total_revenue ? parseFloat(paymentStats.total_revenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {paymentStats.completed_count} completed transactions
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Payment Status</p>
                  <p className="mt-2 text-2xl font-bold text-[#38bdf8]">
                    {paymentStats.total_transactions}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {paymentStats.pending_count} pending payments
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-[#38bdf8]" />
              </div>
            </div>
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
                  <td className="px-6 py-3 text-sm text-foreground">${parseFloat(p.price).toFixed(2)}</td>
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
