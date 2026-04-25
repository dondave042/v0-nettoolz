"use client"

import { useState, useMemo } from "react"
import { ProductCard } from "@/components/product-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Loader2,
    Search,
    Grid,
    List as ListIcon,
    ChevronDown,
    Filter,
} from "lucide-react"
import { useProducts } from "@/hooks/use-products"

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

interface ProductListViewProps {
  showHeader?: boolean
  title?: string
  description?: string
}

export function ProductListView({
  showHeader = true,
  title = "Product Catalog",
  description = "Browse and purchase from our complete catalog",
}: ProductListViewProps) {
  const { products, loading } = useProducts(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<"newest" | "price-low" | "price-high" | "featured">("newest")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

const [sortMenuOpen, setSortMenuOpen] = useState(false)
    const [categoriesOpen, setCategoriesOpen] = useState(false)

    // Derive categories
  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category_name).filter(Boolean))],
    [products]
  )

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category_name === selectedCategory)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.category_name.toLowerCase().includes(query)
      )
    }

    // Sort
    const sorted = [...filtered]
    switch (sortBy) {
      case "price-low":
        sorted.sort((a, b) => parseFloat(a.price) - parseFloat(b.price))
        break
      case "price-high":
        sorted.sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
        break
      case "featured":
        sorted.sort((a, b) => {
          if (a.is_featured === b.is_featured) return 0
          return a.is_featured ? -1 : 1
        })
        break
      case "newest":
      default:
        // Assuming created_at DESC is the default from API
        break
    }

    return sorted
  }, [products, selectedCategory, searchQuery, sortBy])

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
      {showHeader && (
        <header className="border-b border-border bg-card">
          <div className="mx-auto max-w-7xl px-4 py-8">
            <div>
              <h1 className="text-4xl font-bold text-foreground">{title}</h1>
              <p className="mt-2 text-muted-foreground">{description}</p>
            </div>
          </div>
        </header>
      )}

      {/* Search and Filters */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter and Controls */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    selectedCategory === null
                      ? "bg-[#38bdf8] text-white"
                      : "bg-muted text-foreground hover:bg-muted/80"
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
                        : "bg-muted text-foreground hover:bg-muted/80"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>

              {/* Sort and View Controls */}
              <div className="flex items-center gap-3">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                >
                  <option value="newest">Newest</option>
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>

                <div className="flex items-center gap-1 border-l border-border pl-3">
                  <Button
                    variant={viewMode === "grid" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                    className="h-8 w-8 p-0"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                    className="h-8 w-8 p-0"
                  >
                    <ListIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid/List */}
      <div className="mx-auto max-w-7xl px-4 py-12">
        {filteredAndSortedProducts.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">
              {searchQuery || selectedCategory
                ? "No products match your search criteria"
                : "No products available"}
            </p>
          </div>
        ) : (
          <>
            <p className="mb-6 text-sm text-muted-foreground">
              Showing {filteredAndSortedProducts.length} of {products.length} products
            </p>
            <div
              className={
                viewMode === "grid"
                  ? "grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "space-y-4"
              }
            >
              {filteredAndSortedProducts.map((product) => (
                <div key={product.id}>
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
