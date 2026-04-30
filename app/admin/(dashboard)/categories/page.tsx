"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Loader2, Check, X, Package, Upload, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

interface Category {
    id: number
    name: string
    description: string | null
    sort_order: number
    icon: string | null
    product_count?: number
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [newName, setNewName] = useState("")
    const [newDescription, setNewDescription] = useState("")
    const [newIcon, setNewIcon] = useState<File | null>(null)
    const [newIconPreview, setNewIconPreview] = useState<string>("")
    const [adding, setAdding] = useState(false)
    const [editId, setEditId] = useState<number | null>(null)
    const [editName, setEditName] = useState("")
    const [editDescription, setEditDescription] = useState("")
    const [editIcon, setEditIcon] = useState<File | null>(null)
    const [editIconPreview, setEditIconPreview] = useState<string>("")
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState<number | null>(null)

    useEffect(() => {
        fetchCategories()
    }, [])

    async function fetchCategories() {
        setLoading(true)
        try {
            const res = await fetch("/api/admin/categories")
            if (res.ok) {
                const data = await res.json()
                setCategories(Array.isArray(data) ? data : [])
            } else {
                toast.error("Failed to load categories")
            }
        } catch {
            toast.error("Failed to load categories")
        } finally {
            setLoading(false)
        }
    }

    function handleIconSelect(file: File | null) {
        if (file) {
            if (!file.type.startsWith("image/")) {
                toast.error("Please select a valid image file")
                return
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Image size must be less than 5MB")
                return
            }
            const reader = new FileReader()
            reader.onloadend = () => {
                setNewIconPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
            setNewIcon(file)
        }
    }

    function handleEditIconSelect(file: File | null) {
        if (file) {
            if (!file.type.startsWith("image/")) {
                toast.error("Please select a valid image file")
                return
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Image size must be less than 5MB")
                return
            }
            const reader = new FileReader()
            reader.onloadend = () => {
                setEditIconPreview(reader.result as string)
            }
            reader.readAsDataURL(file)
            setEditIcon(file)
        }
    }

    function resetForm() {
        setNewName("")
        setNewDescription("")
        setNewIcon(null)
        setNewIconPreview("")
    }

    async function handleAdd() {
        const trimmed = newName.trim()
        if (!trimmed) return
        setAdding(true)
        try {
            const formData = new FormData()
            formData.append("name", trimmed)
            formData.append("description", newDescription.trim() || "")
            if (newIcon) {
                formData.append("icon", newIcon)
            }

            const res = await fetch("/api/admin/categories", {
                method: "POST",
                body: formData,
            })
            const data = await res.json()
            if (!res.ok) {
                toast.error(data.error || "Failed to add category")
                return
            }
            setCategories((prev) => [...prev, data as Category])
            resetForm()
            toast.success(`Category "${(data as Category).name}" added`)
        } catch {
            toast.error("Failed to add category")
        } finally {
            setAdding(false)
        }
    }

    function startEdit(cat: Category) {
        setEditId(cat.id)
        setEditName(cat.name)
        setEditDescription(cat.description || "")
        setEditIconPreview(cat.icon || "")
        setEditIcon(null)
    }

    function cancelEdit() {
        setEditId(null)
        setEditName("")
        setEditDescription("")
        setEditIcon(null)
        setEditIconPreview("")
    }

    async function handleSaveEdit(id: number) {
        const trimmed = editName.trim()
        if (!trimmed) return
        setSaving(true)
        try {
            const formData = new FormData()
            formData.append("id", String(id))
            formData.append("name", trimmed)
            formData.append("description", editDescription.trim() || "")
            if (editIcon) {
                formData.append("icon", editIcon)
            }

            const res = await fetch("/api/admin/categories", {
                method: "PUT",
                body: formData,
            })
            const data = await res.json()
            if (!res.ok) {
                toast.error(data.error || "Failed to update category")
                return
            }
            setCategories((prev) =>
                prev.map((c) => (c.id === id ? (data as Category) : c))
            )
            setEditId(null)
            toast.success("Category updated")
        } catch {
            toast.error("Failed to update category")
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(cat: Category) {
        if (!confirm(`Delete category "${cat.name}"?`)) return
        setDeletingId(cat.id)
        try {
            const res = await fetch("/api/admin/categories", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: cat.id }),
            })
            const data = await res.json()
            if (!res.ok) {
                toast.error(data.error || "Failed to delete category")
                return
            }
            setCategories((prev) => prev.filter((c) => c.id !== cat.id))
            toast.success(`Category "${cat.name}" deleted`)
        } catch {
            toast.error("Failed to delete category")
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <div className="mx-auto max-w-3xl space-y-6 p-6">
            <div>
                <h1 className="text-3xl font-bold text-white">Product Categories</h1>
                <p className="mt-2 text-sm text-sky-300">
                    Create and manage product categories. Default categories are auto-created on first load. Categories must be created before uploading products.
                </p>
            </div>

            {/* Add new category form */}
            <div className="rounded-lg border border-[#075985] bg-[#0c4a6e] p-4 space-y-4">
                <div>
                    <label className="text-sm font-medium text-sky-300">Category Name *</label>
                    <Input
                        placeholder="e.g., Gaming, Electronics, Software…"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                        className="mt-1 bg-[#082f49] border-[#0ea5e9] text-white placeholder:text-sky-400"
                        disabled={adding}
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-sky-300">Description (Optional)</label>
                    <Input
                        placeholder="Describe what products belong in this category…"
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAdd()}
                        className="mt-1 bg-[#082f49] border-[#0ea5e9] text-white placeholder:text-sky-400"
                        disabled={adding}
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-sky-300">Category Icon (Optional)</label>
                    <div className="mt-2 flex items-center gap-3">
                        <label className="relative inline-flex items-center justify-center h-20 w-20 rounded-lg border-2 border-dashed border-[#0ea5e9] bg-[#082f49] cursor-pointer hover:bg-[#0a3a52] transition-colors">
                            {newIconPreview ? (
                                <img
                                    src={newIconPreview}
                                    alt="Icon preview"
                                    className="h-full w-full rounded-lg object-cover"
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center">
                                    <ImageIcon className="h-6 w-6 text-sky-400 mb-1" />
                                    <span className="text-xs text-sky-400">Upload</span>
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleIconSelect(e.target.files?.[0] || null)}
                                className="hidden"
                                disabled={adding}
                            />
                        </label>
                        {newIconPreview && (
                            <button
                                type="button"
                                onClick={() => {
                                    setNewIcon(null)
                                    setNewIconPreview("")
                                }}
                                className="text-sky-400 hover:text-sky-300"
                                disabled={adding}
                            >
                                <X className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                </div>
                <Button
                    onClick={handleAdd}
                    disabled={adding || !newName.trim()}
                    className="w-full bg-sky-600 hover:bg-sky-500 text-white"
                >
                    {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    <span className="ml-2">Create Category</span>
                </Button>
            </div>

            {/* Category list */}
            <div className="rounded-lg border border-[#075985] bg-[#0c4a6e] overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-sky-400" />
                    </div>
                ) : categories.length === 0 ? (
                    <div className="py-12 text-center">
                        <Package className="h-8 w-8 mx-auto mb-3 text-sky-400 opacity-50" />
                        <p className="text-sm text-sky-400">No categories yet. Create one to get started.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-[#075985]">
                        {categories.map((cat) => (
                            <div key={cat.id} className="px-4 py-4 hover:bg-[#082f49] transition-colors">
                                {editId === cat.id ? (
                                    <div className="space-y-3">
                                        <div>
                                            <label className="text-xs font-medium text-sky-300">Name</label>
                                            <Input
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") handleSaveEdit(cat.id)
                                                    if (e.key === "Escape") cancelEdit()
                                                }}
                                                className="mt-1 bg-[#082f49] border-[#0ea5e9] text-white"
                                                autoFocus
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-sky-300">Description</label>
                                            <Input
                                                value={editDescription}
                                                onChange={(e) => setEditDescription(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Escape") cancelEdit()
                                                }}
                                                className="mt-1 bg-[#082f49] border-[#0ea5e9] text-white"
                                                placeholder="Add a description…"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-sky-300">Icon</label>
                                            <div className="mt-2 flex items-center gap-2">
                                                <label className="relative inline-flex items-center justify-center h-16 w-16 rounded-lg border-2 border-dashed border-[#0ea5e9] bg-[#082f49] cursor-pointer hover:bg-[#0a3a52] transition-colors">
                                                    {editIconPreview ? (
                                                        <img
                                                            src={editIconPreview}
                                                            alt="Icon preview"
                                                            className="h-full w-full rounded-lg object-cover"
                                                        />
                                                    ) : (
                                                        <ImageIcon className="h-5 w-5 text-sky-400" />
                                                    )}
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleEditIconSelect(e.target.files?.[0] || null)}
                                                        className="hidden"
                                                        disabled={saving}
                                                    />
                                                </label>
                                                {editIconPreview && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setEditIcon(null)
                                                            setEditIconPreview("")
                                                        }}
                                                        className="text-sky-400 hover:text-sky-300"
                                                        disabled={saving}
                                                    >
                                                        <X className="h-5 w-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 justify-end">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-sky-400 hover:text-sky-300"
                                                onClick={cancelEdit}
                                                disabled={saving}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-500 text-white"
                                                onClick={() => handleSaveEdit(cat.id)}
                                                disabled={saving}
                                            >
                                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                {saving ? " Saving..." : " Save"}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            {cat.icon ? (
                                                <img
                                                    src={cat.icon}
                                                    alt={cat.name}
                                                    className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
                                                />
                                            ) : (
                                                <Package className="h-10 w-10 text-sky-400 flex-shrink-0 p-2 bg-[#082f49] rounded-lg" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <span className="font-medium text-white truncate block">{cat.name}</span>
                                                {cat.description && (
                                                    <p className="mt-1 text-sm text-sky-400 line-clamp-2">{cat.description}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-1 flex-shrink-0">
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="text-sky-400 hover:text-sky-300"
                                                onClick={() => startEdit(cat)}
                                                title="Edit category"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="text-red-400 hover:text-red-300"
                                                onClick={() => handleDelete(cat)}
                                                disabled={deletingId === cat.id}
                                                title="Delete category"
                                            >
                                                {deletingId === cat.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
