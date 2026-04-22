"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { ProductCard } from "@/components/product-card"
import { toast } from "sonner"

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

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  // Derive categories from loaded products
  const categories = [...new Set(products.map((p) => p.category_name).filter(Boolean))]

  async function fetchProducts() {
    try {
      const res = await fetch("/api/products")
      if (res.ok) {
        const data = await res.json()
        const list = Array.isArray(data) ? data : (data.products || [])
        const available = list.filter((p: Product) => p.available_qty > 0)
        setProducts(available)
      }
    } catch (error) {
      console.error("Fetch error:", error)
      toast.error("Failed to load products")
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = selectedCategory
    ? products.filter((p) => p.category_name === selectedCategory)
    : products

  const featuredProducts = filteredProducts.filter((p) => p.is_featured)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-[#38bdf8]" />
      </div>
    )
  }

  return (
    <div className="bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div>
              <h1 className="text-4xl font-bold text-foreground">Products</h1>
              <p className="mt-2 text-muted-foreground">Browse and purchase from our catalog</p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/my-purchases"
                className="rounded-lg bg-[#38bdf8] px-6 py-2 text-white hover:bg-[#0ea5e9]"
              >
                My Purchases
              </Link>
              <Link
                href="/login"
                className="rounded-lg border border-[#38bdf8] px-6 py-2 text-[#38bdf8] hover:bg-[#e0f2fe]"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      {categories.length > 0 && (
        <div className="border-b border-border bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  selectedCategory === null
                    ? "bg-[#38bdf8] text-white"
                    : "bg-background text-foreground hover:bg-muted"
                }`}
              >
                All
              </button>
              {categories.map((name) => (
                <button
                  key={name}
                  onClick={() => setSelectedCategory(name)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    selectedCategory === name
                      ? "bg-[#38bdf8] text-white"
                      : "bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Featured Section */}
      {featuredProducts.length > 0 && !selectedCategory && (
        <div className="border-b border-border bg-muted/50">
          <div className="mx-auto max-w-7xl px-4 py-12">
            <h2 className="mb-8 text-2xl font-bold text-foreground">Featured Products</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Products */}
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="mb-8 text-2xl font-bold text-foreground">
          {selectedCategory || "All"} Products
        </h2>
        {filteredProducts.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">No products available in this category</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
