"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Loader2, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

interface Category {
    id: number
    name: string
    sort_order: number
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [newName, setNewName] = useState("")
    const [adding, setAdding] = useState(false)
    const [editId, setEditId] = useState<number | null>(null)
    const [editName, setEditName] = useState("")
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

    async function handleAdd() {
        const trimmed = newName.trim()
        if (!trimmed) return
        setAdding(true)
        try {
            const res = await fetch("/api/admin/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: trimmed }),
            })
            const data = await res.json()
            if (!res.ok) {
                toast.error(data.error || "Failed to add category")
                return
            }
            setCategories((prev) => [...prev, data as Category])
            setNewName("")
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
    }

    function cancelEdit() {
        setEditId(null)
        setEditName("")
    }

    async function handleSaveEdit(id: number) {
        const trimmed = editName.trim()
        if (!trimmed) return
        setSaving(true)
        try {
            const res = await fetch("/api/admin/categories", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, name: trimmed }),
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
        <div className="mx-auto max-w-2xl space-y-6 p-6">
            <div>
                <h1 className="text-2xl font-bold text-white">Categories</h1>
                <p className="mt-1 text-sm text-sky-300">
                    Manage product categories. Default categories are auto-created on first load.
                </p>
            </div>

            {/* Add new category */}
            <div className="flex gap-2">
                <Input
                    placeholder="New category name…"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    className="bg-[#0c4a6e] border-[#075985] text-white placeholder:text-sky-400"
                    disabled={adding}
                />
                <Button
                    onClick={handleAdd}
                    disabled={adding || !newName.trim()}
                    className="bg-sky-600 hover:bg-sky-500 text-white shrink-0"
                >
                    {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    <span className="ml-1">Add</span>
                </Button>
            </div>

            {/* Category list */}
            <div className="rounded-lg border border-[#075985] bg-[#0c4a6e] overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-sky-400" />
                    </div>
                ) : categories.length === 0 ? (
                    <p className="py-10 text-center text-sm text-sky-400">No categories yet.</p>
                ) : (
                    <ul className="divide-y divide-[#075985]">
                        {categories.map((cat) => (
                            <li key={cat.id} className="flex items-center gap-3 px-4 py-3">
                                {editId === cat.id ? (
                                    <>
                                        <Input
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") handleSaveEdit(cat.id)
                                                if (e.key === "Escape") cancelEdit()
                                            }}
                                            className="flex-1 bg-[#082f49] border-[#0ea5e9] text-white"
                                            autoFocus
                                        />
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="text-green-400 hover:text-green-300"
                                            onClick={() => handleSaveEdit(cat.id)}
                                            disabled={saving}
                                        >
                                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="text-sky-400 hover:text-sky-300"
                                            onClick={cancelEdit}
                                            disabled={saving}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <span className="flex-1 font-medium text-white">{cat.name}</span>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="text-sky-400 hover:text-sky-300"
                                            onClick={() => startEdit(cat)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="text-red-400 hover:text-red-300"
                                            onClick={() => handleDelete(cat)}
                                            disabled={deletingId === cat.id}
                                        >
                                            {deletingId === cat.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    )
}
