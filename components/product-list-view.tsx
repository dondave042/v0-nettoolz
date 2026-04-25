"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ProductCard } from "@/components/product-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart-context"
import { formatPrice } from "@/lib/currency"
import { toast } from "sonner"
import {
  Loader2,
  Search,
  Grid,
  List as ListIcon,
  ChevronDown,
  Filter,
  ShoppingCart,
  Tag,
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

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "featured", label: "Featured" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
] as const

function ProductListRow({ product }: { product: Product }) {
  const router = useRouter()
  const { addItem } = useCart()
  const inStock = product.available_qty > 0

  async function handleAddToCart() {
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
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:border-[#38bdf8]/50 hover:shadow-md">
      <div className="flex items-start gap-3 p-4">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-[#e0f2fe] to-[#bae6fd]">
          {product.images && product.images.length > 0 ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-[#0284c7]">
              <Tag className="h-4 w-4" />
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-[#0284c7]">
                {product.category_name}
              </span>
              {product.badge ? (
                <span className="rounded-full bg-[#38bdf8] px-2.5 py-1 text-[11px] font-semibold text-white">
                  {product.badge}
                </span>
              ) : null}
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-semibold text-foreground">{product.name}</h3>
              <p className="max-w-2xl overflow-hidden text-[7px] leading-3 text-muted-foreground [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                {product.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-lg font-bold text-[#0284c7]">
                {formatPrice(parseFloat(product.price))}
              </span>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
                {inStock ? `${product.available_qty} in stock` : "Out of stock"}
              </span>
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 md:w-40 md:flex-shrink-0">
            <Button
              className="gap-2 bg-[#38bdf8] text-white hover:bg-[#0ea5e9]"
              disabled={!inStock}
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-4 w-4" />
              {inStock ? "Add to Cart" : "Sold Out"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
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
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setCategoriesOpen((open) => !open)}
                    className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                  >
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedCategory ?? "All Categories"}</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${categoriesOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {categoriesOpen ? (
                    <div className="absolute left-0 top-full z-20 mt-2 min-w-60 overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCategory(null)
                          setCategoriesOpen(false)
                        }}
                        className={`block w-full px-4 py-3 text-left text-sm transition-colors ${selectedCategory === null
                          ? "bg-[#38bdf8]/10 text-[#0284c7]"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                          }`}
                      >
                        All Categories
                      </button>
                      {categories.map((name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => {
                            setSelectedCategory(name)
                            setCategoriesOpen(false)
                          }}
                          className={`block w-full px-4 py-3 text-left text-sm transition-colors ${selectedCategory === name
                            ? "bg-[#38bdf8]/10 text-[#0284c7]"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                            }`}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setSortMenuOpen((open) => !open)}
                    className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                  >
                    <span>
                      Sort by{" "}
                      <span className="font-semibold">
                        {sortOptions.find((option) => option.value === sortBy)?.label}
                      </span>
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${sortMenuOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {sortMenuOpen ? (
                    <div className="absolute right-0 top-full z-20 mt-2 min-w-60 overflow-hidden rounded-2xl border border-border bg-card py-2 shadow-lg">
                      {sortOptions.map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => {
                            setSortBy(value)
                            setSortMenuOpen(false)
                          }}
                          className={`block w-full px-4 py-2.5 text-left text-sm transition-colors ${sortBy === value
                            ? "bg-[#38bdf8]/10 text-[#0284c7]"
                            : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                            }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center gap-1 border-l border-border pl-3">
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("grid")}
                    className="h-9 w-9 rounded-full"
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="icon"
                    onClick={() => setViewMode("list")}
                    className="h-9 w-9 rounded-full"
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
              {filteredAndSortedProducts.map((product) =>
                viewMode === "grid" ? (
                  <div key={product.id}>
                    <ProductCard product={product} />
                  </div>
                ) : (
                  <ProductListRow key={product.id} product={product} />
                )
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
