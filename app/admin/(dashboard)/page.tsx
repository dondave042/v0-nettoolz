import { getDb } from "@/lib/db"
import { Package, FolderOpen, ShoppingCart, Megaphone, Archive, CreditCard, TrendingUp, DollarSign } from "lucide-react"
import { PaymentMethodCard } from "@/components/admin/payment-method-card"
import { PaymentsOverview } from "@/components/admin/payments-overview"
import { StatCard } from "@/components/dashboard/stat-card"
import { DashboardHeader } from "@/components/dashboard/header"

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

  return (
    <div className="space-y-8">
      <DashboardHeader
        title="Admin Dashboard"
        description="Welcome back! Monitor your business metrics and manage payment operations."
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

      {/* Payment Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-foreground">Payment Overview</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            label="Total Revenue"
            value={`₦${paymentStats.total_revenue ? parseFloat(paymentStats.total_revenue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}`}
            icon={DollarSign}
            color="green"
            description={`${paymentStats.completed_count} completed transactions`}
            trend={{ direction: "up", percentage: 12 }}
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
