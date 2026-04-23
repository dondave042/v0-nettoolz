"use client"

import { useEffect, useState } from "react"
import Dashboard from "./components/Dashboard"
import Analytics from "./components/Analytics"
import ProductsTable from "./components/ProductsTable"
import Settings from "./components/Settings"
import Sidebar from "./components/Sidebar"
import UploadProduct from "./components/UploadProduct"
import { mockProducts } from "./data/mockData"
import { AdminTab, Product } from "./types"

type ApiProduct = {
    id: number
    sku: string
    name: string
    description: string
    price: string | number
    available_qty: number
    badge?: string | null
    is_featured?: boolean | null
    category_name?: string | null
    images?: string[] | null
    product_username?: string | null
    product_password?: string | null
}

type ApiCategory = {
    id: number
    name: string
    slug?: string
}

function mapPlatform(categoryName?: string | null) {
    const value = (categoryName || "").toLowerCase()
    if (value.includes("instagram")) return "instagram"
    if (value.includes("facebook")) return "facebook"
    if (value.includes("twitter") || value.includes("x")) return "twitter"
    if (value.includes("tiktok")) return "tiktok"
    if (value.includes("youtube")) return "youtube"
    if (value.includes("linkedin")) return "linkedin"
    if (value.includes("telegram")) return "telegram"
    return "other"
}

function toDashboardProduct(entry: ApiProduct): Product {
    const hasCredentials = Boolean(entry.product_username || entry.product_password)
    const credentials = hasCredentials
        ? [{
            id: `${entry.id}-credentials`,
            username: entry.product_username || "",
            password: entry.product_password || "",
            status: "available" as const,
        }]
        : []

    const quantity = Number(entry.available_qty || 0)

    return {
        id: String(entry.id),
        name: entry.name,
        platform: mapPlatform(entry.category_name),
        category: entry.category_name || "Uncategorized",
        price: Number(entry.price || 0),
        quantity,
        status: quantity > 0 ? "active" : "sold_out",
        image: entry.images?.[0],
        images: entry.images || [],
        description: entry.description || "",
        accounts: credentials,
        createdAt: new Date(),
        updatedAt: new Date(),
    }
}

function findCategoryId(categories: ApiCategory[], product: Product) {
    const byName = categories.find((category) => category.name.toLowerCase() === product.category.toLowerCase())
    if (byName) return byName.id

    const slug = product.category.toLowerCase().replace(/\s+/g, "-")
    const bySlug = categories.find((category) => (category.slug || "").toLowerCase() === slug)
    if (bySlug) return bySlug.id

    return null
}

function buildProductPayload(product: Product, categoryId: number | null) {
    const skuPrefix = product.name.replace(/[^A-Za-z0-9]/g, "").slice(0, 6).toUpperCase() || "PROD"

    return {
        sku: `${skuPrefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: product.name,
        description: product.description,
        price: product.price,
        available_qty: product.quantity,
        category_id: categoryId,
        badge: null,
        is_featured: false,
        images: product.images || (product.image ? [product.image] : []),
        product_username: product.accounts[0]?.username || null,
        product_password: product.accounts[0]?.password || null,
    }
}

interface AppProps {
    initialTab?: AdminTab
}

export default function App({ initialTab = "dashboard" }: AppProps) {
    const [activeTab, setActiveTab] = useState<AdminTab>(initialTab)
    const [products, setProducts] = useState<Product[]>([])

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const [productsResponse, categoriesResponse] = await Promise.all([
                    fetch("/api/admin/products", { cache: "no-store" }),
                    fetch("/api/admin/categories", { cache: "no-store" }),
                ])

                if (!productsResponse.ok) {
                    return
                }

                const productsPayload = await productsResponse.json()
                const apiProducts: ApiProduct[] = Array.isArray(productsPayload) ? productsPayload : []
                const categoriesPayload = categoriesResponse.ok ? await categoriesResponse.json() : []
                const categories: ApiCategory[] = Array.isArray(categoriesPayload) ? categoriesPayload : []

                const existingProductNames = new Set(apiProducts.map((entry) => entry.name.toLowerCase()))
                const missingProducts = mockProducts.filter(
                    (product) => !existingProductNames.has(product.name.toLowerCase())
                )

                for (const product of missingProducts) {
                    const createResponse = await fetch("/api/admin/products", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(buildProductPayload(product, findCategoryId(categories, product))),
                    })

                    if (!createResponse.ok) {
                        const text = await createResponse.text()
                        console.error("[Admin Dashboard] Failed syncing product:", product.name, text)
                    }
                }

                const finalProductsResponse = missingProducts.length > 0
                    ? await fetch("/api/admin/products", { cache: "no-store" })
                    : productsResponse

                const finalPayload = missingProducts.length > 0
                    ? await finalProductsResponse.json()
                    : productsPayload

                const list = Array.isArray(finalPayload) ? finalPayload : []
                setProducts(list.map((entry: ApiProduct) => toDashboardProduct(entry)))
            } catch (error) {
                console.error("[Admin Dashboard] Failed to fetch products:", error)
            }
        }

        fetchProducts()
    }, [])

    const handleAddProduct = async (product: Product) => {
        const categoriesResponse = await fetch("/api/admin/categories", { cache: "no-store" })
        const categoriesPayload = categoriesResponse.ok ? await categoriesResponse.json() : []
        const categories: ApiCategory[] = Array.isArray(categoriesPayload) ? categoriesPayload : []
        const payload = buildProductPayload(product, findCategoryId(categories, product))

        const response = await fetch("/api/admin/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })

        if (!response.ok) {
            throw new Error("Failed to save product to website")
        }

        const created = await response.json()
        setProducts((previous) => [toDashboardProduct(created as ApiProduct), ...previous])
        setActiveTab("products")
    }

    const handleDeleteProduct = async (id: string) => {
        const response = await fetch(`/api/admin/products?id=${id}`, {
            method: "DELETE",
        })

        if (!response.ok) {
            throw new Error("Failed to delete product")
        }

        setProducts((previous) => previous.filter((product) => product.id !== id))
    }

    const handleUpdateProduct = (product: Product) => {
        setProducts((previous) => previous.map((entry) => (entry.id === product.id ? product : entry)))
    }

    function renderContent() {
        switch (activeTab) {
            case "products":
                return <ProductsTable products={products} onDeleteProduct={handleDeleteProduct} onUpdateProduct={handleUpdateProduct} />
            case "upload":
                return <UploadProduct onAddProduct={handleAddProduct} />
            case "analytics":
                return <Analytics products={products} />
            case "settings":
                return <Settings />
            case "dashboard":
            default:
                return <Dashboard products={products} />
        }
    }

    return (
        <div className="min-h-screen bg-slate-950">
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-cyan-500/10 blur-[120px]" />
                <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-purple-500/10 blur-[120px]" />
                <div className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/5 blur-[150px]" />
            </div>
            <div className="pointer-events-none fixed inset-0 opacity-[0.02]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

            <main className="relative z-10 ml-[260px] min-h-screen">
                <div className="mx-auto max-w-[1400px] p-8">{renderContent()}</div>
            </main>
        </div>
    )
}
