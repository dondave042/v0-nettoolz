import { Loader2, PlusCircle, RefreshCcw, Tags } from "lucide-react"
import { motion } from "framer-motion"
import { useCallback, useEffect, useState } from "react"

type Category = {
    id: number
    name: string
    slug?: string | null
    description?: string | null
    icon?: string | null
    sort_order?: number | null
}

const defaultFormState = {
    name: "",
    slug: "",
    description: "",
    icon: "",
    sortOrder: "",
}

function slugify(value: string) {
    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
}

export default function CategoriesTable() {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState(defaultFormState)
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)

    const loadCategories = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch("/api/admin/categories", { cache: "no-store" })
            const data = await res.json()
            if (!res.ok) {
                throw new Error(data?.error || "Failed to load categories")
            }
            setCategories(Array.isArray(data) ? data : [])
        } catch (loadError) {
            setCategories([])
            setError(loadError instanceof Error ? loadError.message : "Failed to load categories")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadCategories()
    }, [loadCategories])

    async function handleCreate(event: React.FormEvent) {
        event.preventDefault()
        const name = form.name.trim()
        if (!name) {
            setFeedback({ type: "error", message: "Category name is required." })
            return
        }

        const slug = (form.slug || "").trim() || slugify(name)
        const description = form.description.trim()
        const icon = form.icon.trim()
        const sortOrderValue = form.sortOrder.trim()
        const sortOrder = sortOrderValue === "" ? null : Number.parseInt(sortOrderValue, 10)

        if (sortOrderValue !== "" && Number.isNaN(sortOrder)) {
            setFeedback({ type: "error", message: "Sort order must be a number." })
            return
        }

        setSaving(true)
        setFeedback(null)
        try {
            const res = await fetch("/api/admin/categories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name,
                    slug,
                    description: description || null,
                    icon: icon || null,
                    sort_order: sortOrder,
                }),
            })
            const data = await res.json()
            if (!res.ok) {
                throw new Error(data?.error || "Failed to create category")
            }
            setForm(defaultFormState)
            setFeedback({ type: "success", message: `Category "${data?.name || name}" created.` })
            loadCategories()
        } catch (saveError) {
            setFeedback({
                type: "error",
                message: saveError instanceof Error ? saveError.message : "Failed to create category",
            })
        } finally {
            setSaving(false)
        }
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Categories</h1>
                    <p className="mt-1 text-slate-400">Organize products by category and keep the catalog tidy.</p>
                </div>
                <button
                    type="button"
                    onClick={loadCategories}
                    className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
                >
                    <RefreshCcw className="h-4 w-4" />
                    Refresh
                </button>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20">
                        <Tags className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">Create Category</h2>
                        <p className="text-sm text-slate-500">Add new categories for the product upload flow.</p>
                    </div>
                </div>
                <form onSubmit={handleCreate} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <input
                            value={form.name}
                            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                            placeholder="Category name"
                            className="rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white placeholder:text-slate-500"
                            required
                        />
                        <input
                            value={form.slug}
                            onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
                            placeholder="Slug (optional)"
                            className="rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white placeholder:text-slate-500"
                        />
                        <input
                            value={form.icon}
                            onChange={(event) => setForm((prev) => ({ ...prev, icon: event.target.value }))}
                            placeholder="Icon name (e.g. Users, Play)"
                            className="rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white placeholder:text-slate-500"
                        />
                        <input
                            value={form.sortOrder}
                            onChange={(event) => setForm((prev) => ({ ...prev, sortOrder: event.target.value }))}
                            placeholder="Sort order (optional)"
                            className="rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white placeholder:text-slate-500"
                        />
                    </div>
                    <textarea
                        value={form.description}
                        onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                        placeholder="Description (optional)"
                        className="min-h-[110px] rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white placeholder:text-slate-500"
                    />

                    {feedback && (
                        <div
                            className={`rounded-xl border px-4 py-3 text-sm ${feedback.type === "success"
                                ? "border-green-500/20 bg-green-500/10 text-green-300"
                                : "border-red-500/20 bg-red-500/10 text-red-300"
                                }`}
                        >
                            {feedback.message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-cyan-500/40 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
                        {saving ? "Creating..." : "Create Category"}
                    </button>
                </form>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-white">Existing Categories</h2>
                        <p className="text-sm text-slate-500">These categories appear in product selection.</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
                    </div>
                ) : error ? (
                    <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>
                ) : categories.length === 0 ? (
                    <p className="py-6 text-center text-sm text-slate-500">No categories found yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                                    <th className="px-4 py-3 font-semibold">Name</th>
                                    <th className="px-4 py-3 font-semibold">Slug</th>
                                    <th className="px-4 py-3 font-semibold">Description</th>
                                    <th className="px-4 py-3 font-semibold">Icon</th>
                                    <th className="px-4 py-3 font-semibold">Sort</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                                {categories.map((category) => (
                                    <tr key={category.id} className="hover:bg-slate-800/30">
                                        <td className="px-4 py-3 font-medium text-white">{category.name}</td>
                                        <td className="px-4 py-3 text-slate-300">{category.slug || "—"}</td>
                                        <td className="px-4 py-3 text-slate-400">{category.description || "—"}</td>
                                        <td className="px-4 py-3 text-slate-300">{category.icon || "—"}</td>
                                        <td className="px-4 py-3 text-slate-300">{category.sort_order ?? "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </motion.div>
    )
}
