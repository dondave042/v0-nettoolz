'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CreditCard, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface PaymentMethod {
  id: number
  name: string
  type: string
  is_active: boolean
  sort_order: number
}

export function PaymentMethodCard() {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPaymentMethods()
  }, [])

  async function fetchPaymentMethods() {
    try {
      const res = await fetch('/api/admin/payment-methods')
      if (res.ok) {
        const data = await res.json()
        setMethods((data.methods || []).slice(0, 3)) // Show only first 3
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error)
    } finally {
      setLoading(false)
    }
  }

  async function togglePaymentMethod(id: number, is_active: boolean) {
    try {
      const res = await fetch(`/api/admin/payment-methods/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !is_active }),
      })

      if (res.ok) {
        setMethods(methods.map(m => m.id === id ? { ...m, is_active: !is_active } : m))
        toast.success(is_active ? 'Payment method disabled' : 'Payment method enabled')
      } else {
        toast.error('Failed to update payment method')
      }
    } catch (error) {
      console.error('Error updating payment method:', error)
      toast.error('Error updating payment method')
    }
  }

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Payment Methods</h2>
        </div>
        <Link
          href="/admin/payment-methods"
          className="text-xs text-primary hover:underline"
        >
          Manage All
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : methods.length > 0 ? (
        <div className="space-y-2">
          {methods.map(method => (
            <div
              key={method.id}
              className="flex items-center justify-between rounded-md border border-border/50 bg-muted/30 p-3"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{method.name}</p>
                <p className="text-xs text-muted-foreground">{method.type}</p>
              </div>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={method.is_active}
                  onChange={() => togglePaymentMethod(method.id, method.is_active)}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
                <span className="text-xs">{method.is_active ? 'Active' : 'Inactive'}</span>
              </label>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <p className="text-sm text-muted-foreground">No payment methods configured</p>
          <Link
            href="/admin/payment-methods"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Plus className="h-3 w-3" />
            Add Payment Method
          </Link>
        </div>
      )}
    </div>
  )
}
