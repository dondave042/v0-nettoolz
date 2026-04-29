"use client"

import { useEffect, useMemo, useState } from "react"
import {
    Loader2,
    Plus,
    Pencil,
    Trash2,
    Eye,
    EyeOff,
    Package,
    KeyRound,
    Search,
    RefreshCw,
    X,
    AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

type Product = {
    id: number
    sku: string
    name: string
    description: string | null
    price: number
    available_qty: number
    category_id: number | null
    category_name?: string | null
    badge: string | null
    is_featured: boolean
    images: string[] | null
    product_username: string | null
    product_password: string | null
    created_at: string
    updated_at: string
}

type Category = {
    id: number
    name: string
}

type InventoryCredential = {
    id: number
    product_id: number
    username: string
    password: string
    assigned_to_buyer_id: number | null
    created_at: string
}

type ProductCredential = {
    id?: string
    username: string
    password: string
}

type ProductForm = {
    sku: string
    name: string
    description: string
    price: string
    available_qty: string
    category_id: string
    badge: string
    is_featured: boolean
    image_url: string
    product_username: string
    product_password: string
    credentials: ProductCredential[]
}

const emptyForm: ProductForm = {
    sku: "",
    name: "",
    description: "",
    price: "",
    available_qty: "0",
    category_id: "",
    badge: "",
    is_featured: false,
    image_url: "",
    product_username: "",
    product_password: "",
    credentials: [{ username: "", password: "" }],
}

function formatPrice(value: number) {
    return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 2,
    }).format(value)
}

async function getErrorMessage(response: Response, fallbackMessage: string) {
    const responseText = await response.text()

    if (!responseText) {
        return fallbackMessage
    }

    try {
        const parsed = JSON.parse(responseText) as { error?: unknown }
        return typeof parsed.error === "string" && parsed.error ? parsed.error : fallbackMessage
    } catch {
        return fallbackMessage
    }
}

async function fetchProductCredentials(productId: number): Promise<ProductCredential[]> {
    try {
        const response = await fetch(`/api/admin/credentials-inventory?product_id=${productId}`)
        if (!response.ok) return []
        const data = (await response.json()) as InventoryCredential[]
        return data.map((c) => ({
            id: String(c.id),
            username: c.username,
            password: c.password,
        }))
    } catch {
        return []
    }
}

function mapProductToForm(product: Product, credentials: ProductCredential[] = []): ProductForm {
    const firstImage = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : ""

    return {
        sku: product.sku || "",
        name: product.name || "",
        description: product.description || "",
        price: String(product.price ?? ""),
        available_qty: String(product.available_qty ?? 0),
        category_id: product.category_id ? String(product.category_id) : "",
        badge: product.badge || "",
        is_featured: Boolean(product.is_featured),
        image_url: firstImage,
        product_username: product.product_username || "",
        product_password: product.product_password || "",
        credentials: credentials.length > 0 ? credentials : [{ username: "", password: "" }],
    }
}

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [categoriesError, setCategoriesError] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<number | null>(null)
    const [refreshing, setRefreshing] = useState(false)

    const [search, setSearch] = useState("")
    const [categoryFilter, setCategoryFilter] = useState("")

    const [showProductModal, setShowProductModal] = useState(false)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)
    const [form, setForm] = useState<ProductForm>(emptyForm)

    const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState("")
    const [newCategoryDescription, setNewCategoryDescription] = useState("")
    const [creatingCategory, setCreatingCategory] = useState(false)

    const [showCredentialsModal, setShowCredentialsModal] = useState(false)
    const [credentialsLoading, setCredentialsLoading] = useState(false)
    const [credentialsProduct, setCredentialsProduct] = useState<Product | null>(null)
    const [credentials, setCredentials] = useState<InventoryCredential[]>([])
    const [showCredentialPasswords, setShowCredentialPasswords] = useState<Record<number, boolean>>({})

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData(background = false) {
        if (!background) {
            setLoading(true)
            setCategoriesError(null)
        } else {
            setRefreshing(true)
        }

        try {
            const [productsRes, categoriesRes] = await Promise.all([
                fetch("/api/admin/products"),
                fetch("/api/admin/categories"),
            ])

            if (!productsRes.ok) {
                throw new Error(await getErrorMessage(productsRes, "Failed to load products"))
            }

            const productsData = await productsRes.json()
            const normalizedProducts = (Array.isArray(productsData) ? productsData : productsData.products || []) as Product[]
            setProducts(normalizedProducts)

            // Handle categories separately to not block product loading
            if (!categoriesRes.ok) {
                const errorMsg = await getErrorMessage(categoriesRes, "Failed to load categories")
                console.error("[v0] Categories fetch error:", errorMsg)
                setCategoriesError(errorMsg)
                setCategories([])
            } else {
                const categoriesData = await categoriesRes.json()
                const normalizedCategories = (Array.isArray(categoriesData) ? categoriesData : categoriesData.categories || []) as Category[]
                setCategories(normalizedCategories)
                setCategoriesError(null)
            }
        } catch (error) {
            console.error("Admin products fetch error:", error)
            toast.error(error instanceof Error ? error.message : "Failed to load admin data")
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const filteredProducts = useMemo(() => {
        const searchTerm = search.trim().toLowerCase()

        return products.filter((product) => {
            const matchesSearch =
                !searchTerm ||
                product.name.toLowerCase().includes(searchTerm) ||
                product.sku.toLowerCase().includes(searchTerm) ||
                (product.product_username || "").toLowerCase().includes(searchTerm)

            const matchesCategory =
                !categoryFilter ||
                (product.category_id !== null && String(product.category_id) === categoryFilter)

            return matchesSearch && matchesCategory
        })
    }, [products, search, categoryFilter])

    function openCreateModal() {
        setEditingProduct(null)
        setForm(emptyForm)
        setShowProductModal(true)
    }

    async function openEditModal(product: Product) {
        setEditingProduct(product)
        const credentials = await fetchProductCredentials(product.id)
        setForm(mapProductToForm(product, credentials))
        setShowProductModal(true)
    }

    async function handleSaveProduct(event: React.FormEvent) {
        event.preventDefault()

        if (!form.name.trim()) {
            toast.error("Product name is required")
            return
        }

        if (!form.sku.trim()) {
            toast.error("Product SKU is required")
            return
        }

        const parsedPrice = Number(form.price)
        const parsedQty = Number(form.available_qty)

        if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
            toast.error("Enter a valid product price")
            return
        }

        if (!Number.isFinite(parsedQty) || parsedQty < 0) {
            toast.error("Enter a valid available quantity")
            return
        }

        setSaving(true)

        try {
            // Filter out empty credentials
            const validCredentials = form.credentials.filter(
                (cred) => cred.username.trim() || cred.password.trim()
            )

            const payload = {
                ...(editingProduct ? { id: editingProduct.id } : {}),
                sku: form.sku.trim(),
                name: form.name.trim(),
                description: form.description.trim() || null,
                price: parsedPrice,
                available_qty: Math.floor(parsedQty),
                category_id: form.category_id ? Number(form.category_id) : null,
                badge: form.badge.trim() || null,
                is_featured: form.is_featured,
                images: form.image_url.trim() ? [form.image_url.trim()] : null,
                product_username: form.product_username.trim() || null,
                product_password: form.product_password.trim() || null,
                credentials: validCredentials.map((cred) => ({
                    id: cred.id,
                    username: cred.username.trim(),
                    password: cred.password.trim(),
                })),
            }

            const response = await fetch("/api/admin/products", {
                method: editingProduct ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            if (!response.ok) {
                throw new Error(await getErrorMessage(response, "Failed to save product"))
            }

            toast.success(editingProduct ? "Product updated" : "Product created")
            setShowProductModal(false)
            await fetchData(true)
        } catch (error) {
            console.error("Save product error:", error)
            toast.error(error instanceof Error ? error.message : "Failed to save product")
        } finally {
            setSaving(false)
        }
    }

    async function handleDeleteProduct(productId: number) {
        const okay = window.confirm("Delete this product? This cannot be undone.")
        if (!okay) {
            return
        }

        setDeletingId(productId)

        try {
            const response = await fetch(`/api/admin/products?id=${productId}`, {
                method: "DELETE",
            })

            if (!response.ok) {
                throw new Error(await getErrorMessage(response, "Failed to delete product"))
            }

            toast.success("Product deleted")
            await fetchData(true)
        } catch (error) {
            console.error("Delete product error:", error)
            toast.error(error instanceof Error ? error.message : "Failed to delete product")
        } finally {
            setDeletingId(null)
        }
    }

    async function handleCreateCategory() {
        const trimmed = newCategoryName.trim()
        if (!trimmed) {
            toast.error("Category name is required")
            return
        }

        setCreatingCategory(true)
        try {
            const res = await fetch("/api/admin/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: trimmed,
                    description: newCategoryDescription.trim() || null,
                }),
            })

            if (!res.ok) {
                const error = await getErrorMessage(res, "Failed to create category")
                throw new Error(error)
            }

            const newCategory = await res.json()
            setCategories((prev) => [...prev, newCategory as Category])
            setForm((prev) => ({ ...prev, category_id: String(newCategory.id) }))
            toast.success(`Category "${newCategory.name}" created and selected`)

            // Reset form
            setNewCategoryName("")
            setNewCategoryDescription("")
            setShowCreateCategoryModal(false)
        } catch (error) {
            console.error("Create category error:", error)
            toast.error(error instanceof Error ? error.message : "Failed to create category")
        } finally {
            setCreatingCategory(false)
        }
    }

    async function openCredentialsModal(product: Product) {
        setCredentialsProduct(product)
        setShowCredentialsModal(true)
        setCredentialsLoading(true)
        setShowCredentialPasswords({})

        try {
            const response = await fetch(`/api/admin/credentials-inventory?product_id=${product.id}`)

            if (!response.ok) {
                throw new Error(await getErrorMessage(response, "Failed to load account credentials"))
            }

            const data = await response.json()
            const inventory = Array.isArray(data.inventory) ? data.inventory : []
            setCredentials(inventory)
        } catch (error) {
            console.error("Fetch credentials error:", error)
            toast.error(error instanceof Error ? error.message : "Failed to load credentials")
            setCredentials([])
        } finally {
            setCredentialsLoading(false)
        }
    }

    const totalCredentials = credentials.length
    const assignedCredentials = credentials.filter((item) => item.assigned_to_buyer_id !== null).length
    const availableCredentials = totalCredentials - assignedCredentials

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-[#38bdf8]" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-card p-5 md:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Admin Products Dashboard</h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Manage products and view account credentials inventory from one table.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => fetchData(true)}
                            disabled={refreshing}
                        >
                            {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            Refresh
                        </Button>
                        <Button className="gap-2 bg-[#38bdf8] text-white hover:bg-[#0ea5e9]" onClick={openCreateModal}>
                            <Plus className="h-4 w-4" />
                            New Product
                        </Button>
                    </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr),220px]">
                    <label className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search by product name, SKU, or username"
                            className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none transition-colors focus:border-[#38bdf8]"
                        />
                    </label>

                    <div className="relative">
                        <select
                            value={categoryFilter}
                            onChange={(event) => setCategoryFilter(event.target.value)}
                            disabled={categories.length === 0 && !categoriesError}
                            className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-[#38bdf8] disabled:opacity-50"
                        >
                            <option value="">All categories</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                        {categoriesError && (
                            <div className="mt-2 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                <span>{categoriesError}</span>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[980px] text-sm">
                        <thead className="border-b border-border bg-muted/40">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold text-foreground">Product</th>
                                <th className="px-4 py-3 text-left font-semibold text-foreground">Category</th>
                                <th className="px-4 py-3 text-left font-semibold text-foreground">Price</th>
                                <th className="px-4 py-3 text-left font-semibold text-foreground">Stock</th>
                                <th className="px-4 py-3 text-left font-semibold text-foreground">Shared Login</th>
                                <th className="px-4 py-3 text-left font-semibold text-foreground">Credentials</th>
                                <th className="px-4 py-3 text-left font-semibold text-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                                        No products match your filter.
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => {
                                    const hasShared = Boolean(product.product_username && product.product_password)

                                    return (
                                        <tr key={product.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                                            <td className="px-4 py-3 align-top">
                                                <div className="flex items-start gap-3">
                                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#38bdf8]/10">
                                                        <Package className="h-4 w-4 text-[#0284c7]" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate font-semibold text-foreground">{product.name}</p>
                                                        <p className="text-xs text-muted-foreground">SKU: {product.sku || "-"}</p>
                                                        {product.badge ? (
                                                            <span className="mt-1 inline-flex rounded-full bg-[#38bdf8]/10 px-2 py-0.5 text-[11px] font-medium text-[#0284c7]">
                                                                {product.badge}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-4 py-3 text-muted-foreground">
                                                {product.category_name || "Uncategorized"}
                                            </td>

                                            <td className="px-4 py-3 font-medium text-foreground">{formatPrice(Number(product.price || 0))}</td>

                                            <td className="px-4 py-3">
                                                <div className="inline-flex rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
                                                    {product.available_qty}
                                                </div>
                                            </td>

                                            <td className="px-4 py-3">
                                                {hasShared ? (
                                                    <div className="space-y-1">
                                                        <p className="font-mono text-xs text-foreground">{product.product_username}</p>
                                                        <p className="font-mono text-xs text-muted-foreground">••••••••</p>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">Not configured</span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="gap-2"
                                                    onClick={() => openCredentialsModal(product)}
                                                >
                                                    <KeyRound className="h-3.5 w-3.5" />
                                                    View
                                                </Button>
                                            </td>

                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-1">
                                                    <Button variant="ghost" size="icon" onClick={() => openEditModal(product)} aria-label="Edit product">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDeleteProduct(product.id)}
                                                        disabled={deletingId === product.id}
                                                        aria-label="Delete product"
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        {deletingId === product.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {showProductModal ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
                    <div className="w-full max-w-3xl rounded-2xl border border-border bg-card p-5 md:p-6">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-foreground">
                                    {editingProduct ? "Edit Product" : "Create Product"}
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Set pricing, stock, and shared account credentials.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowProductModal(false)}
                                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                aria-label="Close"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveProduct} className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="space-y-1">
                                    <span className="text-sm font-medium text-foreground">SKU</span>
                                    <input
                                        value={form.sku}
                                        onChange={(event) => setForm((prev) => ({ ...prev, sku: event.target.value }))}
                                        placeholder="e.g. FB-ACC-001"
                                        className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-[#38bdf8]"
                                    />
                                </label>

                                <label className="space-y-1">
                                    <span className="text-sm font-medium text-foreground">Name</span>
                                    <input
                                        value={form.name}
                                        onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                                        placeholder="Product name"
                                        className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-[#38bdf8]"
                                    />
                                </label>

                                <label className="space-y-1">
                                    <span className="text-sm font-medium text-foreground">Price (NGN)</span>
                                    <input
                                        value={form.price}
                                        onChange={(event) => setForm((prev) => ({ ...prev, price: event.target.value }))}
                                        placeholder="0"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-[#38bdf8]"
                                    />
                                </label>

                                <label className="space-y-1">
                                    <span className="text-sm font-medium text-foreground">Available Qty</span>
                                    <input
                                        value={form.available_qty}
                                        onChange={(event) => setForm((prev) => ({ ...prev, available_qty: event.target.value }))}
                                        type="number"
                                        min="0"
                                        step="1"
                                        className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-[#38bdf8]"
                                    />
                                </label>

                                <label className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-foreground">Category</span>
                                        {categories.length === 0 && !categoriesError && (
                                            <span className="text-xs text-muted-foreground">Loading categories...</span>
                                        )}
                                    </div>
                                    {categoriesError ? (
                                        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-3 text-sm text-destructive">
                                            <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                            <div className="flex-1">
                                                <p className="font-medium">Cannot load categories</p>
                                                <p className="text-xs mt-1">{categoriesError}</p>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    className="mt-2 h-8 text-xs text-destructive hover:text-destructive hover:bg-destructive/20"
                                                    onClick={() => fetchData(true)}
                                                >
                                                    Retry loading categories
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <select
                                                value={form.category_id}
                                                onChange={(event) => setForm((prev) => ({ ...prev, category_id: event.target.value }))}
                                                disabled={categories.length === 0}
                                                className="h-10 flex-1 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-[#38bdf8] disabled:opacity-50"
                                            >
                                                <option value="">Uncategorized</option>
                                                {categories.map((category) => (
                                                    <option key={category.id} value={category.id}>
                                                        {category.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="gap-1"
                                                onClick={() => setShowCreateCategoryModal(true)}
                                            >
                                                <Plus className="h-4 w-4" />
                                                New
                                            </Button>
                                        </div>
                                    )}
                                </label>

                                <label className="space-y-1">
                                    <span className="text-sm font-medium text-foreground">Badge</span>
                                    <input
                                        value={form.badge}
                                        onChange={(event) => setForm((prev) => ({ ...prev, badge: event.target.value }))}
                                        placeholder="e.g. BEST SELLER"
                                        className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-[#38bdf8]"
                                    />
                                </label>
                            </div>

                            <label className="space-y-1 block">
                                <span className="text-sm font-medium text-foreground">Description</span>
                                <textarea
                                    value={form.description}
                                    onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                                    placeholder="Product description"
                                    rows={3}
                                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-[#38bdf8]"
                                />
                            </label>

                            <div className="grid gap-4 md:grid-cols-3">
                                <label className="space-y-1 md:col-span-3">
                                    <span className="text-sm font-medium text-foreground">Primary Image URL</span>
                                    <input
                                        value={form.image_url}
                                        onChange={(event) => setForm((prev) => ({ ...prev, image_url: event.target.value }))}
                                        placeholder="https://..."
                                        className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-[#38bdf8]"
                                    />
                                </label>

                                <label className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2.5">
                                    <input
                                        checked={form.is_featured}
                                        onChange={(event) => setForm((prev) => ({ ...prev, is_featured: event.target.checked }))}
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-border"
                                    />
                                    <span className="text-sm font-medium text-foreground">Featured product</span>
                                </label>
                            </div>

                            <div className="border-t border-border pt-4">
                                <div className="mb-4 flex items-center justify-between">
                                    <label className="text-sm font-semibold text-foreground">Shared Credentials</label>
                                    <p className="text-xs text-muted-foreground">{form.credentials.length} credential entry</p>
                                </div>

                                <label className="space-y-1">
                                    <span className="text-sm font-medium text-foreground">Shared Username</span>
                                    <input
                                        value={form.product_username}
                                        onChange={(event) => setForm((prev) => ({ ...prev, product_username: event.target.value }))}
                                        placeholder="Optional"
                                        className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-[#38bdf8]"
                                    />
                                </label>

                                <label className="space-y-1">
                                    <span className="text-sm font-medium text-foreground">Shared Password</span>
                                    <input
                                        value={form.product_password}
                                        onChange={(event) => setForm((prev) => ({ ...prev, product_password: event.target.value }))}
                                        placeholder="Optional"
                                        type="password"
                                        className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-[#38bdf8]"
                                    />
                                </label>
                            </div>

                            <div className="border-t border-border pt-4">
                                <div className="mb-4 flex items-center justify-between">
                                    <label className="text-sm font-semibold text-foreground">Individual Credentials</label>
                                    <p className="text-xs text-muted-foreground">{form.credentials.length} credential rows</p>
                                </div>

                                <div className="space-y-3">
                                    {form.credentials.map((credential, index) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                value={credential.username}
                                                onChange={(e) =>
                                                    setForm((prev) => {
                                                        const newCreds = [...prev.credentials]
                                                        newCreds[index] = { ...newCreds[index], username: e.target.value }
                                                        return { ...prev, credentials: newCreds }
                                                    })
                                                }
                                                placeholder="Username"
                                                className="flex-1 h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-[#38bdf8]"
                                            />
                                            <input
                                                value={credential.password}
                                                onChange={(e) =>
                                                    setForm((prev) => {
                                                        const newCreds = [...prev.credentials]
                                                        newCreds[index] = { ...newCreds[index], password: e.target.value }
                                                        return { ...prev, credentials: newCreds }
                                                    })
                                                }
                                                type="password"
                                                placeholder="Password"
                                                className="flex-1 h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-[#38bdf8]"
                                            />
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setForm((prev) => ({
                                                        ...prev,
                                                        credentials: prev.credentials.filter((_, i) => i !== index),
                                                    }))
                                                }
                                                className="rounded-lg border border-border px-2 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                                aria-label="Remove credential"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setForm((prev) => ({
                                            ...prev,
                                            credentials: [...prev.credentials, { username: "", password: "" }],
                                        }))
                                    }
                                    className="mt-3 flex items-center gap-2 text-sm font-medium text-[#38bdf8] transition-colors hover:text-[#0ea5e9]"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Credential Row
                                </button>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setShowProductModal(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={saving} className="bg-[#38bdf8] text-white hover:bg-[#0ea5e9]">
                                    {saving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : editingProduct ? (
                                        "Update Product"
                                    ) : (
                                        "Create Product"
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : null}

            {showCredentialsModal ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
                    <div className="w-full max-w-4xl rounded-2xl border border-border bg-card p-5 md:p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-foreground">Account Credentials</h2>
                                <p className="text-sm text-muted-foreground">
                                    {credentialsProduct ? credentialsProduct.name : "Product"}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowCredentialsModal(false)}
                                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                aria-label="Close"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="mb-4 grid gap-2 sm:grid-cols-3">
                            <div className="rounded-lg border border-border bg-muted/30 p-3">
                                <p className="text-xs text-muted-foreground">Total</p>
                                <p className="text-xl font-semibold text-foreground">{totalCredentials}</p>
                            </div>
                            <div className="rounded-lg border border-border bg-muted/30 p-3">
                                <p className="text-xs text-muted-foreground">Available</p>
                                <p className="text-xl font-semibold text-emerald-600">{availableCredentials}</p>
                            </div>
                            <div className="rounded-lg border border-border bg-muted/30 p-3">
                                <p className="text-xs text-muted-foreground">Assigned</p>
                                <p className="text-xl font-semibold text-sky-600">{assignedCredentials}</p>
                            </div>
                        </div>

                        {credentialsLoading ? (
                            <div className="flex items-center justify-center py-10">
                                <Loader2 className="h-6 w-6 animate-spin text-[#38bdf8]" />
                            </div>
                        ) : (
                            <div className="max-h-[420px] overflow-auto rounded-xl border border-border">
                                <table className="w-full text-sm">
                                    <thead className="border-b border-border bg-muted/40">
                                        <tr>
                                            <th className="px-3 py-2.5 text-left font-semibold text-foreground">Username</th>
                                            <th className="px-3 py-2.5 text-left font-semibold text-foreground">Password</th>
                                            <th className="px-3 py-2.5 text-left font-semibold text-foreground">Status</th>
                                            <th className="px-3 py-2.5 text-left font-semibold text-foreground">Added</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {credentials.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                                                    No credentials found for this product.
                                                </td>
                                            </tr>
                                        ) : (
                                            credentials.map((credential) => {
                                                const revealed = Boolean(showCredentialPasswords[credential.id])
                                                const isAssigned = credential.assigned_to_buyer_id !== null

                                                return (
                                                    <tr key={credential.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                                                        <td className="px-3 py-2.5 font-mono text-xs text-foreground">{credential.username}</td>
                                                        <td className="px-3 py-2.5">
                                                            <div className="flex items-center gap-2">
                                                                <code className="font-mono text-xs text-foreground">
                                                                    {revealed ? credential.password : "•".repeat(Math.min(credential.password.length, 16))}
                                                                </code>
                                                                <button
                                                                    onClick={() =>
                                                                        setShowCredentialPasswords((prev) => ({
                                                                            ...prev,
                                                                            [credential.id]: !prev[credential.id],
                                                                        }))
                                                                    }
                                                                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                                                    aria-label={revealed ? "Hide password" : "Show password"}
                                                                >
                                                                    {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2.5">
                                                            <span
                                                                className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${isAssigned
                                                                        ? "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300"
                                                                        : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                                                    }`}
                                                            >
                                                                {isAssigned ? "Assigned" : "Available"}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2.5 text-xs text-muted-foreground">
                                                            {new Date(credential.created_at).toLocaleString()}
                                                        </td>
                                                    </tr>
                                                )
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="mt-4 flex items-center justify-end">
                            <Button variant="outline" onClick={() => setShowCredentialsModal(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                </div>
            ) : null}

            {showCreateCategoryModal ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
                    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 md:p-6">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold text-foreground">Create New Category</h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Create a new product category to organize your inventory.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowCreateCategoryModal(false)}
                                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                aria-label="Close"
                                disabled={creatingCategory}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <label className="space-y-1 block">
                                <span className="text-sm font-medium text-foreground">Category Name *</span>
                                <input
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && newCategoryName.trim() && !creatingCategory) {
                                            handleCreateCategory()
                                        }
                                    }}
                                    placeholder="e.g. Gaming, Electronics, Software"
                                    className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-[#38bdf8]"
                                    disabled={creatingCategory}
                                    autoFocus
                                />
                            </label>

                            <label className="space-y-1 block">
                                <span className="text-sm font-medium text-foreground">Description (Optional)</span>
                                <textarea
                                    value={newCategoryDescription}
                                    onChange={(e) => setNewCategoryDescription(e.target.value)}
                                    placeholder="Describe what products belong in this category"
                                    rows={3}
                                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-[#38bdf8]"
                                    disabled={creatingCategory}
                                />
                            </label>

                            <div className="flex items-center justify-end gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setShowCreateCategoryModal(false)
                                        setNewCategoryName("")
                                        setNewCategoryDescription("")
                                    }}
                                    disabled={creatingCategory}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="button"
                                    disabled={!newCategoryName.trim() || creatingCategory}
                                    className="bg-[#38bdf8] text-white hover:bg-[#0ea5e9]"
                                    onClick={handleCreateCategory}
                                >
                                    {creatingCategory ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Create Category
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    )
}
