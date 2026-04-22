"use client"

import { Suspense, useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ShoppingCart,
  AlertCircle,
  Wallet,
  ArrowRight,
  CreditCard,
  CheckCircle2,
  Clock,
  PlusCircle,
  Gift,
  Package,
  TrendingUp,
  Zap,
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

interface Deposit {
  id: string
  direction: 'credit' | 'debit'
  amount: number
  status: string
  reference_id: string | null
  title: string
  type: string
  occurred_at: string
}

interface DashboardSummaryResponse {
  buyer: {
    id: number
    name: string
    balance: number
  }
  stats: UserStats
  events: {
    lastPurchaseSuccessAt: string | null
    lastDepositSuccessAt: string | null
  }
  recentOrders: Order[]
  recentActivity: Deposit[]
  serverTime: string
}

function DashboardPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userName, setUserName] = useState("User")
  const [stats, setStats] = useState<UserStats>({
    balance: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalSpent: 0,
  })
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [recentDeposits, setRecentDeposits] = useState<Deposit[]>([])
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [topUpAmount, setTopUpAmount] = useState('1000')
  const [topUpLoading, setTopUpLoading] = useState(false)
  const lastPaymentEventRef = useRef<{ purchase: string | null; deposit: string | null } | null>(null)
  const fastSyncUntilRef = useRef(0)

  const fetchDashboardData = useCallback(async (silent = false) => {
    try {
      const summaryRes = await fetch('/api/dashboard/summary', { cache: 'no-store' })

      if (!summaryRes.ok) {
        router.push("/login")
        return
      }

      const summaryData = await summaryRes.json() as DashboardSummaryResponse

      setUserName(summaryData.buyer?.name || 'User')
      setStats(summaryData.stats || {
        balance: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalSpent: 0,
      })
      setRecentOrders(summaryData.recentOrders || [])
      setRecentDeposits(summaryData.recentActivity || [])
      setLastSyncedAt(summaryData.serverTime || new Date().toISOString())

      const nextEvents = {
        purchase: summaryData.events?.lastPurchaseSuccessAt ?? null,
        deposit: summaryData.events?.lastDepositSuccessAt ?? null,
      }
      const previousEvents = lastPaymentEventRef.current
      lastPaymentEventRef.current = nextEvents

      if (
        silent &&
        previousEvents &&
        (previousEvents.purchase !== nextEvents.purchase || previousEvents.deposit !== nextEvents.deposit)
      ) {
        toast.success("Payment update received")
      }
    } catch (error) {
      console.error("[Dashboard] Failed to fetch data:", error)
      if (!silent) toast.error("Failed to load dashboard")
    } finally {
      if (!silent) setLoading(false)
    }
  }, [router])

  const paymentStatusConfig = {
    completed: { icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30", label: "Paid" },
    failed: { icon: AlertCircle, color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/30", label: "Failed" },
    pending: { icon: Clock, color: "text-yellow-600", bg: "bg-yellow-100 dark:bg-yellow-900/30", label: "Pending" },
    cancelled: { icon: AlertCircle, color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-900/30", label: "Cancelled" },
  }

  useEffect(() => {
    const cameFromPayment = searchParams.get('refresh') === 'payment'
    if (cameFromPayment) {
      // Poll aggressively for one minute after returning from payment provider.
      fastSyncUntilRef.current = Date.now() + 60_000
      router.replace('/dashboard')
    }

    fetchDashboardData()

    // Poll frequently after payment redirect, then fall back to normal cadence.
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    const scheduleNextPoll = () => {
      const intervalMs = Date.now() < fastSyncUntilRef.current ? 1_500 : 5_000
      timeoutId = setTimeout(async () => {
        if (!document.hidden) {
          await fetchDashboardData(true)
        }
        scheduleNextPoll()
      }, intervalMs)
    }
    scheduleNextPoll()

    // Re-fetch immediately when user returns to this tab (e.g., after Korapay redirect)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") fetchDashboardData(true)
    }
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      if (timeoutId) clearTimeout(timeoutId)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [fetchDashboardData, router, searchParams])

  async function handleTopUp() {
    const parsedAmount = Number(topUpAmount)

    if (!Number.isFinite(parsedAmount) || parsedAmount < 100) {
      toast.error('Enter a top-up amount of at least 100')
      return
    }

    setTopUpLoading(true)
    try {
      const response = await fetch('/api/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parsedAmount, currency: 'NGN' }),
      })

      const payload = await response.json()

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to initialize top-up')
      }

      if (!payload.checkout_url) {
        throw new Error('Top-up checkout URL was not returned')
      }

      window.location.href = payload.checkout_url
    } catch (error) {
      console.error('[Dashboard] Top-up error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to initialize top-up')
    } finally {
      setTopUpLoading(false)
    }
  }

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
      <UserHeader onMenuToggle={setSidebarOpen} userName={userName} userBalance={stats.balance} />

      <div className="flex flex-1">
        <UserSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          userBalance={stats.balance}
        />

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
              <p className="mt-1 text-xs text-muted-foreground">
                Live sync enabled. Last update: {lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString() : 'just now'}
              </p>
            </div>

            {/* Balance Card */}
            <div className="mb-8">
              <Card>
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Account Balance</p>
                    <p className="mt-2 text-4xl font-bold text-[#38bdf8]">
                      ₦{stats.balance.toLocaleString()}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Available for purchases</p>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="100"
                        step="100"
                        value={topUpAmount}
                        onChange={(event) => setTopUpAmount(event.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-[#38bdf8] focus:outline-none sm:w-36"
                        placeholder="Top-up amount"
                      />
                      <Button
                        type="button"
                        onClick={handleTopUp}
                        disabled={topUpLoading}
                        className="gap-2 bg-[#38bdf8] text-white hover:bg-[#0ea5e9]"
                      >
                        <PlusCircle className="h-4 w-4" />
                        {topUpLoading ? 'Loading...' : 'Top Up Balance'}
                      </Button>
                    </div>
                    <div className="h-16 w-16 rounded-xl bg-[#38bdf8]/10 flex items-center justify-center">
                      <Wallet className="h-8 w-8 text-[#38bdf8]" />
                    </div>
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
                    <Link href="/orders" className="text-sm text-[#38bdf8] hover:text-[#0ea5e9]">
                      View all →
                    </Link>
                  </div>
                }
              >
                {recentOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">No purchases yet</p>
                    <Link href="/shop">
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

            <div className="mb-8">
              <Card
                header={
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-foreground">Recent Balance Activity</h2>
                    <Link href="/transactions" className="text-sm text-[#38bdf8] hover:text-[#0ea5e9]">
                      View all →
                    </Link>
                  </div>
                }
              >
                {recentDeposits.length === 0 ? (
                  <div className="py-8 text-center">
                    <Gift className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">No balance activity yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {recentDeposits.map((deposit) => (
                      <div key={deposit.id} className="flex items-center justify-between gap-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${deposit.direction === 'credit' ? 'bg-emerald-100/40' : 'bg-red-100/40'}`}>
                            <Gift className={`h-4 w-4 ${deposit.direction === 'credit' ? 'text-emerald-600' : 'text-red-600'}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">{deposit.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(deposit.occurred_at).toLocaleDateString()} · {deposit.status}
                            </p>
                          </div>
                        </div>
                        <p className={`flex-shrink-0 font-bold ${deposit.direction === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {deposit.direction === 'credit' ? '+' : '-'}₦{deposit.amount.toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-foreground mb-4">Quick Actions</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Link href="/shop">
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

                <Link href="/orders">
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

                <Link href="/quick-pay">
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
                </Link>

                <Link href="/support">
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
                  onClick={() => router.push("/shop")}
                  className="bg-[#38bdf8] text-white hover:bg-[#0ea5e9]"
                >
                  Browse Products
                </Button>
              </div>
            </Card>
          </div>

          <DashboardFooter />
        </main >
      </div >
    </div >
  )
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="h-12 w-12 rounded-full bg-[#38bdf8]/20 animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      }
    >
      <DashboardPageContent />
    </Suspense>
  )
}
