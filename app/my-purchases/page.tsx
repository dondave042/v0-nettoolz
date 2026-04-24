"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/dashboard/header"
import { toast } from "sonner"
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  Loader2,
  LogOut,
  Package,
  Receipt,
} from "lucide-react"

interface Credential {
  id: number | null
  username: string | null
  password: string | null
}

interface Order {
  id: number
  product_id?: number | null
  product_name: string
  quantity: number
  total_price: string
  payment_status: string
  payment_method_name?: string
  payment_error_message?: string | null
  credential_count?: number
  credentials: Credential[]
  created_at: string
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  completed: {
    label: "Completed",
    color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    icon: CheckCircle2,
  },
  pending: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    icon: Clock,
  },
  failed: {
    label: "Failed",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    icon: AlertCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    icon: AlertCircle,
  },
}

function formatPrice(value: string | number) {
  return `₦${Number(value).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
}

export default function MyPurchasesPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const authResponse = await fetch("/api/buyers/me")
        if (authResponse.status === 401) {
          router.push("/login")
          return
        }

        const ordersResponse = await fetch("/api/orders")
        if (ordersResponse.status === 401) {
          router.push("/login")
          return
        }
        if (!ordersResponse.ok) {
          throw new Error("Failed to load purchases")
        }

        const data = await ordersResponse.json()
        setOrders(data.orders ?? [])
      } catch (error) {
        console.error("Load purchases error:", error)
        toast.error("Failed to load purchases")
      } finally {
        setLoading(false)
      }
    }

    loadOrders()
  }, [router])

  async function handleLogout() {
    try {
      await fetch("/api/buyers/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      })
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
      toast.error("Failed to logout")
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied`)
  }

  const completedCount = orders.filter((order) => order.payment_status?.toLowerCase() === "completed").length
  const pendingCount = orders.filter((order) => order.payment_status?.toLowerCase() === "pending").length
  const totalSpent = orders
    .filter((order) => order.payment_status?.toLowerCase() === "completed")
    .reduce((sum, order) => sum + Number(order.total_price), 0)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-[#38bdf8]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30 py-8">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <DashboardHeader
            title="My Purchases"
            description="Track your paid orders and view every assigned credential."
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link href="/quick-pay">
              <Button className="w-full gap-2 bg-green-600 hover:bg-green-700 sm:w-auto">
                <CreditCard className="h-4 w-4" />
                Top Up Balance
              </Button>
            </Link>
            <Button onClick={handleLogout} variant="outline" className="w-full gap-2 sm:w-auto">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <Receipt className="mb-2 h-5 w-5 text-[#38bdf8]" />
            <p className="text-2xl font-bold text-foreground">{orders.length}</p>
            <p className="text-sm text-muted-foreground">Total Orders</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <CheckCircle2 className="mb-2 h-5 w-5 text-green-600" />
            <p className="text-2xl font-bold text-foreground">{completedCount}</p>
            <p className="text-sm text-muted-foreground">Completed Orders</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <Package className="mb-2 h-5 w-5 text-[#38bdf8]" />
            <p className="text-2xl font-bold text-foreground">{formatPrice(totalSpent)}</p>
            <p className="text-sm text-muted-foreground">Total Spent</p>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border bg-secondary/30 p-12 text-center">
            <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium text-muted-foreground">You haven&apos;t made any purchases yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Your completed orders and credentials will appear here.</p>
            <Link href="/shop">
              <Button className="mt-6 bg-[#38bdf8] text-white hover:bg-[#0ea5e9]">
                Browse Products
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const status = statusConfig[order.payment_status?.toLowerCase()] ?? statusConfig.pending
              const StatusIcon = status.icon
              const credentialCount = order.credential_count ?? order.credentials.length

              return (
                <div key={order.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  <div className="border-b border-border bg-gradient-to-r from-secondary/30 to-transparent p-5">
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-xl p-2.5 ${status.color}`}>
                          <StatusIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">Order #{order.id}</p>
                          <p className="text-sm font-semibold text-foreground">{order.product_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-[#38bdf8]">{formatPrice(order.total_price)}</p>
                        <p className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-medium ${status.color}`}>
                          {status.label}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-4 text-sm sm:grid-cols-4">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Payment Method</p>
                        <p className="mt-0.5 font-medium text-foreground">{order.payment_method_name ?? "Balance"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Quantity</p>
                        <p className="mt-0.5 font-medium text-foreground">{order.quantity} unit(s)</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Credentials</p>
                        <p className="mt-0.5 font-medium text-foreground">{credentialCount}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Purchased</p>
                        <p className="mt-0.5 font-medium text-foreground">
                          {new Date(order.created_at).toLocaleDateString("en-NG", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {order.payment_status === "failed" && order.payment_error_message ? (
                    <div className="border-t border-border bg-red-50 p-5 dark:bg-red-900/20">
                      <div className="flex gap-3">
                        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
                        <div>
                          <p className="text-sm font-semibold text-red-900 dark:text-red-100">Payment Failed</p>
                          <p className="mt-1 text-sm text-red-800 dark:text-red-200">{order.payment_error_message}</p>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {order.payment_status === "completed" && order.credentials.length > 0 ? (
                    <div className="space-y-4 border-t border-border bg-gradient-to-r from-green-50/30 to-transparent p-5 dark:from-green-900/10">
                      <h4 className="flex items-center gap-2 font-semibold text-foreground">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        Assigned Credentials
                      </h4>

                      {order.credentials.map((credential, index) => {
                        const passwordKey = `${order.id}-${index}`
                        return (
                          <div
                            key={credential.id ?? `${order.id}-${index}`}
                            className="space-y-3 rounded-xl border border-border bg-background p-4"
                          >
                            {credential.username ? (
                              <div>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Username</p>
                                <div className="flex items-center gap-2 rounded-lg bg-secondary/50 p-3">
                                  <code className="flex-1 text-sm text-foreground">{credential.username}</code>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(credential.username as string, "Username")}
                                    className="text-muted-foreground transition-colors hover:text-foreground"
                                    title="Copy username"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ) : null}

                            {credential.password ? (
                              <div>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Password</p>
                                <div className="flex items-center gap-2 rounded-lg bg-secondary/50 p-3">
                                  <code className="flex-1 text-sm text-foreground">
                                    {showPasswords[passwordKey]
                                      ? credential.password
                                      : "•".repeat(credential.password.length)}
                                  </code>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setShowPasswords((previous) => ({
                                        ...previous,
                                        [passwordKey]: !previous[passwordKey],
                                      }))
                                    }
                                    className="text-muted-foreground transition-colors hover:text-foreground"
                                    title="Show or hide password"
                                  >
                                    {showPasswords[passwordKey] ? (
                                      <EyeOff className="h-4 w-4" />
                                    ) : (
                                      <Eye className="h-4 w-4" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => copyToClipboard(credential.password as string, "Password")}
                                    className="text-muted-foreground transition-colors hover:text-foreground"
                                    title="Copy password"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  ) : null}

                  {order.payment_status === "completed" && order.credentials.length === 0 ? (
                    <div className="border-t border-border bg-blue-50 p-5 dark:bg-blue-900/20">
                      <div className="flex gap-3">
                        <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                        <p className="text-sm text-blue-900 dark:text-blue-100">
                          Payment is complete. Credentials are still being prepared for this order.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {order.payment_status === "pending" ? (
                    <div className="border-t border-border bg-yellow-50 p-5 dark:bg-yellow-900/20">
                      <div className="flex gap-3">
                        <Clock className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
                        <div>
                          <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">Waiting for Payment</p>
                          <p className="mt-1 text-sm text-yellow-800 dark:text-yellow-200">
                            Credentials will appear here as soon as payment is confirmed.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}

        {pendingCount > 0 ? (
          <p className="mt-6 text-sm text-muted-foreground">
            {pendingCount} order{pendingCount === 1 ? " is" : "s are"} still awaiting payment confirmation.
          </p>
        ) : null}
      </div>
    </div>
  )
}
