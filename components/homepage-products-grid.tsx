"use client"

import { ProductCard } from "@/components/product-card"
import { Loader2 } from "lucide-react"
import { useProducts } from "@/hooks/use-products"

export function HomepageProductsGrid() {
  const { products, loading } = useProducts(false)

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
    <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:mt-12 lg:gap-6 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}