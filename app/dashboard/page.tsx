"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  Wallet,
  Zap,
  ArrowRight,
  CreditCard,
  CheckCircle2,
  Clock,
  Package,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserHeader } from "@/components/dashboard/user-header"
import { UserSidebar } from "@/components/dashboard/user-sidebar"
import { Card } from "@/components/dashboard/card"
import { DashboardFooter } from "@/components/dashboard/footer"
import { toast } from "sonner"

interface UserStats {
  balance: number
  totalOrders: number
  pendingOrders: number
  totalSpent: number
}

interface Order {
  id: number
  product_name: string
  quantity: number
  total_price: string
  payment_status: string
  payment_method_name: string
  created_at: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userName, setUserName] = useState("User")
  const [stats, setStats] = useState<UserStats>({
    balance: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalSpent: 0,
  })
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = useCallback(async (silent = false) => {
    try {
      // Check authentication first
      const meRes = await fetch("/api/buyers/me")
      if (!meRes.ok) {
        router.push("/login")
        return
      }
      const meData = await meRes.json()
      setUserName(meData.buyer?.name || "User")

      // Fetch stats and orders in parallel
      const [statsRes, ordersRes] = await Promise.all([
        fetch("/api/buyers/stats"),
        fetch("/api/orders"),
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats({
          balance: parseFloat(meData.buyer?.balance ?? 0),
          totalOrders: statsData.totalOrders ?? 0,
          pendingOrders: statsData.pendingOrders ?? 0,
          totalSpent: statsData.totalSpent ?? 0,
        })
      }

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json()
        setRecentOrders((ordersData.orders || []).slice(0, 5))
      }
    } catch (error) {
      console.error("[Dashboard] Failed to fetch data:", error)
      if (!silent) toast.error("Failed to load dashboard")
    } finally {
      if (!silent) setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchDashboardData()

    // Poll every 30 seconds, pausing when the tab is not visible
    const interval = setInterval(() => {
      if (!document.hidden) fetchDashboardData(true)
    }, 30_000)

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") fetchDashboardData(true)
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [fetchDashboardData])

  // Refresh when returning to page after payment
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get("payment_success") === "true") {
      fetchDashboardData(true)
    }
  }, [fetchDashboardData])

  const paymentStatusConfig = {
    completed: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30", label: "Paid" },
    failed: { icon: AlertCircle, color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/30", label: "Failed" },
    pending: { icon: Clock, color: "text-yellow-600", bg: "bg-yellow-100 dark:bg-yellow-900/30", label: "Pending" },
    cancelled: { icon: AlertCircle, color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-900/30", label: "Cancelled" },
  }

  useEffect(() => {
    fetchDashboardData()

    // Poll every 5 seconds for webhook-driven updates (Korapay payment completion)
    // This catches real-time balance/order status changes from payment webhooks
    const interval = setInterval(() => {
      if (!document.hidden) fetchDashboardData(true)
    }, 5_000)

    // Re-fetch immediately when user returns to this tab (e.g., after Korapay redirect)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchDashboardData(true)
    }
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      clearInterval(interval)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [fetchDashboardData])

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

            {/* Balance Card */}
            <div className="mb-8">
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Account Balance</p>
                    <p className="mt-2 text-4xl font-bold text-[#38bdf8]">
                      ₦{stats.balance.toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Available for purchases</p>
                  </div>
                  <div className="h-16 w-16 rounded-xl bg-[#38bdf8]/10 flex items-center justify-center">
                    <Wallet className="h-8 w-8 text-[#38bdf8]" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Stats Grid */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card hoverable>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                    <p className="mt-2 text-3xl font-bold text-foreground">
                      {stats.totalOrders}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-[#38bdf8]/10 flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6 text-[#38bdf8]" />
                  </div>
                </div>
              </Card>

              <Card hoverable>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Orders</p>
                    <p className="mt-2 text-3xl font-bold text-amber-600">
                      {stats.pendingOrders}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-amber-100/20 flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </Card>

              <Card hoverable>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                    <p className="mt-2 text-3xl font-bold text-green-600">
                      ₦{stats.totalSpent.toLocaleString()}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-green-100/20 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </Card>

              <Card hoverable>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Account Balance</p>
                    <p className="mt-2 text-3xl font-bold text-purple-600">
                      ₦{stats.balance.toLocaleString()}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-purple-100/20 flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Purchase History */}
            <div className="mb-8">
              <Card
                header={
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-foreground">Recent Purchase History</h2>
                    <Link href="/my-purchases" className="text-sm text-[#38bdf8] hover:text-[#0ea5e9]">
                      View all →
                    </Link>
                  </div>
                }
              >
                {recentOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">No purchases yet</p>
                    <Link href="/#products">
                      <Button size="sm" className="mt-4 bg-[#38bdf8] text-white hover:bg-[#0ea5e9]">
                        Browse Products
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {recentOrders.map((order) => {
                      const statusCfg =
                        paymentStatusConfig[order.payment_status as keyof typeof paymentStatusConfig] ||
                        paymentStatusConfig.pending
                      const StatusIcon = statusCfg.icon
                      return (
                        <div key={order.id} className="flex items-center justify-between py-3 gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`rounded-lg p-2 ${statusCfg.bg} flex-shrink-0`}>
                              <StatusIcon className={`h-4 w-4 ${statusCfg.color}`} />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground text-sm truncate">{order.product_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(order.created_at).toLocaleDateString()} · {order.payment_method_name}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-foreground">
                              ₦{parseFloat(order.total_price).toLocaleString()}
                            </p>
                            <span className={`text-xs font-medium ${statusCfg.color}`}>
                              {statusCfg.label}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-foreground mb-4">Quick Actions</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Link href="/#products">
                  <Card hoverable className="group cursor-pointer">
                    <div className="flex items-center justify-between">
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
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground group-hover:text-[#38bdf8] transition-colors">
                          View Orders
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Your order history
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-[#38bdf8] transition-colors" />
                    </div>
                  </Card>
                </Link>

                <a href="https://checkout.korapay.com/pay/nettoolz" target="_blank" rel="noopener noreferrer">
                  <Card hoverable className="group cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground group-hover:text-green-600 transition-colors">
                          Quick Payment
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          One-time payment
                        </p>
                      </div>
                      <CreditCard className="h-5 w-5 text-muted-foreground group-hover:text-green-600 transition-colors" />
                    </div>
                  </Card>
                </a>

                <Link href="/dashboard/support">
                  <Card hoverable className="group cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground group-hover:text-[#38bdf8] transition-colors">
                          Get Support
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Contact our team
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-[#38bdf8] transition-colors" />
                    </div>
                  </Card>
                </Link>
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
