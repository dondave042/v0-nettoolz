"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, ArrowLeft, Check, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useCart } from "@/lib/cart-context"
import { formatPrice } from "@/lib/currency"

interface CheckoutOrder {
  id: number
}

interface BuyerSession {
  id: number
  email: string
  name: string
  balance?: number
}

function CheckoutContent() {
  const router = useRouter()
  const { items, clearCart } = useCart()
  const [buyer, setBuyer] = useState<BuyerSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/buyers/me')
        if (!res.ok) {
          router.push('/login?returnUrl=/checkout')
          return
        }
        const data = await res.json()
        setBuyer(data.buyer)
      } catch (error) {
        console.error('[v0] Auth check error:', error)
        router.push('/login?returnUrl=/checkout')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  // Check if cart is empty
  if (!loading && items.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-secondary px-4">
        <div className="w-full max-w-md space-y-4 text-center">
          <h1 className="text-2xl font-bold text-foreground">Your cart is empty</h1>
          <p className="text-muted-foreground">Add items to your cart before checking out</p>
          <Button
            onClick={() => router.push('/products')}
            className="bg-[#38bdf8] text-white hover:bg-[#0ea5e9]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Products
          </Button>
        </div>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!buyer) {
      toast.error('User information not available')
      return
    }

    setSubmitting(true)
    try {
      const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

      if (Number(buyer.balance ?? 0) < totalPrice) {
        toast.error('Insufficient wallet balance for this purchase')
        return
      }

      const checkoutRes = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            product_id: item.productId,
            quantity: item.quantity,
          })),
        }),
      })

      if (!checkoutRes.ok) {
        const error = await checkoutRes.json()
        toast.error(error.error || 'Failed to create order')
        return
      }

      const orderData = await checkoutRes.json()

      if (orderData.completed) {
        clearCart()
        setCompleted(true)
        setBuyer((previous) => previous ? { ...previous, balance: Number(previous.balance ?? 0) - totalPrice } : previous)
        toast.success('Order completed successfully')
        setTimeout(() => router.push('/my-purchases'), 1200)
        return
      }
    } catch (error) {
      console.error('[v0] Checkout error:', error)
      toast.error('An error occurred during checkout')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#38bdf8]" />
      </div>
    )
  }

  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const buyerBalance = Number(buyer?.balance ?? 0)
  const hasEnoughBalance = buyerBalance >= totalPrice

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Checkout</h1>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Success State */}
        {completed && (
          <div className="space-y-4 rounded-xl border border-green-200 bg-green-50 p-8 text-center dark:border-green-900 dark:bg-green-950">
            <Check className="mx-auto h-12 w-12 text-green-600" />
            <h2 className="text-xl font-bold text-foreground">Order Completed!</h2>
            <p className="text-muted-foreground">
              Your order has been placed successfully. Redirecting to your purchases...
            </p>
          </div>
        )}

        {!completed && (
          <div className="grid gap-8 md:grid-cols-3">
            {/* Cart Summary */}
            <div className="md:col-span-2 space-y-6">
              {/* Order Items */}
              <div className="space-y-4 rounded-xl border border-border bg-card p-6">
                <h2 className="text-lg font-semibold text-foreground">Order Summary</h2>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between border-b border-border pb-3 last:border-0"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{item.productName}</p>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold text-foreground">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-4 rounded-xl border border-border bg-card p-6">
                <h2 className="text-lg font-semibold text-foreground">Payment Method</h2>
                <div className="rounded-xl border border-[#38bdf8]/30 bg-[#38bdf8]/5 p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-[#38bdf8]/15 p-2 text-[#0284c7]">
                      <Wallet className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">Wallet Balance</p>
                      <p className="text-sm text-muted-foreground">All purchases are deducted instantly from the buyer balance.</p>
                      <p className="text-sm text-foreground">Available balance: <span className="font-semibold text-[#0284c7]">{formatPrice(buyerBalance)}</span></p>
                      {!hasEnoughBalance && (
                        <p className="text-sm text-red-500">Insufficient balance. Top up your wallet with Korapay before completing this purchase.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Total */}
            <div className="h-fit space-y-4 rounded-xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground">Total</h3>
              <div className="space-y-2 border-t border-border pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 font-bold text-lg">
                  <span className="text-foreground">Total</span>
                  <span className="text-[#38bdf8]">{formatPrice(totalPrice)}</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Button
                  type="submit"
                  disabled={submitting || !hasEnoughBalance}
                  className="w-full bg-[#38bdf8] text-white hover:bg-[#0ea5e9]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Pay With Balance'
                  )}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  This order will complete instantly using your account balance.
                </p>
                {!hasEnoughBalance && (
                  <Link href="/quick-pay" className="block">
                    <Button variant="outline" className="w-full">
                      Top Up With Korapay
                    </Button>
                  </Link>
                )}
                <Link href="/products" className="block">
                  <Button variant="outline" className="w-full">
                    Continue Shopping
                  </Button>
                </Link>
              </form>

              <p className="text-xs text-muted-foreground text-center">
                By placing an order, you agree to our terms and conditions
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-[#38bdf8]" /></div>}>
      <CheckoutContent />
    </Suspense>
  )
}
