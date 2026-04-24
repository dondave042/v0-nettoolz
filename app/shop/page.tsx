"use client"

import { useState, useEffect } from "react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useCart } from "@/lib/cart-context"
import { toast } from "sonner"
import {
    Search,
    ShoppingCart,
    Star,
    Package,
    Filter,
    Loader2,
    Sparkles,
    ChevronDown,
} from "lucide-react"

interface Product {
    id: number
    name: string
    description: string
    price: number
    category?: string
    category_name?: string
    available_qty: number
    image_url?: string
    featured?: boolean
}

export default function ShopPage() {
    const { addItem } = useCart()
    const [products, setProducts] = useState<Product[]>([])
    const [filtered, setFiltered] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [activeCategory, setActiveCategory] = useState("All")
    const [addingId, setAddingId] = useState<number | null>(null)
    const [categoriesOpen, setCategoriesOpen] = useState(false)

    const categories = [
        "All",
        ...Array.from(
            new Set(
                products
                    .map((product) => product.category?.trim())
                    .filter((category): category is string => Boolean(category))
            )
        ),
    ]

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch("/api/products")
                if (!res.ok) throw new Error("Failed to load products")
                const data = await res.json()
                const normalizedProducts = (data.products ?? data).map((product: Product) => ({
                    ...product,
                    category: product.category ?? product.category_name ?? "Uncategorized",
                }))
                setProducts(normalizedProducts)
            } catch {
                toast.error("Failed to load products. Please try again.")
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    useEffect(() => {
        let result = products
        if (activeCategory !== "All") {
            result = result.filter((p) =>
                (p.category ?? "").toLowerCase() === activeCategory.toLowerCase()
            )
        }
        if (search.trim()) {
            const q = search.toLowerCase()
            result = result.filter(
                (p) =>
                    p.name.toLowerCase().includes(q) ||
                    (p.description ?? "").toLowerCase().includes(q)
            )
        }
        setFiltered(result)
    }, [products, search, activeCategory])

    const handleAddToCart = async (product: Product) => {
        setAddingId(product.id)
        try {
            addItem({
                id: product.id,
                name: product.name,
                price: product.price,
                quantity: 1,
            })
            toast.success(`${product.name} added to cart`)
        } catch {
            toast.error("Failed to add to cart")
        } finally {
            setAddingId(null)
        }
    }

    const formatPrice = (price: number) =>
        `₦${price.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <SiteHeader />

            <main className="flex-1">
                {/* Hero Banner */}
                <section className="border-b border-border bg-gradient-to-br from-[#0c4a6e] to-[#0c1e2d] px-4 py-12 text-center">
                    <div className="mx-auto max-w-2xl">
                        <div className="mb-3 flex items-center justify-center gap-2">
                            <Sparkles className="h-5 w-5 text-[#38bdf8]" />
                            <span className="text-sm font-medium text-[#38bdf8]">Premium Digital Products</span>
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
                            Shop NETTOOLZ
                        </h1>
                        <p className="mt-3 text-[#7dd3fc]">
                            Browse our catalog of premium accounts, tools, and licenses. Instant delivery after purchase.
                        </p>
                    </div>
                </section>

                <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
                    {/* Search + Filter Bar */}
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative max-w-md flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Search products..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <div className="relative flex items-center gap-1.5">
                            <Filter className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                            <button
                                type="button"
                                onClick={() => setCategoriesOpen((open) => !open)}
                                className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
                            >
                                <span>{activeCategory === "All" ? "Categories" : activeCategory}</span>
                                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${categoriesOpen ? "rotate-180" : ""}`} />
                            </button>

                            {categoriesOpen ? (
                                <div className="absolute right-0 top-full z-20 mt-2 min-w-52 overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
                                    {categories.map((category) => (
                                        <button
                                            key={category}
                                            type="button"
                                            onClick={() => {
                                                setActiveCategory(category)
                                                setCategoriesOpen(false)
                                            }}
                                            className={`block w-full px-4 py-3 text-left text-sm transition-colors ${activeCategory === category
                                                ? "bg-[#38bdf8]/10 text-[#0284c7]"
                                                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                                }`}
                                        >
                                            {category}
                                        </button>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {/* Product Grid */}
                    {loading ? (
                        <div className="flex items-center justify-center py-24">
                            <Loader2 className="h-8 w-8 animate-spin text-[#38bdf8]" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card py-20 text-center">
                            <Package className="h-12 w-12 text-muted-foreground/40" />
                            <div>
                                <p className="font-semibold text-foreground">No products found</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {search
                                        ? `No results for "${search}". Try a different search.`
                                        : "No products in this category yet. Check back soon!"}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSearch("")
                                    setActiveCategory("All")
                                }}
                            >
                                Clear Filters
                            </Button>
                        </div>
                    ) : (
                        <>
                            <p className="mb-4 text-sm text-muted-foreground">
                                {filtered.length} product{filtered.length !== 1 ? "s" : ""} found
                            </p>
                            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {filtered.map((product) => (
                                    <div
                                        key={product.id}
                                        className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:border-[#38bdf8]/50 hover:shadow-md"
                                    >
                                        {/* Product image / placeholder */}
                                        <div className="flex h-40 items-center justify-center bg-gradient-to-br from-[#0c4a6e]/30 to-[#075985]/30">
                                            {product.image_url ? (
                                                <img
                                                    src={product.image_url}
                                                    alt={product.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <Package className="h-14 w-14 text-[#38bdf8]/40" />
                                            )}
                                        </div>

                                        {/* Badges */}
                                        <div className="absolute left-3 top-3 flex gap-1.5">
                                            {product.featured && (
                                                <Badge className="bg-amber-500/90 text-white text-[10px]">
                                                    <Star className="mr-1 h-2.5 w-2.5" />
                                                    Featured
                                                </Badge>
                                            )}
                                            {product.available_qty === 0 && (
                                                <Badge variant="destructive" className="text-[10px]">Out of stock</Badge>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex flex-1 flex-col gap-3 p-4">
                                            {product.category && (
                                                <span className="text-xs font-medium text-[#38bdf8]">{product.category}</span>
                                            )}
                                            <h3 className="font-semibold text-foreground line-clamp-1">{product.name}</h3>
                                            <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                                            <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                                                <span className="text-lg font-bold text-foreground">{formatPrice(product.price)}</span>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleAddToCart(product)}
                                                    disabled={product.available_qty === 0 || addingId === product.id}
                                                    className="gap-1.5 bg-[#38bdf8] text-white hover:bg-[#0ea5e9] disabled:opacity-50"
                                                >
                                                    {addingId === product.id ? (
                                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    ) : (
                                                        <ShoppingCart className="h-3.5 w-3.5" />
                                                    )}
                                                    Add
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </main>

            <SiteFooter />
        </div>
    )
}
