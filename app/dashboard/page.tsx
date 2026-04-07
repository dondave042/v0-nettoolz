"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  Heart,
  Zap,
  ArrowRight,
  CreditCard,
  DollarSign,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserHeader } from "@/components/dashboard/user-header"
import { UserSidebar } from "@/components/dashboard/user-sidebar"
import { Card } from "@/components/dashboard/card"
import { DashboardFooter } from "@/components/dashboard/footer"
import { toast } from "sonner"

interface UserStats {
  totalOrders: number
  pendingOrders: number
  totalSpent: number
  wishlistItems: number
}

interface OrderSummary {
  id: number
  product_name: string
  payment_status: string
  total_price: number
  created_at: string
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)

export default function DashboardPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userName, setUserName] = useState("User")
  const [userBalance, setUserBalance] = useState(0)
  const [stats, setStats] = useState<UserStats>({
    totalOrders: 0,
    pendingOrders: 0,
    totalSpent: 0,
    wishlistItems: 0,
  })
  const [recentOrders, setRecentOrders] = useState<OrderSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/buyers/me")
        if (res.ok) {
          const data = await res.json()
          setUserName(data.buyer?.name || "User")
          setUserBalance(data.buyer?.balance || 0)

            const [statsRes, ordersRes] = await Promise.all([
              fetch("/api/buyers/stats"),
              fetch("/api/checkout"),
            ])

            if (statsRes.ok) {
              const statsData = await statsRes.json()
              setStats({
                totalOrders: statsData.totalOrders || 0,
                pendingOrders: statsData.pendingOrders || 0,
                totalSpent: statsData.totalSpent || 0,
                wishlistItems: statsData.wishlistItems || 0,
              })
            }

            if (ordersRes.ok) {
              const ordersData = await ordersRes.json()
              setRecentOrders(
                (ordersData.orders || [])
                  .slice(0, 5)
                  .map((order: any) => ({
                    id: order.id,
                    product_name: order.product_name,
                    payment_status: order.payment_status,
                    total_price: parseFloat(order.total_price),
                    created_at: order.created_at,
                  }))
              )
        setLoading(false)
      }
    }

    checkSession()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full bg-[#38bdf8]/20 animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <UserHeader onMenuToggle={setSidebarOpen} userName={userName} />
      
      <div className="flex flex-1">
        <UserSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Welcome back, {userName}!
              </h1>
              <p className="text-muted-foreground">
                Manage your purchases and explore new products
              </p>
            </div>

            <div className="mb-6 rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Account Balance</p>
                  <p className="mt-2 text-4xl font-bold text-foreground">
                    ₦{userBalance.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-2xl bg-green-50 px-4 py-3 text-green-700 shadow-sm">
                  Available for dashboard checkout
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card hoverable>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                    <p className="mt-2 text-3xl font-bold text-foreground">
                      {stats.totalOrders}
                    </p>
                  </div>
                  <ShoppingCart className="h-6 w-6 text-[#38bdf8]" />
                </div>
              </Card>

              <Card hoverable>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Orders</p>
                    <p className="mt-2 text-3xl font-bold text-amber-600">
                      {stats.pendingOrders}
                    </p>
                  </div>
                  <AlertCircle className="h-6 w-6 text-amber-600" />
                </div>
              </Card>

              <Card hoverable>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                    <p className="mt-2 text-3xl font-bold text-green-600">
                      {formatCurrency(stats.totalSpent)}
                    </p>
                  </div>
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </Card>

              <Card hoverable>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Wishlist Items</p>
                    <p className="mt-2 text-3xl font-bold text-pink-600">
                      {stats.wishlistItems}
                    </p>
                  </div>
                  <Heart className="h-6 w-6 text-pink-600" />
                </div>
              </Card>
            </div>

            {/* Recent Activity and Balance Insights */}
            <div className="mb-8 grid gap-4 lg:grid-cols-[1.7fr_1fr]">
              <Card hoverable>
                <div className="flex flex-col gap-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-foreground">Recent Activity</h2>
                      <p className="text-sm text-muted-foreground">Latest orders and payment updates</p>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => router.push('/my-purchases')}
                      className="h-11 px-4 text-sm"
                    >
                      View all
                    </Button>
                  </div>

                  <div className="overflow-hidden rounded-3xl border border-border bg-background">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-50 text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Order</th>
                          <th className="px-4 py-3">Product</th>
                          <th className="px-4 py-3">Amount</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentOrders.length > 0 ? (
                          recentOrders.map((order) => (
                            <tr key={order.id} className="border-t border-border last:border-none">
                              <td className="px-4 py-3 font-medium text-foreground">#{order.id}</td>
                              <td className="px-4 py-3 text-muted-foreground">{order.product_name}</td>
                              <td className="px-4 py-3 text-foreground">{formatCurrency(order.total_price)}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                  order.payment_status === 'completed'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : order.payment_status === 'pending'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {order.payment_status}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-sm text-muted-foreground">
                              No recent orders yet. Start shopping to see activity here.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>

              <Card hoverable className="space-y-6 p-6">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-[#38bdf8]/10 p-3 text-[#0ea5e9]">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Available Balance</p>
                      <p className="mt-2 text-3xl font-bold text-foreground">{formatCurrency(userBalance)}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your balance is ready for secure dashboard payments and quick checkout.
                  </p>
                  <div className="grid gap-3">
                    <Button onClick={() => router.push('/my-purchases')} className="w-full">
                      Use balance for checkout
                    </Button>
                    <a
                      href="https://checkout.korapay.com/pay/nettoolz"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition hover:bg-secondary/50"
                    >
                      Top up balance
                    </a>
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-foreground mb-4">Quick Actions</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Link href="/#products">
                  <Card hoverable className="group cursor-pointer">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-foreground group-hover:text-[#38bdf8] transition-colors">
                          Shop Products
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Browse our catalog
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-[#38bdf8] transition-colors" />
                    </div>
                  </Card>
                </Link>

                <Link href="/my-purchases">
                  <Card hoverable className="group cursor-pointer">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-foreground group-hover:text-[#38bdf8] transition-colors">
                          Orders
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Review your purchase history
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-[#38bdf8] transition-colors" />
                    </div>
                  </Card>
                </Link>

                <Link href="/dashboard/support">
                  <Card hoverable className="group cursor-pointer">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-foreground group-hover:text-[#38bdf8] transition-colors">
                          Support
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Get help quickly
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-[#38bdf8] transition-colors" />
                    </div>
                  </Card>
                </Link>

                <a href="https://checkout.korapay.com/pay/nettoolz" target="_blank" rel="noopener noreferrer">
                  <Card hoverable className="group cursor-pointer">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-foreground group-hover:text-green-600 transition-colors">
                          One-time Payment
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Top up your account quickly
                        </p>
                      </div>
                      <CreditCard className="h-5 w-5 text-muted-foreground group-hover:text-green-600 transition-colors" />
                    </div>
                  </Card>
                </a>
              </div>
            </div>

            {/* Featured Products Section */}
            <Card header={<h2 className="font-bold text-foreground">Featured Products</h2>}>
              <div className="text-center py-12">
                <Zap className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Check out our latest premium accounts
                </p>
                <Button
                  onClick={() => router.push("/#products")}
                  className="bg-[#38bdf8] text-white hover:bg-[#0ea5e9]"
                >
                  Browse Products
                </Button>
              </div>
            </Card>
          </div>

          <DashboardFooter />
        </main>
      </div>
    </div>
  )
}
