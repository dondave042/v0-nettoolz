import { CheckCircle2, KeyRound, Package, Plus, Trash2 } from "lucide-react"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { Account, Platform, Product } from "../types"

interface UploadProductProps {
    onAddProduct: (product: Product) => Promise<void> | void
}

type CategoryOption = {
    id: number
    name: string
}

const emptyAccount: Omit<Account, "id"> = {
    username: "",
    password: "",
    email: "",
    notes: "",
    status: "available",
}

export default function UploadProduct({ onAddProduct }: UploadProductProps) {
    const [productName, setProductName] = useState("")
    const [category, setCategory] = useState("")
    const [categories, setCategories] = useState<CategoryOption[]>([])
    const [loadingCategories, setLoadingCategories] = useState(true)
    const [showAddCategory, setShowAddCategory] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState("")
    const [addingCategory, setAddingCategory] = useState(false)
    const [platform, setPlatform] = useState<Platform>("instagram")
    const [price, setPrice] = useState("")
    const [description, setDescription] = useState("")
    const [imageUrls, setImageUrls] = useState("")
    const [uploadingImage, setUploadingImage] = useState(false)
    const [uploadError, setUploadError] = useState("")
    const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([])
    const [accounts, setAccounts] = useState<Omit<Account, "id">[]>([{ ...emptyAccount }])
    const [submitted, setSubmitted] = useState(false)

    useEffect(() => {
        fetchCategories()
    }, [])

    async function fetchCategories() {
        setLoadingCategories(true)
        try {
            const response = await fetch("/api/admin/categories", { cache: "no-store" })
            if (!response.ok) {
                throw new Error("Failed to load categories")
            }

            const payload = await response.json()
            const list = Array.isArray(payload) ? payload : []
            const mapped = list
                .map((entry) => ({ id: Number(entry.id), name: String(entry.name || "") }))
                .filter((entry) => Number.isFinite(entry.id) && entry.name)

            setCategories(mapped)
        } catch (error) {
            console.error("[UploadProduct] Failed to load categories:", error)
        } finally {
            setLoadingCategories(false)
        }
    }

    async function handleAddCategory() {
        const trimmed = newCategoryName.trim().toUpperCase()
        if (!trimmed) return

        setAddingCategory(true)
        try {
            const response = await fetch("/api/admin/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: trimmed }),
            })

            const payload = await response.json().catch(() => ({}))
            if (!response.ok) {
                throw new Error(String(payload?.error || "Failed to add category"))
            }

            const created = {
                id: Number(payload.id),
                name: String(payload.name || trimmed),
            }
            setCategories((previous) => {
                const exists = previous.some((entry) => entry.name.toLowerCase() === created.name.toLowerCase())
                return exists ? previous : [...previous, created]
            })
            setCategory(created.name)
            setNewCategoryName("")
            setShowAddCategory(false)
        } catch (error) {
            console.error("[UploadProduct] Failed to add category:", error)
        } finally {
            setAddingCategory(false)
        }
    }

    async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
        const selectedFile = event.target.files?.[0]
        if (!selectedFile) return

        setUploadError("")
        setUploadingImage(true)

        try {
            const payload = new FormData()
            payload.append("file", selectedFile)

            const response = await fetch("/api/admin/products/upload-image", {
                method: "POST",
                body: payload,
            })

            if (!response.ok) {
                const data = await response.json().catch(() => ({}))
                throw new Error(data.error || "Failed to upload image")
            }

            const data = await response.json()
            const uploadedUrl = String(data.url || "")

            if (!uploadedUrl) {
                throw new Error("Upload succeeded but no image URL was returned")
            }

            setUploadedImageUrls((previous) => [...previous, uploadedUrl])
            setImageUrls((previous) => {
                const trimmed = previous.trim()
                return trimmed ? `${trimmed}\n${uploadedUrl}` : uploadedUrl
            })
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to upload image"
            setUploadError(message)
        } finally {
            setUploadingImage(false)
            event.target.value = ""
        }
    }

    function removeImage(urlToRemove: string) {
        setUploadedImageUrls((previous) => previous.filter((url) => url !== urlToRemove))
        setImageUrls((previous) => {
            const remaining = previous
                .split(/\r?\n|,/)
                .map((entry) => entry.trim())
                .filter(Boolean)
                .filter((entry) => entry !== urlToRemove)

            return remaining.join("\n")
        })
    }

    function addAccount() {
        setAccounts((previous) => [...previous, { ...emptyAccount }])
    }

    function removeAccount(index: number) {
        if (accounts.length === 1) return
        setAccounts((previous) => previous.filter((_, currentIndex) => currentIndex !== index))
    }

    function updateAccount(index: number, field: keyof Omit<Account, "id">, value: string) {
        setAccounts((previous) => previous.map((account, currentIndex) => (currentIndex === index ? { ...account, [field]: value } : account)))
    }

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault()

        const parsedImages = imageUrls
            .split(/\r?\n|,/)
            .map((entry) => entry.trim())
            .filter(Boolean)

        const product: Product = {
            id: `${Date.now()}`,
            name: productName,
            category,
            platform,
            price: Number(price || 0),
            quantity: accounts.length,
            description,
            images: parsedImages,
            status: "active",
            createdAt: new Date(),
            updatedAt: new Date(),
            accounts: accounts.map((account, index) => ({ ...account, id: `${Date.now()}-${index}` })),
        }
        try {
            await onAddProduct(product)
            setSubmitted(true)
            setProductName("")
            setCategory("")
            setShowAddCategory(false)
            setNewCategoryName("")
            setPlatform("instagram")
            setPrice("")
            setDescription("")
            setImageUrls("")
            setUploadedImageUrls([])
            setUploadError("")
            setAccounts([{ ...emptyAccount }])
        } catch (error) {
            console.error("[UploadProduct] Failed to add product:", error)
            setSubmitted(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Upload New Product</h1>
                <p className="mt-1 text-slate-400">Add a new product with account credentials to your inventory</p>
            </div>

            {submitted && (
                <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-green-300">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        Product published to the website catalog.
                    </div>
                </div>
            )}

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
                <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20">
                        <Package className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">Basic Information</h2>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <input value={productName} onChange={(event) => setProductName(event.target.value)} placeholder="Product name" className="rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white" required />
                    <div className="space-y-2">
                        <select
                            value={category}
                            onChange={(event) => {
                                if (event.target.value === "__add_new__") {
                                    setShowAddCategory(true)
                                    return
                                }
                                setCategory(event.target.value)
                            }}
                            className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white"
                            required
                            disabled={loadingCategories}
                        >
                            <option value="">{loadingCategories ? "Loading categories..." : "Select category"}</option>
                            {categories.map((entry) => (
                                <option key={entry.id} value={entry.name}>{entry.name}</option>
                            ))}
                            <option value="__add_new__">+ Add more category</option>
                        </select>

                        {showAddCategory && (
                            <div className="flex gap-2">
                                <input
                                    value={newCategoryName}
                                    onChange={(event) => setNewCategoryName(event.target.value)}
                                    placeholder="Enter new category name"
                                    className="flex-1 rounded-xl border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-white"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddCategory}
                                    disabled={addingCategory || !newCategoryName.trim()}
                                    className="rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-3 py-2 text-sm font-medium text-cyan-300 disabled:opacity-60"
                                >
                                    {addingCategory ? "Adding..." : "Add"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAddCategory(false)
                                        setNewCategoryName("")
                                    }}
                                    className="rounded-lg border border-slate-600 bg-slate-800/70 px-3 py-2 text-sm font-medium text-slate-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>
                    <select value={platform} onChange={(event) => setPlatform(event.target.value as Platform)} className="rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white">
                        {(["instagram", "facebook", "twitter", "tiktok", "youtube", "linkedin", "telegram", "other"] as Platform[]).map((entry) => (
                            <option key={entry} value={entry}>{entry}</option>
                        ))}
                    </select>
                    <input value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Price" className="rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white" required />
                    <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" className="rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white md:col-span-2" rows={3} />
                    <textarea
                        value={imageUrls}
                        onChange={(event) => setImageUrls(event.target.value)}
                        placeholder="Photo URLs (comma or newline separated)"
                        className="rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white md:col-span-2"
                        rows={3}
                    />
                    <div className="rounded-xl border border-dashed border-slate-700 bg-slate-800/30 p-4 md:col-span-2">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <p className="text-sm font-medium text-white">Upload Product Image</p>
                                <p className="text-xs text-slate-400">Supported: JPG, PNG, WEBP, GIF (max 5MB)</p>
                            </div>
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-4 py-2 text-sm font-medium text-cyan-300 hover:bg-cyan-500/25">
                                <Plus className="h-4 w-4" />
                                {uploadingImage ? "Uploading..." : "Choose Image"}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    disabled={uploadingImage}
                                />
                            </label>
                        </div>
                        {uploadError && <p className="mt-3 text-sm text-red-300">{uploadError}</p>}
                        {uploadedImageUrls.length > 0 && (
                            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                                {uploadedImageUrls.map((url) => (
                                    <div key={url} className="relative overflow-hidden rounded-lg border border-slate-700 bg-slate-900/50">
                                        <img src={url} alt="Uploaded product" className="h-24 w-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(url)}
                                            className="absolute right-1 top-1 rounded-md bg-slate-950/80 p-1 text-slate-200 hover:text-red-300"
                                            aria-label="Remove uploaded image"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20">
                            <KeyRound className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Account Credentials</h2>
                        </div>
                    </div>
                    <button type="button" onClick={addAccount} className="flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/20 px-4 py-2 text-sm font-medium text-purple-300">
                        <Plus className="h-4 w-4" />
                        Add Account
                    </button>
                </div>
                <div className="space-y-4">
                    {accounts.map((account, index) => (
                        <motion.div key={index} layout className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4">
                            <div className="mb-3 flex items-center justify-between">
                                <span className="text-sm font-medium text-white">Account {index + 1}</span>
                                {accounts.length > 1 && (
                                    <button type="button" onClick={() => removeAccount(index)} className="text-slate-400 hover:text-red-400">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <input value={account.username} onChange={(event) => updateAccount(index, "username", event.target.value)} placeholder="Username" className="rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-white" />
                                <input value={account.password} onChange={(event) => updateAccount(index, "password", event.target.value)} placeholder="Password" className="rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-white" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end">
                <button type="submit" className="rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-6 py-3 font-semibold text-white">
                    Save Product
                </button>
            </div>
        </form>
    )
}