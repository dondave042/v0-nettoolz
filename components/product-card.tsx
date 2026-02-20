"use client"

import { ShoppingCart, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface Product {
  id: number
  sku: string
  name: string
  description: string
  price: string
  available_qty: number
  badge: string | null
  is_featured: boolean
  category_name: string
}

export function ProductCard({ product }: { product: Product }) {
  const inStock = product.available_qty > 0

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-[#38bdf8] hover:shadow-lg hover:shadow-[#38bdf8]/10">
      {/* Badge */}
      {product.badge && (
        <div className="absolute right-3 top-3 z-10 rounded-full bg-[#38bdf8] px-3 py-1 text-xs font-bold text-white">
          {product.badge}
        </div>
      )}

      {/* Card header */}
      <div className="flex h-32 items-center justify-center bg-gradient-to-br from-[#e0f2fe] to-[#bae6fd]">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/80 text-[#0284c7]">
          <Tag className="h-8 w-8" />
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[#0284c7]">
          {product.category_name}
        </p>
        <h3 className="mb-2 font-semibold text-foreground">{product.name}</h3>
        <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground">
          {product.description}
        </p>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-2xl font-bold text-[#0284c7]">
              ${parseFloat(product.price).toFixed(2)}
            </span>
            <span className="ml-2 text-xs text-muted-foreground">
              {inStock ? `${product.available_qty} in stock` : "Out of stock"}
            </span>
          </div>
        </div>

        <Button
          className="mt-4 gap-2 bg-[#38bdf8] text-white hover:bg-[#0ea5e9]"
          disabled={!inStock}
          onClick={() => {
            toast.success(`${product.name} added to cart!`)
          }}
        >
          <ShoppingCart className="h-4 w-4" />
          {inStock ? "Add to Cart" : "Sold Out"}
        </Button>
      </div>
    </div>
  )
}
