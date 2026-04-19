"use client"

import { useState, useCallback } from "react"
import { toast } from "sonner"
import { PlusCircle, Trash2, KeyRound, ChevronDown, ChevronUp, AlertCircle } from "lucide-react"

interface AddProductFormProps {
    onSuccess?: () => void
    onCancel?: () => void
}

function CredentialRow({
    index,
    value,
    onChange,
    onRemove,
    canRemove,
}: {
    index: number
    value: string
    onChange: (val: string) => void
    onRemove: () => void
    canRemove: boolean
}) {
    return (
        <div className="flex items-center gap-2">
            <span className="w-6 shrink-0 text-right text-xs text-muted-foreground">{index + 1}.</span>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={`Credential #${index + 1} — e.g. username:password or token`}
                className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {canRemove && (
                <button
                    type="button"
                    onClick={onRemove}
                    className="shrink-0 rounded-md p-1.5 text-destructive hover:bg-destructive/10"
                    aria-label={`Remove credential ${index + 1}`}
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            )}
        </div>
    )
}

export function AddProductForm({ onSuccess, onCancel }: AddProductFormProps) {
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [price, setPrice] = useState("")
    const [quantity, setQuantity] = useState("1")
    const [credentials, setCredentials] = useState<string[]>([""])
    const [credSectionOpen, setCredSectionOpen] = useState(true)
    const [loading, setLoading] = useState(false)

    // Keep credential rows in sync with quantity (auto-add or trim)
    function handleQuantityChange(val: string) {
        setQuantity(val)
        const n = Math.max(1, Math.min(500, parseInt(val, 10) || 1))
        setCredentials((prev) => {
            if (prev.length < n) {
                return [...prev, ...Array(n - prev.length).fill("")]
            }
            return prev.slice(0, n)
        })
    }

    const updateCred = useCallback((i: number, val: string) => {
        setCredentials((prev) => {
            const next = [...prev]
            next[i] = val
            return next
        })
    }, [])

    const removeCred = useCallback((i: number) => {
        setCredentials((prev) => prev.filter((_, idx) => idx !== i))
    }, [])

    function addCredRow() {
        setCredentials((prev) => [...prev, ""])
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!name.trim()) { toast.error("Product name is required"); return }
        const priceNum = parseFloat(price)
        if (isNaN(priceNum) || priceNum < 0) { toast.error("Enter a valid price"); return }
        const qty = Math.max(1, parseInt(quantity, 10) || 1)

        setLoading(true)
        try {
            const res = await fetch("/api/admin/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    description: description.trim() || undefined,
                    price: priceNum,
                    quantity: qty,
                    credentials: credentials.filter((c) => c.trim().length > 0),
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Failed to create product")
            toast.success(data.message || "Product created successfully")
            onSuccess?.()
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "An unexpected error occurred")
        } finally {
            setLoading(false)
        }
    }

    const qty = Math.max(1, parseInt(quantity, 10) || 1)
    const filledCreds = credentials.filter((c) => c.trim()).length

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* ── Product Details ── */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Product Details
                </h3>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label className="mb-1.5 block text-sm font-medium">
                            Product Name <span className="text-destructive">*</span>
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Netflix Premium 1-Month"
                            required
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    <div className="sm:col-span-2">
                        <label className="mb-1.5 block text-sm font-medium">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Briefly describe what the buyer receives…"
                            rows={3}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium">
                            Price (₦) <span className="text-destructive">*</span>
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="0.00"
                            required
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium">
                            Stock Quantity <span className="text-destructive">*</span>
                        </label>
                        <input
                            type="number"
                            min="1"
                            max="500"
                            step="1"
                            value={quantity}
                            onChange={(e) => handleQuantityChange(e.target.value)}
                            required
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <p className="mt-1 text-xs text-muted-foreground">
                            This auto-expands the credential rows below to match.
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Buyer Credentials ── */}
            <div className="rounded-lg border border-border bg-muted/30">
                <button
                    type="button"
                    onClick={() => setCredSectionOpen((o) => !o)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                >
                    <div className="flex items-center gap-2">
                        <KeyRound className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold">Buyer Credentials</span>
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                            {filledCreds} / {credentials.length} filled
                        </span>
                    </div>
                    {credSectionOpen ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                </button>

                {credSectionOpen && (
                    <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
                        <div className="flex items-start gap-2 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2">
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                            <p className="text-xs text-amber-700 dark:text-amber-400">
                                These will <strong>only be shown to buyers after a successful purchase</strong>.
                                Enter one credential per row (e.g. <code className="font-mono">username:password</code> or a licence key).
                            </p>
                        </div>

                        <div className="space-y-2">
                            {credentials.map((cred, i) => (
                                <CredentialRow
                                    key={i}
                                    index={i}
                                    value={cred}
                                    onChange={(val) => updateCred(i, val)}
                                    onRemove={() => removeCred(i)}
                                    canRemove={credentials.length > 1}
                                />
                            ))}
                        </div>

                        <div className="flex items-center justify-between pt-1">
                            <button
                                type="button"
                                onClick={addCredRow}
                                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                            >
                                <PlusCircle className="h-3.5 w-3.5" />
                                Add another row
                            </button>
                            <p className="text-xs text-muted-foreground">
                                {qty - filledCreds > 0 ? (
                                    <span className="text-amber-600">{qty - filledCreds} slot(s) still empty</span>
                                ) : (
                                    <span className="text-green-600">All {qty} slot(s) filled ✓</span>
                                )}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Actions ── */}
            <div className="flex justify-end gap-3 border-t border-border pt-4">
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="rounded-md border border-input px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    className="rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                    {loading ? "Saving…" : "Create Product"}
                </button>
            </div>
        </form>
    )
}
