"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Package, ShoppingCart, Star } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart-context"
import { formatPrice } from "@/lib/currency"
import { useProducts } from "@/hooks/use-products"

export function HomepageProductsGrid() {
  const router = useRouter()
  const { addItem } = useCart()
  const { products, loading } = useProducts(false)
  const [addingId, setAddingId] = useState<number | null>(null)

  async function handleAddToCart(product: (typeof products)[number]) {
    setAddingId(product.id)

    try {
      const res = await fetch("/api/buyers/me")
      if (!res.ok) {
        toast.error("Please sign in to add items to cart")
        router.push("/login")
        return
      }

      addItem({
        productId: product.id,
        productName: product.name,
        price: parseFloat(product.price),
        quantity: 1,
        image: product.images?.[0] || null,
      })

      toast.success(`${product.name} added to cart!`)
    } catch (error) {
      console.error("[HomepageProductsGrid] Failed to add item to cart:", error)
      toast.error("Failed to add to cart")
    } finally {
      setAddingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-32 items-center justify-center py-8 lg:min-h-40">
        <Loader2 className="h-6 w-6 animate-spin text-[#38bdf8] lg:h-8 lg:w-8" />
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="mt-10 flex min-h-32 items-center justify-center rounded-xl border-2 border-dashed border-border bg-secondary/20 px-4 py-8 lg:min-h-40">
        <p className="text-sm text-muted-foreground lg:text-base">No products available at the moment</p>
      </div>
    )
  }

  return (
    <div className="mt-10 space-y-5 lg:mt-12">
      {products.map((product) => (
        <div
          key={product.id}
          className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:border-[#38bdf8]/50 hover:shadow-md"
        >
          <div className="flex flex-col md:flex-row">
            <div className="relative md:w-72 md:flex-shrink-0">
              <div className="flex h-56 items-center justify-center bg-gradient-to-br from-[#0c4a6e]/30 to-[#075985]/30 md:h-full">
                {product.images?.[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Package className="h-16 w-16 text-[#38bdf8]/40" />
                )}
              </div>

              <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                {product.is_featured && (
                  <div className="inline-flex items-center rounded-full bg-amber-500/90 px-2.5 py-1 text-[10px] font-medium text-white">
                    <Star className="mr-1 h-2.5 w-2.5" />
                    Featured
                  </div>
                )}
                {product.badge && (
                  <div className="rounded-full bg-[#38bdf8] px-2.5 py-1 text-[10px] font-medium text-white">
                    {product.badge}
                  </div>
                )}
                {product.available_qty === 0 && (
                  <div className="rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-medium text-white">
                    Out of stock
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-1 flex-col justify-between gap-5 p-5 md:flex-row md:items-start md:p-6">
              <div className="min-w-0 flex-1 space-y-3">
                <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#38bdf8]">
                  {product.category_name}
                </span>

                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-foreground">
                    {product.name}
                  </h3>
                  <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                    {product.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm">
                  <span className="text-2xl font-bold text-foreground">
                    {formatPrice(parseFloat(product.price))}
                  </span>
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
                    {product.available_qty > 0
                      ? `${product.available_qty} in stock`
                      : "Out of stock"}
                  </span>
                </div>
              </div>

              <div className="flex w-full flex-col gap-3 md:w-44 md:flex-shrink-0">
                <Button
                  size="sm"
                  onClick={() => handleAddToCart(product)}
                  disabled={product.available_qty === 0 || addingId === product.id}
                  className="w-full gap-1.5 bg-[#38bdf8] text-white hover:bg-[#0ea5e9] disabled:opacity-50"
                >
                  {addingId === product.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ShoppingCart className="h-3.5 w-3.5" />
                  )}
                  Add to Cart
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}