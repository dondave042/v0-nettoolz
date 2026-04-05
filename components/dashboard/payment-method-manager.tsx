'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/dashboard/card'
import { toast } from 'sonner'

interface PaymentMethod {
  id: number
  payment_method_type: string
  display_name: string
  account_identifier?: string
  is_default: boolean
  metadata: Record<string, unknown>
  created_at: string
}

interface PaymentMethodManagerProps {
  onMethodsChange?: (methods: PaymentMethod[]) => void
}

export function PaymentMethodManager({ onMethodsChange }: PaymentMethodManagerProps) {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    display_name: '',
    payment_method_type: 'korapay',
    account_identifier: '',
    is_default: false,
  })

  // Fetch payment methods
  useEffect(() => {
    fetchMethods()
  }, [])

  async function fetchMethods() {
    try {
      setLoading(true)
      const res = await fetch('/api/buyers/payment-methods')
      if (res.ok) {
        const data = await res.json()
        setMethods(data.methods || [])
        if (onMethodsChange) {
          onMethodsChange(data.methods || [])
        }
      } else {
        toast.error('Failed to load payment methods')
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error)
      toast.error('Error loading payment methods')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddOrUpdate(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)

    try {
      if (!formData.display_name.trim()) {
        toast.error('Please enter a display name')
        setSubmitting(false)
        return
      }

      if (editingId) {
        // Update existing
        const res = await fetch(`/api/buyers/payment-methods/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (res.ok) {
          toast.success('Payment method updated')
          await fetchMethods()
          resetForm()
        } else {
          const error = await res.json()
          toast.error(error.error || 'Failed to update payment method')
        }
      } else {
        // Add new
        const res = await fetch('/api/buyers/payment-methods', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (res.ok) {
          toast.success('Payment method added successfully')
          await fetchMethods()
          resetForm()
        } else {
          const error = await res.json()
          toast.error(error.error || 'Failed to add payment method')
        }
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Are you sure you want to delete this payment method?')) return

    try {
      const res = await fetch(`/api/buyers/payment-methods/${id}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        toast.success('Payment method deleted')
        await fetchMethods()
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to delete payment method')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error deleting payment method')
    }
  }

  function editMethod(method: PaymentMethod) {
    setFormData({
      display_name: method.display_name,
      payment_method_type: method.payment_method_type,
      account_identifier: method.account_identifier || '',
      is_default: method.is_default,
    })
    setEditingId(method.id)
    setShowForm(true)
  }

  function resetForm() {
    setFormData({
      display_name: '',
      payment_method_type: 'korapay',
      account_identifier: '',
      is_default: false,
    })
    setEditingId(null)
    setShowForm(false)
  }

  async function setAsDefault(id: number) {
    try {
      const res = await fetch(`/api/buyers/payment-methods/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_default: true }),
      })

      if (res.ok) {
        toast.success('Default payment method updated')
        await fetchMethods()
      } else {
        toast.error('Failed to set as default')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error updating default payment method')
    }
  }

  if (loading) {
    return (
      <Card>
        <div className="p-6 text-center text-muted-foreground">
          Loading payment methods...
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">
            Payment Methods
          </h3>
          {!showForm && (
            <Button
              size="sm"
              onClick={() => setShowForm(true)}
              className="bg-[#38bdf8] hover:bg-[#0ea5e9] text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Method
            </Button>
          )}
        </div>

        {showForm && (
          <div className="border-t pt-6 space-y-4">
            <form onSubmit={handleAddOrUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) =>
                    setFormData({ ...formData, display_name: e.target.value })
                  }
                  placeholder="e.g., My Korapay Account"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#38bdf8]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Payment Method Type
                </label>
                <select
                  value={formData.payment_method_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      payment_method_type: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-[#38bdf8]"
                >
                  <option value="korapay">Korapay</option>
                  <option value="paystack">Paystack</option>
                  <option value="flutterwave">Flutterwave</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Account Identifier (Optional)
                </label>
                <input
                  type="text"
                  value={formData.account_identifier}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      account_identifier: e.target.value,
                    })
                  }
                  placeholder="e.g., Account number or reference"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#38bdf8]"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) =>
                    setFormData({ ...formData, is_default: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <label
                  htmlFor="is_default"
                  className="text-sm font-medium text-foreground cursor-pointer"
                >
                  Set as default payment method
                </label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#38bdf8] hover:bg-[#0ea5e9] text-white"
                >
                  {submitting
                    ? 'Saving...'
                    : editingId
                      ? 'Update Method'
                      : 'Add Method'}
                </Button>
                <Button
                  type="button"
                  onClick={resetForm}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {methods.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>No payment methods added yet</p>
            <p className="text-sm mt-2">Add your first payment method to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {methods.map((method) => (
              <div
                key={method.id}
                className="p-4 border border-border rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">
                        {method.display_name}
                      </p>
                      {method.is_default && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                          <Check className="h-3 w-3" />
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Type: {method.payment_method_type}
                    </p>
                    {method.account_identifier && (
                      <p className="text-sm text-muted-foreground">
                        Account: {method.account_identifier}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Added: {new Date(method.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {!method.is_default && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAsDefault(method.id)}
                        title="Set as default"
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => editMethod(method)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(method.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
