"use client"

import { useRouter } from "next/navigation"
import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart-context"
import { toast } from "sonner"
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Tag,
} from "lucide-react"
import { useState } from "react"

export default function CartPage() {
  const router = useRouter()
  const { items, removeItem, updateQuantity, totalItems, totalPrice, clearCart } = useCart()
  const [checkingOut, setCheckingOut] = useState(false)

  const formatPrice = (price: number) =>
    `₦${price.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`

  const handleCheckout = async () => {
    if (items.length === 0) return
    setCheckingOut(true)
    try {
      router.push("/checkout")
    } catch {
      toast.error("Failed to proceed to checkout")
      setCheckingOut(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <main className="flex flex-1 items-center justify-center px-4 py-20">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-card border border-border">
              <ShoppingBag className="h-12 w-12 text-muted-foreground/40" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Your cart is empty</h1>
              <p className="mt-2 text-muted-foreground">
                Looks like you haven&apos;t added anything yet. Start exploring our catalog!
              </p>
            </div>
            <Button
              asChild
              className="gap-2 bg-[#38bdf8] text-white hover:bg-[#0ea5e9]"
            >
              <Link href="/shop">
                Continue Shopping
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      <main className="flex-1 px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">
              Your Cart{" "}
              <span className="text-base font-normal text-muted-foreground">
                ({totalItems} item{totalItems !== 1 ? "s" : ""})
              </span>
            </h1>
            <button
              onClick={() => {
                clearCart()
                toast.success("Cart cleared")
              }}
              className="text-sm text-muted-foreground hover:text-destructive transition-colors"
            >
              Clear cart
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Cart Items */}
            <div className="flex flex-col gap-3 lg:col-span-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm"
                >
                  {/* Icon placeholder */}
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0c4a6e]/30 to-[#075985]/30">
                    <Tag className="h-6 w-6 text-[#38bdf8]" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatPrice(item.price)} each
                    </p>
                  </div>

                  {/* Qty controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-border hover:bg-secondary transition-colors"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-border hover:bg-secondary transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Line total */}
                  <div className="text-right min-w-[80px]">
                    <p className="font-semibold text-foreground">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => {
                      removeItem(item.id)
                      toast.success(`${item.name} removed`)
                    }}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="h-fit rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 font-semibold text-foreground">Order Summary</h2>

              <div className="flex flex-col gap-3 text-sm">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-muted-foreground">
                    <span className="truncate pr-2">{item.name} × {item.quantity}</span>
                    <span className="flex-shrink-0">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="my-4 border-t border-border" />

              <div className="flex justify-between font-bold text-foreground">
                <span>Total</span>
                <span className="text-[#38bdf8]">{formatPrice(totalPrice)}</span>
              </div>

              <Button
                onClick={handleCheckout}
                disabled={checkingOut}
                className="mt-5 w-full gap-2 bg-[#38bdf8] text-white hover:bg-[#0ea5e9]"
              >
                Proceed to Checkout
                <ArrowRight className="h-4 w-4" />
              </Button>

              <Button asChild variant="outline" className="mt-2 w-full">
                <Link href="/shop">Continue Shopping</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
