"use client"

import { useState } from 'react'
import { Loader2, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatNaira } from '@/lib/currency'
import { toast } from 'sonner'

export function BalanceAdjustmentManager() {
  const [email, setEmail] = useState('')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)

    try {
      const res = await fetch('/api/admin/balance-adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          amount: Number(amount),
          reason,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create balance adjustment')
      }

      toast.success(
        `Balance updated for ${data.buyer.email}. New balance: ${formatNaira(Number(data.buyer.balance))}`
      )
      setEmail('')
      setAmount('')
      setReason('')
    } catch (error) {
      console.error('[Balance Adjustment Manager] Submit error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to update buyer balance')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">Manual Balance Adjustment</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Credit or deduct buyer funds manually. Positive values add balance, negative values deduct it.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">Buyer Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-[#38bdf8] focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">Adjustment Amount</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
            className="rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-[#38bdf8] focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">Reason</label>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Optional reason shown in the buyer transaction timeline"
            className="min-h-24 rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-[#38bdf8] focus:outline-none"
          />
        </div>

        <div className="rounded-lg bg-muted/40 p-4 text-sm text-muted-foreground">
          Transaction preview: <span className="font-semibold text-foreground">{amount ? formatNaira(Math.abs(Number(amount))) : formatNaira(0)}</span>
        </div>

        <Button type="submit" disabled={saving} className="bg-[#38bdf8] text-white hover:bg-[#0ea5e9]">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Wallet className="mr-2 h-4 w-4" />
              Apply Adjustment
            </>
          )}
        </Button>
      </form>
    </div>
  )
}