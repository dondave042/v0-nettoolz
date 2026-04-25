"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShoppingCart, Tag, Copy, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useCart } from "@/lib/cart-context"
import { formatPrice } from "@/lib/currency"

interface Product {
  id: number
  sku: string
  name: string
  description: string
  price: string
  available_qty: number
  badge?: string
  is_featured: boolean
  category_name: string
  images?: string[]
  product_username?: string
  product_password?: string
}

export function ProductCard({ product }: { product: Product }) {
  const router = useRouter()
  const { addItem } = useCart()
  const inStock = product.available_qty > 0
  const [showCredentials, setShowCredentials] = useState(false)
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null)
  const [loadingCredentials, setLoadingCredentials] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function readJsonSafely(response: Response) {
    const text = await response.text()

    if (!text) {
      return null
    }

    try {
      return JSON.parse(text)
    } catch {
      return null
    }
  }

  async function handleAddToCart() {
    // Check if buyer is logged in
    const res = await fetch('/api/buyers/me')
    if (!res.ok) {
      toast.error('Please sign in to add items to cart')
      router.push('/login')
      return
    }

    const price = parseFloat(product.price)
    addItem({
      productId: product.id,
      productName: product.name,
      price,
      quantity: 1,
      image: product.images?.[0] || null,
    })
    toast.success(`${product.name} added to cart!`)
  }

  async function fetchCredentials() {
    setLoadingCredentials(true)
    try {
      const res = await fetch(`/api/products/${product.id}/credentials`)
      const data = await readJsonSafely(res)

      if (res.ok) {
        if (!data) {
          throw new Error('Credentials response was empty')
        }
        setCredentials(data)
        setShowCredentials(true)
      } else if (res.status === 403) {
        toast.error((data as { error?: string } | null)?.error || "You need to purchase this product first")
      } else {
        toast.error((data as { error?: string } | null)?.error || "Failed to load credentials")
      }
    } catch (error) {
      console.error("Error fetching credentials:", error)
      toast.error("Failed to load credentials")
    } finally {
      setLoadingCredentials(false)
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied!`)
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-[#38bdf8] hover:shadow-lg hover:shadow-[#38bdf8]/10">
      {/* Badges */}
      <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
        {product.badge && (
          <div className="rounded-full bg-[#38bdf8] px-3 py-1 text-xs font-bold text-white">
            {product.badge}
          </div>
        )}
        {(product.product_username || product.product_password) && (
          <div className="rounded-full bg-green-500 px-3 py-1 text-xs font-bold text-white">
            Has Credentials
          </div>
        )}
      </div>

      {/* Card header - Image or Icon */}
      <div className="flex h-32 items-center justify-center overflow-hidden bg-gradient-to-br from-[#e0f2fe] to-[#bae6fd]">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/80 text-[#0284c7]">
            <Tag className="h-8 w-8" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[#0284c7]">
          {product.category_name}
        </p>
        <h3 className="mb-2 font-semibold text-foreground">{product.name}</h3>
        <p className="mb-4 flex-1 text-[7px] leading-3 text-muted-foreground">
          {product.description}
        </p>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-[#0284c7]">
              {formatPrice(parseFloat(product.price))}
            </span>
            <span className="ml-2 text-xs text-muted-foreground">
              {inStock ? `${product.available_qty} in stock` : "Out of stock"}
            </span>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <Button
            className="gap-2 bg-[#38bdf8] text-white hover:bg-[#0ea5e9]"
            disabled={!inStock}
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4" />
            {inStock ? "Add to Cart" : "Sold Out"}
          </Button>

          {/* Credentials Button */}
          {(product.product_username || product.product_password) && (
            <Button
              variant="outline"
              className="gap-2 border-[#38bdf8] text-[#38bdf8] hover:bg-[#e0f2fe]"
              onClick={fetchCredentials}
              disabled={loadingCredentials}
            >
              {loadingCredentials ? "Loading..." : "View Credentials"}
            </Button>
          )}
        </div>

        {/* Credentials Modal */}
        {showCredentials && credentials && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Product Credentials</h3>
                <button
                  onClick={() => setShowCredentials(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Tag className="h-5 w-5" />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {credentials.username && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Username</p>
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-sm font-mono text-foreground">{credentials.username}</code>
                      <button
                        onClick={() => copyToClipboard(credentials.username, "Username")}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {credentials.password && (
                  <div className="rounded-lg bg-muted/50 p-3">
                    <p className="mb-1 text-xs font-medium text-muted-foreground">Password</p>
                    <div className="flex items-center justify-between gap-2">
                      <code className="text-sm font-mono text-foreground">
                        {showPassword ? credentials.password : "•".repeat(credentials.password.length)}
                      </code>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => copyToClipboard(credentials.password, "Password")}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                className="mt-4 w-full"
                onClick={() => setShowCredentials(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
