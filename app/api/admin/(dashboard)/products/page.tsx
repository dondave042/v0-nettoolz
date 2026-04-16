// DEPRECATED: This page component should not be under app/api/. DELETE this file.
export default function DeprecatedPage() { return null }
id: number
sku: string
name: string
description: string
price: string
available_qty: number
category_id: number | null
badge: string | null
is_featured: boolean
category_name: string
images: string[] | null
product_username: string | null
product_password: string | null
}

interface Category {
  id: number
  name: string
}

const emptyForm = {
  sku: "",
  name: "",
  description: "",
  price: "",
  available_qty: "0",
  category_id: "",
  badge: "",
  is_featured: false,
  images: [] as string[],
  product_username: "",
  product_password: "",
}

export default function ProductsAdminPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const fetchProducts = useCallback(async () => {
    const res = await fetch("/api/admin/products")
    if (res.ok) setProducts(await res.json())
    setLoading(false)
  }, [])

  const fetchCategories = useCallback(async () => {
    const res = await fetch("/api/admin/categories")
    if (res.ok) setCategories(await res.json())
  }, [])

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [fetchProducts, fetchCategories])

  function openCreate() {
    setForm(emptyForm)
    setEditId(null)
    setShowForm(true)
  }

  function openEdit(p: Product) {
    setForm({
      sku: p.sku,
      name: p.name,
      description: p.description || "",
      price: parseFloat(p.price).toString(),
      available_qty: p.available_qty.toString(),
      category_id: p.category_id?.toString() || "",
      badge: p.badge || "",
      is_featured: p.is_featured,
      images: p.images || [],
      product_username: p.product_username || "",
      product_password: p.product_password || "",
    })
    setEditId(p.id)
    setShowForm(true)
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return

    setUploading(true)
    const newImages: string[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const reader = new FileReader()

        reader.onload = (event) => {
          if (event.target?.result) {
            newImages.push(event.target.result as string)
            if (newImages.length === files.length) {
              setForm({
                ...form,
                images: [...(form.images || []), ...newImages],
              })
              setUploading(false)
            }
          }
        }

        reader.readAsDataURL(file)
      }
    } catch (error) {
      console.error("Upload error:", error)
      toast.error("Failed to upload images")
      setUploading(false)
    }
  }

  function removeImage(index: number) {
    setForm({
      ...form,
      images: form.images?.filter((_, i) => i !== index) || [],
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const method = editId ? "PUT" : "POST"
    const body = editId ? { ...form, id: editId } : form

    try {
      const res = await fetch("/api/admin/products", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error()

      toast.success(editId ? "Product updated!" : "Product created!")
      setShowForm(false)
      fetchProducts()
    } catch {
      toast.error("Failed to save product")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this product?")) return

    try {
      const res = await fetch(`/api/admin/products?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Product deleted!")
      fetchProducts()
    } catch {
      toast.error("Failed to delete product")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#38bdf8]" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-[var(--font-heading)] text-2xl font-bold text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground">Manage your product catalog</p>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-[#38bdf8] text-white hover:bg-[#0ea5e9]">
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">
                {editId ? "Edit Product" : "Add Product"}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">SKU</label>
                  <input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-[#38bdf8] focus:outline-none" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Name</label>
                  <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-[#38bdf8] focus:outline-none" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-muted-foreground">Description</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-[#38bdf8] focus:outline-none" />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Price ($)</label>
                  <input required type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-[#38bdf8] focus:outline-none" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Quantity</label>
                  <input required type="number" min="0" value={form.available_qty} onChange={(e) => setForm({ ...form, available_qty: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-[#38bdf8] focus:outline-none" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Badge</label>
                  <input value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} placeholder="e.g. HOT, NEW" className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-[#38bdf8] focus:outline-none" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">Category</label>
                  <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-[#38bdf8] focus:outline-none">
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end gap-2 pb-1">
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="h-4 w-4 rounded border-border accent-[#38bdf8]" />
                    Featured Product
                  </label>
                </div>
              </div>

              {/* Images Section */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-muted-foreground">Product Images</label>
                <div className="flex flex-col gap-3">
                  {form.images && form.images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {form.images.map((image, index) => (
                        <div key={index} className="relative overflow-hidden rounded-lg border border-border bg-muted">
                          <img src={image} alt={`Product ${index}`} className="h-24 w-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-white hover:bg-destructive/90"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/50 py-4 px-3 text-sm text-muted-foreground hover:border-[#38bdf8] hover:text-foreground transition-colors">
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Click to upload images
                      </>
                    )}
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Credentials Section */}
              <div className="border-t border-border pt-4">
                <h3 className="mb-3 text-sm font-semibold text-foreground">Buyer Credentials</h3>
                <p className="mb-3 text-xs text-muted-foreground">
                  These will only be shown to buyers after successful purchase
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground">Username</label>
                    <input
                      value={form.product_username}
                      onChange={(e) => setForm({ ...form, product_username: e.target.value })}
                      placeholder="e.g. admin"
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-[#38bdf8] focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground">Password</label>
                    <input
                      type="password"
                      value={form.product_password}
                      onChange={(e) => setForm({ ...form, product_password: e.target.value })}
                      placeholder="e.g. secure_password"
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-[#38bdf8] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" disabled={saving} className="gap-2 bg-[#38bdf8] text-white hover:bg-[#0ea5e9]">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editId ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3">SKU</th>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Stock</th>
                <th className="px-5 py-3">Badge</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 text-sm font-mono text-muted-foreground">{p.sku}</td>
                  <td className="px-5 py-3 text-sm font-medium text-foreground">{p.name}</td>
                  <td className="px-5 py-3 text-sm text-muted-foreground">{p.category_name || "-"}</td>
                  <td className="px-5 py-3 text-sm text-foreground">${parseFloat(p.price).toFixed(2)}</td>
                  <td className="px-5 py-3 text-sm text-foreground">{p.available_qty}</td>
                  <td className="px-5 py-3">
                    {p.badge ? (
                      <span className="rounded-full bg-[#e0f2fe] px-2 py-0.5 text-xs font-medium text-[#0284c7]">{p.badge}</span>
                    ) : "-"}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(p)} aria-label="Edit product">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(p.id)} className="text-destructive hover:text-destructive" aria-label="Delete product">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    No products found. Add your first product!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
