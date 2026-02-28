"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface PaymentMethod {
  id: number
  name: string
  description: string | null
  is_active: boolean
  created_at: string
}

const emptyForm = {
  name: "",
  description: "",
  is_active: true,
}

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchMethods()
  }, [])

  async function fetchMethods() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/payment-methods")
      if (res.ok) {
        const data = await res.json()
        setMethods(data.methods || [])
      }
    } catch (error) {
      console.error("Fetch error:", error)
      toast.error("Failed to load payment methods")
    } finally {
      setLoading(false)
    }
  }

  function openAdd() {
    setForm(emptyForm)
    setEditId(null)
    setShowForm(true)
  }

  function openEdit(m: PaymentMethod) {
    setForm({
      name: m.name,
      description: m.description || "",
      is_active: m.is_active,
    })
    setEditId(m.id)
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const method = editId ? "PUT" : "POST"
      const body = editId ? { ...form, id: editId } : form

      const res = await fetch("/api/admin/payment-methods", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        toast.success(editId ? "Payment method updated" : "Payment method created")
        setShowForm(false)
        fetchMethods()
      } else {
        const error = await res.json()
        toast.error(error.error || "Failed to save")
      }
    } catch (error) {
      console.error("Save error:", error)
      toast.error("Failed to save payment method")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Are you sure?")) return

    try {
      const res = await fetch("/api/admin/payment-methods", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })

      if (res.ok) {
        toast.success("Payment method deleted")
        fetchMethods()
      } else {
        toast.error("Failed to delete")
      }
    } catch (error) {
      console.error("Delete error:", error)
      toast.error("Failed to delete")
    }
  }

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
          <h1 className="text-2xl font-bold text-foreground">Payment Methods</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure payment options for buyers
          </p>
        </div>
        <Button
          onClick={openAdd}
          className="gap-2 bg-[#38bdf8] text-white hover:bg-[#0ea5e9]"
        >
          <Plus className="h-4 w-4" />
          Add Method
        </Button>
      </div>

      {/* Methods List */}
      <div className="grid gap-3">
        {methods.length === 0 ? (
          <div className="rounded-lg border border-border bg-muted/50 p-8 text-center">
            <p className="text-muted-foreground">No payment methods configured</p>
          </div>
        ) : (
          methods.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
            >
              <div className="flex-1">
                <h3 className="font-medium text-foreground">{m.name}</h3>
                {m.description && (
                  <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    m.is_active
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {m.is_active ? "Active" : "Inactive"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEdit(m)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(m.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {editId ? "Edit Payment Method" : "New Payment Method"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-foreground">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Stripe, Bank Transfer"
                  required
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-[#38bdf8] focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-foreground">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional description for buyers"
                  rows={3}
                  className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-[#38bdf8] focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="h-4 w-4 rounded border-border accent-[#38bdf8]"
                />
                Active
              </label>

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[#38bdf8] text-white hover:bg-[#0ea5e9]"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save"
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
