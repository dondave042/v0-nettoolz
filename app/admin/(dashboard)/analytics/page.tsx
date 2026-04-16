import { getDb } from "@/lib/db"
import { TrendingUp, DollarSign, Users, ShoppingCart } from "lucide-react"
import { Card } from "@/components/dashboard/card"

export default async function AnalyticsPage() {
    const sql = getDb()

    // Get analytics data
    const dailyStats = await sql`
    SELECT 
      DATE(created_at) as date,
      COUNT(*)::int as total_orders,
      COUNT(CASE WHEN payment_status = 'completed' THEN 1 END)::int as completed_orders,
      COALESCE(SUM(CASE WHEN payment_status = 'completed' THEN total_price ELSE 0 END), 0) as revenue
    FROM orders
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY date DESC
    LIMIT 30
  `

    const topProducts = await sql`
    SELECT 
      p.id,
      p.name,
      COUNT(o.id)::int as purchase_count,
      COALESCE(SUM(o.total_price), 0) as total_revenue
    FROM products p
    LEFT JOIN orders o ON p.id = o.product_id
    GROUP BY p.id, p.name
    ORDER BY purchase_count DESC
    LIMIT 10
  `

    const paymentMethodStats = await sql`
    SELECT 
      pm.name,
      COUNT(o.id)::int as transaction_count,
      COALESCE(SUM(o.total_price), 0) as total_revenue
    FROM payment_methods pm
    LEFT JOIN orders o ON pm.id = o.payment_method_id
    GROUP BY pm.id, pm.name
    ORDER BY transaction_count DESC
  `

    // Calculate summary stats
    const totalRevenue = dailyStats.reduce((sum, day) => sum + Number(day.revenue || 0), 0)
    const totalOrders = dailyStats.reduce((sum, day) => sum + day.total_orders, 0)
    const completedOrders = dailyStats.reduce((sum, day) => sum + day.completed_orders, 0)
    const conversionRate = totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : "0.0"

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Analytics & Reports</h1>
                <p className="text-muted-foreground mt-2">Insights from the last 30 days</p>
            </div>

            {/* Summary Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card hoverable>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                            <p className="mt-2 text-3xl font-bold text-green-600">
                                ₦{totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                            </p>
                        </div>
                        <div className="h-12 w-12 rounded-lg bg-green-100/20 flex items-center justify-center">
                            <DollarSign className="h-6 w-6 text-green-600" />
                        </div>
                    </div>
                </Card>

                <Card hoverable>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                            <p className="mt-2 text-3xl font-bold text-blue-600">
                                {totalOrders}
                            </p>
                        </div>
                        <div className="h-12 w-12 rounded-lg bg-blue-100/20 flex items-center justify-center">
                            <ShoppingCart className="h-6 w-6 text-blue-600" />
                        </div>
                    </div>
                </Card>

                <Card hoverable>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Conversion Rate</p>
                            <p className="mt-2 text-3xl font-bold text-purple-600">
                                {conversionRate}%
                            </p>
                        </div>
                        <div className="h-12 w-12 rounded-lg bg-purple-100/20 flex items-center justify-center">
                            <TrendingUp className="h-6 w-6 text-purple-600" />
                        </div>
                    </div>
                </Card>

                <Card hoverable>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Avg Order Value</p>
                            <p className="mt-2 text-3xl font-bold text-cyan-600">
                                ₦{totalOrders > 0 ? (totalRevenue / totalOrders).toLocaleString('en-US', { maximumFractionDigits: 0 }) : 0}
                            </p>
                        </div>
                        <div className="h-12 w-12 rounded-lg bg-cyan-100/20 flex items-center justify-center">
                            <DollarSign className="h-6 w-6 text-cyan-600" />
                        </div>
                    </div>
                </Card>
            </div>

            {/* Top Products */}
            <Card header={<h2 className="font-bold text-foreground">Top Selling Products</h2>}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-left text-xs font-semibold uppercase text-muted-foreground">
                                <th className="px-4 py-3">Product Name</th>
                                <th className="px-4 py-3">Orders</th>
                                <th className="px-4 py-3">Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                                        No data available
                                    </td>
                                </tr>
                            ) : (
                                topProducts.map((product) => (
                                    <tr key={product.id} className="border-b border-border hover:bg-secondary/20 transition-colors">
                                        <td className="px-4 py-3 font-medium text-foreground">{product.name}</td>
                                        <td className="px-4 py-3 text-foreground">{product.purchase_count}</td>
                                        <td className="px-4 py-3 font-semibold text-green-600">
                                            ₦{parseFloat(product.total_revenue).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Payment Method Stats */}
            <Card header={<h2 className="font-bold text-foreground">Payment Method Usage</h2>}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-left text-xs font-semibold uppercase text-muted-foreground">
                                <th className="px-4 py-3">Payment Method</th>
                                <th className="px-4 py-3">Transactions</th>
                                <th className="px-4 py-3">Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paymentMethodStats.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                                        No data available
                                    </td>
                                </tr>
                            ) : (
                                paymentMethodStats.map((method) => (
                                    <tr key={method.name} className="border-b border-border hover:bg-secondary/20 transition-colors">
                                        <td className="px-4 py-3 font-medium text-foreground">{method.name}</td>
                                        <td className="px-4 py-3 text-foreground">{method.transaction_count}</td>
                                        <td className="px-4 py-3 font-semibold text-green-600">
                                            ₦{parseFloat(method.total_revenue).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Daily Stats Table */}
            <Card header={<h2 className="font-bold text-foreground">Daily Statistics</h2>}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border text-left text-xs font-semibold uppercase text-muted-foreground">
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Total Orders</th>
                                <th className="px-4 py-3">Completed</th>
                                <th className="px-4 py-3">Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dailyStats.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                                        No data available
                                    </td>
                                </tr>
                            ) : (
                                dailyStats.map((stat, index) => (
                                    <tr key={index} className="border-b border-border hover:bg-secondary/20 transition-colors">
                                        <td className="px-4 py-3 font-medium text-foreground">
                                            {new Date(stat.date).toLocaleDateString('en-US', {
                                                weekday: 'short',
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </td>
                                        <td className="px-4 py-3 text-foreground">{stat.total_orders}</td>
                                        <td className="px-4 py-3 text-foreground">{stat.completed_orders}</td>
                                        <td className="px-4 py-3 font-semibold text-green-600">
                                            ₦{parseFloat(stat.revenue).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    )
}
