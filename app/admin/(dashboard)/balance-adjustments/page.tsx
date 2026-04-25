"use client"

import { useEffect, useState } from 'react'
import { DashboardHeader } from '@/components/dashboard/header'
import { Card } from '@/components/dashboard/card'
import { formatNaira } from '@/lib/currency'
import { Loader2, MinusCircle, PlusCircle } from 'lucide-react'
import { toast } from 'sonner'

type Adjustment = {
  id: number
  amount: number
  reason: string | null
  admin_email: string | null
  created_at: string
  buyer: {
    id: number
    name: string | null
    email: string
    balance: number
  }
}

type PaginationMeta = {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export default function AdminBalanceAdjustmentsPage() {
  const [adjustments, setAdjustments] = useState<Adjustment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  })

  useEffect(() => {
    async function loadAdjustments() {
      try {
        const params = new URLSearchParams({
          page: String(page),
          page_size: '20',
        })

        if (search.trim()) {
          params.set('search', search.trim())
        }

        const res = await fetch(`/api/admin/balance-adjustments?${params.toString()}`)
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'Failed to load adjustments')
        }

        setAdjustments(data.adjustments || [])
        setPagination(
          data.pagination || {
            page,
            pageSize: 20,
            totalCount: data.adjustments?.length || 0,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: page > 1,
          }
        )
      } catch (error) {
        console.error('[Admin Balance Adjustments Page] Load error:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to load balance adjustments')
      } finally {
        setLoading(false)
      }
    }

    loadAdjustments()
  }, [page, search])

  useEffect(() => {
    setPage(1)
  }, [search])

  return (
    <div className="space-y-6">
      <DashboardHeader
        title="Balance Adjustments"
        description="Review manual credits and deductions across all buyers."
      />

      <Card>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="w-full max-w-md">
            <label className="mb-1 block text-sm font-medium text-foreground">Search</label>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Filter by buyer name, buyer email, or admin email"
              className="w-full rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-[#38bdf8] focus:outline-none"
            />
          </div>

          <p className="text-sm text-muted-foreground">
            Showing {adjustments.length} of {pagination.totalCount} adjustments
          </p>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-[#38bdf8]" />
          </div>
        ) : adjustments.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No balance adjustments found.</p>
        ) : (
          <div className="divide-y divide-border">
            {adjustments.map((entry) => {
              const isCredit = entry.amount >= 0

              return (
                <div key={entry.id} className="flex flex-col gap-3 py-4 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {entry.buyer.name || 'Unnamed Buyer'} ({entry.buyer.email})
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.reason || 'Manual balance adjustment'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      By {entry.admin_email || 'Unknown admin'} · {new Date(entry.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <p className="text-xs text-muted-foreground">Buyer balance: {formatNaira(entry.buyer.balance)}</p>
                    <p className={`flex items-center gap-1 text-sm font-bold ${isCredit ? 'text-emerald-600' : 'text-red-600'}`}>
                      {isCredit ? <PlusCircle className="h-4 w-4" /> : <MinusCircle className="h-4 w-4" />}
                      {isCredit ? '+' : '-'}{formatNaira(Math.abs(entry.amount))}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {pagination.page} of {pagination.totalPages}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={!pagination.hasPrevPage}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => setPage((current) => current + 1)}
            disabled={!pagination.hasNextPage}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}