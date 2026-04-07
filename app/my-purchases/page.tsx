"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, LogOut, Copy, Eye, EyeOff, Package, CheckCircle2, AlertCircle, Clock, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/dashboard/header"
import { toast } from "sonner"

interface Order {
  id: number
  product_id: number
  product_name: string
  quantity: number
  total_price: string
  status: string
  payment_method_name: string
  created_at: string
  payment_status: string
  payment_reference_id?: string
  payment_error_message?: string
}

interface Credential {
  id: number
  username: string
  password: string
}

export default function MyPurchasesPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [credentials, setCredentials] = useState<{ [key: number]: Credential[] }>({})
  const [loading, setLoading] = useState(true)
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({})

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const res = await fetch("/api/buyers/me")
      if (res.status === 401) {
        router.push("/login")
        return
      }

      if (res.ok) {
        fetchOrders()
      }
    } catch (error) {
      console.error("Auth check error:", error)
      router.push("/login")
    }
  }

  async function fetchOrders() {
    setLoading(true)
    try {
      const res = await fetch("/api/checkout")
      if (res.ok) {
        const data = await res.json()
        setOrders(data.orders || [])

        // Fetch credentials for each order that has completed payment
        for (const order of data.orders || []) {
          if (order.payment_status === "completed") {
            fetchOrderCredentials(order.id, order.product_id)
          }
        }
      } else if (res.status === 401) {
        router.push("/login")
      }
    } catch (error) {
      console.error("Fetch orders error:", error)
      toast.error("Failed to load orders")
    } finally {
      setLoading(false)
    }
  }

  async function fetchOrderCredentials(orderId: number, productId: number) {
    try {
      const res = await fetch(`/api/products/${productId}/credentials`)
      if (res.ok) {
        const data = await res.json()
        setCredentials((prev) => ({
          ...prev,
          [orderId]: [data],
        }))
      }
    } catch (error) {
      console.error("Fetch credentials error:", error)
    }
  }

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
    toast.success(`${label} copied!`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
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
            description="View and manage your purchased accounts and credentials"
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <a href="https://checkout.korapay.com/pay/nettoolz" target="_blank" rel="noopener noreferrer">
              <Button className="gap-2 w-full bg-green-600 hover:bg-green-700">
                <CreditCard className="h-4 w-4" />
                One-Time Payment
              </Button>
            </a>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="gap-2 w-full sm:w-auto"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-border bg-secondary/30 p-12 text-center">
            <Package className="mx-auto mb-4 h-12 w-12 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium text-muted-foreground">You haven't made any purchases yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Get started by browsing our premium accounts collection</p>
            <Link href="/products">
              <Button className="mt-6 bg-[#38bdf8] text-white hover:bg-[#0ea5e9]">
                Browse Products
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const statusConfig = {
                completed: { icon: CheckCircle2, color: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400", label: "Paid" },
                failed: { icon: AlertCircle, color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400", label: "Failed" },
                cancelled: { icon: AlertCircle, color: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400", label: "Cancelled" },
                pending: { icon: Clock, color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400", label: "Pending" },
              }
              const status = statusConfig[order.payment_status as keyof typeof statusConfig] || statusConfig.pending
              const StatusIcon = status.icon
              
              return (
              <div key={order.id} className="group rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-all overflow-hidden">
                {/* Order Header */}
                <div className="border-b border-border bg-gradient-to-r from-secondary/30 to-transparent p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`rounded-lg p-2.5 ${status.color}`}>
                        <StatusIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Order #{order.id}</p>
                        <p className="text-sm font-semibold text-foreground">{order.product_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#38bdf8]">
                        ₦{parseFloat(order.total_price).toLocaleString()}
                      </p>
                      <p className={`inline-block mt-1 rounded-full px-3 py-1 text-xs font-medium ${status.color}`}>
                        {status.label}
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-3 text-sm">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Payment Method</p>
                      <p className="mt-0.5 font-medium text-foreground">{order.payment_method_name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Quantity</p>
                      <p className="mt-0.5 font-medium text-foreground">{order.quantity} unit(s)</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Purchased</p>
                      <p className="mt-0.5 font-medium text-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>


                {/* Payment Error Message */}
                {order.payment_status === "failed" && order.payment_error_message && (
                  <div className="border-t border-border bg-red-50 dark:bg-red-900/20 p-5">
                    <div className="flex gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-red-900 dark:text-red-100">Payment Failed</p>
                        <p className="text-sm text-red-800 dark:text-red-200 mt-1">{order.payment_error_message}</p>
                        <p className="text-xs text-red-700 dark:text-red-300 mt-2">Please try placing a new order to complete your purchase.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Credentials - Only show if payment is completed */}
                {order.payment_status === "completed" ? (
                  credentials[order.id] ? (
                    <div className="border-t border-border bg-gradient-to-r from-green-50/30 to-transparent dark:from-green-900/10 p-5">
                      <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        Access Credentials
                      </h4>
                      <div className="space-y-3">
                        {credentials[order.id].map((cred, index) => (
                          <div key={index} className="rounded-lg border border-green-200 dark:border-green-800 bg-white dark:bg-green-950/20 p-4 space-y-3">
                            {cred.username && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Username</p>
                                <div className="flex items-center justify-between gap-2 bg-secondary/50 rounded-lg p-3">
                                  <code className="flex-1 text-sm font-mono text-foreground select-all">
                                    {cred.username}
                                  </code>
                                  <button
                                    onClick={() => copyToClipboard(cred.username, "Username")}
                                    className="text-muted-foreground hover:text-foreground transition-colors"
                                    title="Copy to clipboard"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            )}

                            {cred.password && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Password</p>
                                <div className="flex items-center justify-between gap-2 bg-secondary/50 rounded-lg p-3">
                                  <code className="flex-1 text-sm font-mono text-foreground select-all">
                                    {showPasswords[`${order.id}-${index}`]
                                      ? cred.password
                                      : "•".repeat(cred.password.length)}
                                  </code>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() =>
                                        setShowPasswords((prev) => ({
                                          ...prev,
                                          [`${order.id}-${index}`]: !prev[`${order.id}-${index}`],
                                        }))
                                      }
                                      className="text-muted-foreground hover:text-foreground transition-colors"
                                      title="Show/Hide password"
                                    >
                                      {showPasswords[`${order.id}-${index}`] ? (
                                        <EyeOff className="h-4 w-4" />
                                      ) : (
                                        <Eye className="h-4 w-4" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => copyToClipboard(cred.password, "Password")}
                                      className="text-muted-foreground hover:text-foreground transition-colors"
                                      title="Copy to clipboard"
                                    >
                                      <Copy className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="border-t border-border bg-blue-50 dark:bg-blue-900/20 p-5">
                      <div className="flex gap-3">
                        <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-blue-900 dark:text-blue-100">Credentials are being prepared. Please refresh in a moment.</p>
                      </div>
                    </div>
                  )
                ) : order.payment_status === "pending" ? (
                  <div className="border-t border-border bg-yellow-50 dark:bg-yellow-900/20 p-5">
                    <div className="flex gap-3">
                      <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">Waiting for Payment</p>
                        <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">Your credentials will be available once payment is confirmed.</p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
              )
            })}
          </div>
        )}

        <div className="mt-8">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-[#38bdf8] hover:text-[#0ea5e9]"
          >
            ← Back to products
          </Link>
        </div>
      </div>
    </div>
  )
}
