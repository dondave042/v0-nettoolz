"use client"

import { type FormEvent, useEffect, useState } from 'react'
import { Loader2, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatNaira } from '@/lib/currency'
import { toast } from 'sonner'

type BuyerSuggestion = {
  id: number
  name: string | null
  email: string
  balance: number
}

export function BalanceAdjustmentManager() {
  const [query, setQuery] = useState('')
  const [selectedBuyer, setSelectedBuyer] = useState<BuyerSuggestion | null>(null)
  const [suggestions, setSuggestions] = useState<BuyerSuggestion[]>([])
  const [searching, setSearching] = useState(false)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  async function readJsonSafely(response: Response) {
    const text = await response.text()

    if (!text) {
      return null
    }

    try {
      return JSON.parse(text)
    } catch {
      return null
    }
  }

  useEffect(() => {
    async function searchBuyers() {
      if (query.trim().length < 2 || selectedBuyer?.email === query.trim()) {
        setSuggestions([])
        return
      }

      try {
        setSearching(true)
        const res = await fetch(`/api/admin/buyers/search?query=${encodeURIComponent(query.trim())}`)
        const data = await readJsonSafely(res)

        if (!res.ok) {
          throw new Error((data as { error?: string } | null)?.error || 'Failed to search buyers')
        }

        setSuggestions((data as { buyers?: BuyerSuggestion[] } | null)?.buyers || [])
      } catch (error) {
        console.error('[Balance Adjustment Manager] Buyer search error:', error)
      } finally {
        setSearching(false)
      }
    }

    const timeout = setTimeout(searchBuyers, 200)
    return () => clearTimeout(timeout)
  }, [query, selectedBuyer])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedBuyer) {
      toast.error('Select a buyer from search results first')
      return
    }

    setSaving(true)

    try {
      const res = await fetch('/api/admin/balance-adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: selectedBuyer.email,
          amount: Number(amount),
          reason,
        }),
      })

      const data = await readJsonSafely(res)

      if (!res.ok) {
        throw new Error((data as { error?: string } | null)?.error || 'Failed to create balance adjustment')
      }

      toast.success(
        `Balance updated for ${(data as { buyer: { email: string; balance: number } }).buyer.email}. New balance: ${formatNaira(Number((data as { buyer: { email: string; balance: number } }).buyer.balance))}`
      )
      setQuery('')
      setSelectedBuyer(null)
      setSuggestions([])
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
          <label className="text-sm font-medium text-foreground">Buyer Search</label>
          <input
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setSelectedBuyer(null)
            }}
            required
            placeholder="Search by buyer name or email"
            className="rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-[#38bdf8] focus:outline-none"
          />

          {searching ? (
            <p className="mt-1 text-xs text-muted-foreground">Searching buyers...</p>
          ) : null}

          {suggestions.length > 0 ? (
            <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-border bg-background">
              {suggestions.map((buyer) => (
                <button
                  key={buyer.id}
                  type="button"
                  onClick={() => {
                    setSelectedBuyer(buyer)
                    setQuery(buyer.email)
                    setSuggestions([])
                  }}
                  className="flex w-full items-center justify-between border-b border-border px-3 py-2 text-left last:border-b-0 hover:bg-muted/40"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{buyer.name || 'Unnamed Buyer'}</p>
                    <p className="text-xs text-muted-foreground">{buyer.email}</p>
                  </div>
                  <p className="text-xs font-medium text-foreground">{formatNaira(buyer.balance)}</p>
                </button>
              ))}
            </div>
          ) : null}

          {selectedBuyer ? (
            <p className="mt-1 text-xs text-emerald-600">
              Selected: {selectedBuyer.name || selectedBuyer.email} ({selectedBuyer.email})
            </p>
          ) : query.trim().length >= 2 && !searching ? (
            <p className="mt-1 text-xs text-muted-foreground">No buyers matched your search.</p>
          ) : null}
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