"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Loader2, ArrowLeft, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface Product {
  id: number
  name: string
  price: string
  description: string
  images: string[] | null
}

interface PaymentMethod {
  id: number
  name: string
  description: string | null
}

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const productId = searchParams.get("product_id")
  const [product, setProduct] = useState<Product | null>(null)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)

  const [form, setForm] = useState({
    quantity: 1,
    payment_method_id: "",
  })

  useEffect(() => {
    if (!productId) {
      router.push("/products")
      return
    }

    fetchData()
  }, [productId])

  async function fetchData() {
    setLoading(true)
    try {
      const [productRes, methodsRes] = await Promise.all([
        fetch(`/api/admin/products/${productId}`),
        fetch("/api/admin/payment-methods"),
      ])

      if (productRes.ok) {
        const data = await productRes.json()
        setProduct(data)
      } else {
        toast.error("Product not found")
        router.push("/products")
        return
      }

      if (methodsRes.ok) {
        const data = await methodsRes.json()
        const activeMethods = (data.methods || []).filter((m: PaymentMethod) => m.id)
        setPaymentMethods(activeMethods)
        if (activeMethods.length > 0) {
          setForm((f) => ({ ...f, payment_method_id: activeMethods[0].id.toString() }))
        }
      }
    } catch (error) {
      console.error("Fetch error:", error)
      toast.error("Failed to load checkout data")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: parseInt(productId!),
          quantity: form.quantity,
          payment_method_id: parseInt(form.payment_method_id),
        }),
      })

      const data = await res.json()

      if (res.ok) {
        // Simulate payment completion
        await new Promise((resolve) => setTimeout(resolve, 1500))

        const confirmRes = await fetch(`/api/orders/${data.order.id}/confirm-payment`, {
          method: "POST",
        })

        if (confirmRes.ok) {
          setCompleted(true)
          toast.success("Purchase completed successfully!")
          setTimeout(() => {
            router.push("/my-purchases")
          }, 2000)
        } else {
          toast.error("Failed to confirm payment")
        }
      } else {
        toast.error(data.error || "Failed to create order")
      }
    } catch (error) {
      console.error("Checkout error:", error)
      toast.error("An error occurred")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-[#38bdf8]" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Product not found</p>
          <Link href="/products" className="mt-4 inline-block text-[#38bdf8] hover:text-[#0ea5e9]">
            Back to products
          </Link>
        </div>
      </div>
    )
  }

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-green-100 p-3">
              <Check className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Purchase Complete!</h1>
          <p className="mt-2 text-muted-foreground">
            Your credentials have been assigned. Redirecting to your purchases...
          </p>
        </div>
      </div>
    )
  }

  const total = parseFloat(product.price) * form.quantity

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="mx-auto max-w-2xl px-4">
        <Link href="/products" className="mb-6 inline-flex items-center gap-2 text-[#38bdf8] hover:text-[#0ea5e9]">
          <ArrowLeft className="h-4 w-4" />
          Back to products
        </Link>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Order Summary */}
          <div className="md:col-span-2">
            <div className="rounded-xl border border-border bg-card p-6">
              <h1 className="text-2xl font-bold text-foreground">Checkout</h1>

              {/* Product Info */}
              <div className="mt-6 rounded-lg border border-border p-4">
                <div className="flex gap-4">
                  {product.images && product.images.length > 0 && (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="h-24 w-24 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{product.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{product.description}</p>
                    <p className="mt-2 text-lg font-bold text-[#38bdf8]">
                      ${parseFloat(product.price).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quantity */}
              <div className="mt-6 rounded-lg border border-border p-4">
                <label className="block text-sm font-medium text-foreground">Quantity</label>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        quantity: Math.max(1, f.quantity - 1),
                      }))
                    }
                    className="rounded-lg border border-border bg-background px-3 py-2 text-foreground hover:bg-muted"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        quantity: Math.max(1, parseInt(e.target.value) || 1),
                      }))
                    }
                    min="1"
                    className="w-16 rounded-lg border border-border bg-background px-3 py-2 text-center text-foreground"
                  />
                  <button
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        quantity: f.quantity + 1,
                      }))
                    }
                    className="rounded-lg border border-border bg-background px-3 py-2 text-foreground hover:bg-muted"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mt-6 rounded-lg border border-border p-4">
                <label className="block text-sm font-medium text-foreground">Payment Method</label>
                <select
                  value={form.payment_method_id}
                  onChange={(e) => setForm({ ...form, payment_method_id: e.target.value })}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:border-[#38bdf8] focus:outline-none"
                >
                  {paymentMethods.length === 0 ? (
                    <option disabled>No payment methods available</option>
                  ) : (
                    paymentMethods.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                        {m.description ? ` - ${m.description}` : ""}
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* Order Total */}
          <div>
            <div className="sticky top-8 rounded-xl border border-border bg-card p-6">
              <h2 className="font-semibold text-foreground">Order Summary</h2>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">
                    ${parseFloat(product.price).toFixed(2)} × {form.quantity}
                  </span>
                </div>
                <div className="border-t border-border pt-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-foreground">Total</span>
                    <span className="text-lg text-[#38bdf8]">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={submitting || paymentMethods.length === 0}
                className="mt-6 w-full bg-[#38bdf8] text-white hover:bg-[#0ea5e9]"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Complete Purchase"
                )}
              </Button>

              <p className="mt-3 text-xs text-muted-foreground text-center">
                Credentials will be assigned immediately after payment confirmation
              </p>
            </div>
          </div>
        </div>
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
