'use client'

import { useCart } from '@/lib/cart-context'
import { formatPrice } from '@/lib/currency'
import { X, Minus, Plus, ShoppingBag, Trash2, ArrowRight, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, totalPrice, clearCart, totalItems } = useCart()
  const router = useRouter()

  const handleCheckout = () => {
    onClose()
    router.push('/checkout')
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-[26rem] flex-col bg-background shadow-2xl transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#38bdf8]/10">
              <ShoppingBag className="h-4 w-4 text-[#38bdf8]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground leading-none">Your Cart</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {totalItems === 0
                  ? 'No items'
                  : `${totalItems} item${totalItems !== 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close cart"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-6 py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
                <Package className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <div>
                <p className="font-medium text-foreground">Your cart is empty</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add items from the shop to get started.
                </p>
              </div>
              <Link href="/products" onClick={onClose}>
                <Button variant="outline" size="sm" className="mt-1 gap-2">
                  <ShoppingBag className="h-4 w-4" />
                  Browse Products
                </Button>
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border/50 px-5 py-2">
              {items.map((item) => (
                <li key={item.productId} className="flex gap-4 py-4">
                  {/* Thumbnail or fallback */}
                  <div className="flex-shrink-0">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.productName}
                        className="h-14 w-14 rounded-xl object-cover border border-border/60"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-muted border border-border/60">
                        <Package className="h-5 w-5 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex flex-1 flex-col gap-2 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-medium text-foreground leading-snug truncate">
                        {item.productName}
                      </h3>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Remove ${item.productName}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      {/* Quantity stepper */}
                      <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-muted/40 p-0.5">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-semibold tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          disabled={item.quantity >= 100}
                          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground disabled:opacity-40"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Line total */}
                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-xs text-muted-foreground">
                            {formatPrice(item.price)} each
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border/60 bg-background px-5 py-4 space-y-4">
            {/* Order summary */}
            <div className="rounded-xl bg-muted/50 px-4 py-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Subtotal ({totalItems} item{totalItems !== 1 ? 's' : ''})
                </span>
                <span className="font-medium text-foreground">{formatPrice(totalPrice)}</span>
              </div>
              <div className="border-t border-border/60 pt-2 flex items-center justify-between">
                <span className="font-semibold text-foreground">Total</span>
                <span className="text-lg font-bold text-[#38bdf8]">{formatPrice(totalPrice)}</span>
              </div>
            </div>

            {/* Actions */}
            <Button
              className="w-full gap-2 bg-[#38bdf8] text-white hover:bg-[#0ea5e9] h-11 text-sm font-semibold shadow-sm"
              onClick={handleCheckout}
            >
              Proceed to Checkout
              <ArrowRight className="h-4 w-4" />
            </Button>

            <div className="flex items-center justify-between">
              <Link
                href="/products"
                onClick={onClose}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Continue shopping
              </Link>
              <button
                onClick={() => { clearCart(); onClose() }}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Clear cart
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
