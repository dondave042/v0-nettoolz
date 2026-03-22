"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, LogOut, Copy, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
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
    <div className="min-h-screen bg-background py-8">
      <div className="mx-auto max-w-4xl px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Purchases</h1>
            <p className="mt-1 text-muted-foreground">View your orders and credentials</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">You haven't made any purchases yet</p>
            <Link
              href="/products"
              className="mt-4 inline-block rounded-lg bg-[#38bdf8] px-6 py-2 text-white hover:bg-[#0ea5e9]"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="rounded-xl border border-border bg-card overflow-hidden">
                {/* Order Header */}
                <div className="border-b border-border bg-muted/50 p-4">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Order ID</p>
                      <p className="mt-1 text-sm font-mono text-foreground">#{order.id}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Product</p>
                      <p className="mt-1 text-sm font-medium text-foreground">{order.product_name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Amount</p>
                      <p className="mt-1 text-sm font-medium text-[#38bdf8]">
                        ${parseFloat(order.total_price).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Payment Status</p>
                      <div className="mt-1">
                        <span
                          className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                            order.payment_status === "completed"
                              ? "bg-green-100 text-green-700"
                              : order.payment_status === "failed"
                              ? "bg-red-100 text-red-700"
                              : order.payment_status === "cancelled"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {order.payment_status === "completed"
                            ? "Paid"
                            : order.payment_status === "failed"
                            ? "Failed"
                            : order.payment_status === "cancelled"
                            ? "Cancelled"
                            : "Pending"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Details */}
                <div className="p-4">
                  <div className="grid gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Quantity</span>
                      <span className="font-medium text-foreground">{order.quantity} unit(s)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment Method</span>
                      <span className="font-medium text-foreground">{order.payment_method_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Purchased On</span>
                      <span className="font-medium text-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Error Message */}
                {order.payment_status === "failed" && order.payment_error_message && (
                  <div className="border-t border-border bg-red-50 dark:bg-red-950 p-4">
                    <p className="text-sm font-medium text-red-900 dark:text-red-100">
                      Payment Failed: {order.payment_error_message}
                    </p>
                    <p className="text-xs text-red-800 dark:text-red-200 mt-1">
                      Please try placing a new order to complete your purchase.
                    </p>
                  </div>
                )}

                {/* Credentials - Only show if payment is completed */}
                {order.payment_status === "completed" ? (
                  credentials[order.id] ? (
                    <div className="border-t border-border bg-muted/30 p-4">
                      <h4 className="font-semibold text-foreground mb-3">Access Credentials</h4>
                      <div className="space-y-3">
                        {credentials[order.id].map((cred, index) => (
                          <div key={index} className="rounded-lg border border-border bg-background p-3">
                            {cred.username && (
                              <div className="mb-2">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Username</p>
                                <div className="flex items-center justify-between gap-2">
                                  <code className="flex-1 rounded bg-muted/50 px-2 py-1 text-sm font-mono text-foreground">
                                    {cred.username}
                                  </code>
                                  <button
                                    onClick={() => copyToClipboard(cred.username, "Username")}
                                    className="text-muted-foreground hover:text-foreground"
                                    title="Copy"
                                  >
                                    <Copy className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            )}

                            {cred.password && (
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">Password</p>
                                <div className="flex items-center justify-between gap-2">
                                  <code className="flex-1 rounded bg-muted/50 px-2 py-1 text-sm font-mono text-foreground">
                                    {showPasswords[`${order.id}-${index}`]
                                      ? cred.password
                                      : "•".repeat(cred.password.length)}
                                  </code>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() =>
                                        setShowPasswords((prev) => ({
                                          ...prev,
                                          [`${order.id}-${index}`]: !prev[`${order.id}-${index}`],
                                        }))
                                      }
                                      className="text-muted-foreground hover:text-foreground"
                                      title="Show/Hide"
                                    >
                                      {showPasswords[`${order.id}-${index}`] ? (
                                        <EyeOff className="h-4 w-4" />
                                      ) : (
                                        <Eye className="h-4 w-4" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => copyToClipboard(cred.password, "Password")}
                                      className="text-muted-foreground hover:text-foreground"
                                      title="Copy"
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
                    <div className="border-t border-border bg-muted/30 p-4">
                      <p className="text-sm text-muted-foreground">Credentials are being prepared. Please refresh in a moment.</p>
                    </div>
                  )
                ) : order.payment_status === "pending" ? (
                  <div className="border-t border-border bg-blue-50 dark:bg-blue-950 p-4">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Waiting for payment confirmation...
                    </p>
                    <p className="text-xs text-blue-800 dark:text-blue-200 mt-1">
                      Your credentials will be available once the payment is confirmed.
                    </p>
                  </div>
                ) : null}
              </div>
            ))}
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
