"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Loader2, X, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface Credential {
  id: number
  product_id: number
  username: string
  password: string
  assigned_to_buyer_id: number | null
  created_at: string
}

interface Product {
  id: number
  name: string
  available_qty: number
}

const emptyForm = {
  product_id: "",
  credentials: [{ username: "", password: "" }],
}

async function getErrorMessage(response: Response, fallbackMessage: string) {
  const responseText = await response.text()
  if (!responseText) return fallbackMessage
  try {
    const parsed = JSON.parse(responseText) as { error?: unknown }
    return typeof parsed.error === "string" && parsed.error ? parsed.error : fallbackMessage
  } catch {
    return fallbackMessage
  }
}

export default function CredentialsInventoryPage() {
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [filterProductId, setFilterProductId] = useState("")
  const [showPasswords, setShowPasswords] = useState<{ [key: number]: boolean }>({})

  useEffect(() => {
    fetchData()
  }, [filterProductId])

  async function fetchData() {
    setLoading(true)
    try {
      const [credsRes, productsRes] = await Promise.all([
        fetch(`/api/admin/credentials-inventory${filterProductId ? `?product_id=${filterProductId}` : ""}`),
        fetch("/api/admin/products"),
      ])

      if (credsRes.ok) {
        const data = await credsRes.json()
        setCredentials(data.inventory || [])
      }

      if (productsRes.ok) {
        const data = await productsRes.json()
        setProducts(Array.isArray(data) ? data : (data.products || []))
      }
    } catch (error) {
      console.error("Fetch error:", error)
      toast.error("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  function openAdd() {
    setForm(emptyForm)
    setShowForm(true)
  }

  function addCredentialRow() {
    setForm({ ...form, credentials: [...form.credentials, { username: "", password: "" }] })
  }

  function removeCredentialRow(index: number) {
    setForm({ ...form, credentials: form.credentials.filter((_, i) => i !== index) })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (!form.product_id) {
        toast.error("Please select a product")
        return
      }
      const validCredentials = form.credentials.filter((c) => c.username && c.password)
      if (validCredentials.length === 0) {
        toast.error("Add at least one credential")
        return
      }
      const res = await fetch("/api/admin/credentials-inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: parseInt(form.product_id), credentials: validCredentials }),
      })
      if (res.ok) {
        const data = await res.json()
        toast.success(`Added ${data.count} credentials`)
        setShowForm(false)
        fetchData()
      } else {
        toast.error(await getErrorMessage(res, "Failed to add credentials"))
      }
    } catch (error) {
      console.error("Save error:", error)
      toast.error("Failed to add credentials")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this credential?")) return
    try {
      const res = await fetch("/api/admin/credentials-inventory", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (res.ok) {
        toast.success("Credential deleted")
        fetchData()
      } else {
        toast.error(await getErrorMessage(res, "Failed to delete"))
      }
    } catch (error) {
      console.error("Delete error:", error)
      toast.error("Failed to delete")
    }
  }

  // Group credentials by product, sorted by product name then created_at
  const filteredCredentials = filterProductId
    ? credentials.filter((c) => c.product_id === parseInt(filterProductId))
    : credentials

  const productGroups: { product: Product | undefined; creds: Credential[] }[] = []
  const seen = new Map<number, Credential[]>()

  for (const cred of filteredCredentials) {
    if (!seen.has(cred.product_id)) seen.set(cred.product_id, [])
    seen.get(cred.product_id)!.push(cred)
  }

  for (const [pid, creds] of seen.entries()) {
    const product = products.find((p) => p.id === pid)
    const sorted = [...creds].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    productGroups.push({ product, creds: sorted })
  }
  productGroups.sort((a, b) => (a.product?.name ?? "").localeCompare(b.product?.name ?? ""))

  const totalAll = filteredCredentials.length
  const assignedAll = filteredCredentials.filter((c) => c.assigned_to_buyer_id !== null).length
  const availableAll = totalAll - assignedAll

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-[#38bdf8]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Credentials Inventory</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage buyer credentials distribution
          </p>
        </div>
        <Button onClick={openAdd} className="gap-2 bg-[#38bdf8] text-white hover:bg-[#0ea5e9]">
          <Plus className="h-4 w-4" />
          Add Credentials
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Credentials</p>
          <p className="mt-2 text-2xl font-bold text-foreground">{totalAll}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Available</p>
          <p className="mt-2 text-2xl font-bold text-green-600">{availableAll}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Assigned</p>
          <p className="mt-2 text-2xl font-bold text-blue-600">{assignedAll}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="text-sm font-medium text-foreground">Filter by product:</label>
        <select
          value={filterProductId}
          onChange={(e) => setFilterProductId(e.target.value)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-[#38bdf8] focus:outline-none"
        >
          <option value="">All Products</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Credentials Table — grouped by product */}
      {productGroups.length === 0 ? (
        <div className="rounded-lg border border-border bg-card py-12 text-center text-sm text-muted-foreground">
          No credentials found
        </div>
      ) : (
        <div className="space-y-6">
          {productGroups.map(({ product, creds }) => {
            const groupAssigned = creds.filter((c) => c.assigned_to_buyer_id !== null).length
            const groupAvailable = creds.length - groupAssigned

            return (
              <div key={product?.id ?? "unknown"} className="overflow-hidden rounded-lg border border-border">
                {/* Product header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted px-4 py-3">
                  <span className="font-semibold text-foreground">
                    {product?.name ?? "Unknown Product"}
                  </span>
                  <div className="flex gap-3 text-xs">
                    <span className="rounded-full bg-card px-2 py-1 text-muted-foreground">
                      Total: <strong>{creds.length}</strong>
                    </span>
                    <span className="rounded-full bg-green-100 px-2 py-1 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      Available: <strong>{groupAvailable}</strong>
                    </span>
                    <span className="rounded-full bg-blue-100 px-2 py-1 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                      Assigned: <strong>{groupAssigned}</strong>
                    </span>
                  </div>
                </div>

                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/50">
                    <tr>
                      <th className="w-12 px-4 py-2 text-center font-medium text-muted-foreground">#</th>
                      <th className="px-4 py-2 text-left font-medium text-foreground">Username</th>
                      <th className="px-4 py-2 text-left font-medium text-foreground">Password</th>
                      <th className="px-4 py-2 text-left font-medium text-foreground">Status</th>
                      <th className="px-4 py-2 text-left font-medium text-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {creds.map((cred, index) => {
                      const showPassword = showPasswords[cred.id]
                      const isAssigned = cred.assigned_to_buyer_id !== null
                      return (
                        <tr
                          key={cred.id}
                          className={`border-b border-border last:border-0 ${isAssigned ? "opacity-60" : "hover:bg-muted/40"}`}
                        >
                          <td className="px-4 py-3 text-center text-muted-foreground font-mono">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3 font-mono text-foreground">{cred.username}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <code className="font-mono text-foreground">
                                {showPassword ? cred.password : "•".repeat(Math.min(cred.password.length, 12))}
                              </code>
                              <button
                                onClick={() =>
                                  setShowPasswords({ ...showPasswords, [cred.id]: !showPassword })
                                }
                                className="text-muted-foreground hover:text-foreground"
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${isAssigned
                                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                }`}
                            >
                              {isAssigned ? "Assigned" : "Available"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {!isAssigned && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(cred.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Credentials Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Add Credentials</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-foreground">Product</label>
                <select
                  value={form.product_id}
                  onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                  required
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-[#38bdf8] focus:outline-none"
                >
                  <option value="">Select a product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Credentials</label>
                  <Button type="button" variant="outline" size="sm" onClick={addCredentialRow}>
                    <Plus className="mr-2 h-3 w-3" />
                    Add Row
                  </Button>
                </div>

                {form.credentials.map((cred, index) => (
                  <div key={index} className="flex gap-2">
                    <span className="flex h-9 w-7 shrink-0 items-center justify-center text-xs text-muted-foreground">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={cred.username}
                      onChange={(e) => {
                        const newCreds = [...form.credentials]
                        newCreds[index].username = e.target.value
                        setForm({ ...form, credentials: newCreds })
                      }}
                      placeholder="Username"
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-[#38bdf8] focus:outline-none"
                    />
                    <input
                      type="password"
                      value={cred.password}
                      onChange={(e) => {
                        const newCreds = [...form.credentials]
                        newCreds[index].password = e.target.value
                        setForm({ ...form, credentials: newCreds })
                      }}
                      placeholder="Password"
                      className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-[#38bdf8] focus:outline-none"
                    />
                    {form.credentials.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeCredentialRow(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[#38bdf8] text-white hover:bg-[#0ea5e9]"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Credentials"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
