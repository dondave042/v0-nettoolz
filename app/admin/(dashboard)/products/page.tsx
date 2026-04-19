"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardHeader } from "@/components/dashboard/header"
import { AddProductForm } from "@/components/admin/add-product-form"
import { Package, PlusCircle, KeyRound, Archive, X } from "lucide-react"

interface Product {
    id: number
    name: string
    description: string | null
    price: string | number
    available_qty: number
    total_credentials: number
    unassigned_credentials: number
    created_at: string
}

function formatPrice(p: string | number) {
    return `₦${Number(p).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
}

function StatusBadge({ qty }: { qty: number }) {
    if (qty === 0)
        return (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950/40 dark:text-red-400">
                Out of stock
            </span>
        )
    if (qty <= 5)
        return (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                Low stock ({qty})
            </span>
        )
    return (
        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-950/40 dark:text-green-400">
            In stock ({qty})
        </span>
    )
}

export default function AdminProductsPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)

    const fetchProducts = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/admin/products")
            if (!res.ok) throw new Error("Failed to load")
            const data = await res.json()
            setProducts(data.products ?? [])
        } catch {
            // silent — list just stays empty
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchProducts() }, [fetchProducts])

    function handleSuccess() {
        setShowForm(false)
        fetchProducts()
    }

    return (
        <div className="space-y-8">
            <DashboardHeader
                title="Products"
                description="Manage your product catalogue and buyer credential inventory."
                action={
                    <button
                        onClick={() => setShowForm(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        <PlusCircle className="h-4 w-4" />
                        Add Product
                    </button>
                }
            />

            {/* ── Add Product Modal ── */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-10">
                    <div className="w-full max-w-2xl rounded-xl border border-border bg-background shadow-2xl">
                        <div className="flex items-center justify-between border-b border-border px-6 py-4">
                            <h2 className="text-lg font-semibold">Add New Product</h2>
                            <button
                                onClick={() => setShowForm(false)}
                                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="px-6 py-5">
                            <AddProductForm onSuccess={handleSuccess} onCancel={() => setShowForm(false)} />
                        </div>
                    </div>
                </div>
            )}

            {/* ── Product List ── */}
            {loading ? (
                <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
                    Loading products…
                </div>
            ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
                    <Package className="mb-3 h-10 w-10 text-muted-foreground/40" />
                    <p className="text-sm font-medium text-muted-foreground">No products yet</p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                        <PlusCircle className="h-4 w-4" />
                        Add your first product
                    </button>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-border">
                    <table className="w-full text-sm">
                        <thead className="border-b border-border bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Product</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Price</th>
                                <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                                    <span className="flex items-center justify-center gap-1">
                                        <Archive className="h-3.5 w-3.5" /> Stock
                                    </span>
                                </th>
                                <th className="px-4 py-3 text-center font-medium text-muted-foreground">
                                    <span className="flex items-center justify-center gap-1">
                                        <KeyRound className="h-3.5 w-3.5" /> Credentials
                                    </span>
                                </th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Added</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {products.map((p) => (
                                <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="px-4 py-3">
                                        <p className="font-medium">{p.name}</p>
                                        {p.description && (
                                            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                                                {p.description}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono font-medium">
                                        {formatPrice(p.price)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <StatusBadge qty={p.available_qty} />
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="text-xs">
                                            <span className="font-semibold text-green-600">{p.unassigned_credentials}</span>
                                            <span className="text-muted-foreground"> / {p.total_credentials} available</span>
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-muted-foreground">
                                        {new Date(p.created_at).toLocaleDateString("en-NG", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                        })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
