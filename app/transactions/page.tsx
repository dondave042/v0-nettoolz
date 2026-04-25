"use client"

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDownLeft, ArrowUpRight, Loader2, Wallet } from 'lucide-react'
import { DashboardHeader } from '@/components/dashboard/header'
import { UserHeader } from '@/components/dashboard/user-header'
import { UserSidebar } from '@/components/dashboard/user-sidebar'
import { Card } from '@/components/dashboard/card'
import { formatNaira } from '@/lib/currency'
import { toast } from 'sonner'

interface Transaction {
  id: string
  direction: 'credit' | 'debit'
  type: string
  title: string
  amount: number
  status: string
  reference_id: string | null
  order_id: number | null
  product_name: string | null
  occurred_at: string
}

type TransactionFilters = {
  type: string
  status: string
  dateFrom: string
  dateTo: string
}

type PaginationMeta = {
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export default function TransactionsPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userName, setUserName] = useState('User')
  const [userBalance, setUserBalance] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    pageSize: 20,
    totalCount: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  })
  const [filters, setFilters] = useState<TransactionFilters>({
    type: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: '',
  })

  useEffect(() => {
    setPage(1)
  }, [filters, pageSize])

  const loadTransactions = useCallback(async (silent = false) => {
    try {
      const meRes = await fetch('/api/buyers/me', { cache: 'no-store' })
      if (!meRes.ok) {
        router.push('/login')
        return
      }

      const meData = await meRes.json()
      setUserName(meData.buyer?.name || 'User')
      setUserBalance(Number(meData.buyer?.balance ?? 0))

      const params = new URLSearchParams()
      if (filters.type !== 'all') params.set('type', filters.type)
      if (filters.status !== 'all') params.set('status', filters.status)
      if (filters.dateFrom) params.set('date_from', filters.dateFrom)
      if (filters.dateTo) params.set('date_to', filters.dateTo)
      params.set('page', String(page))
      params.set('page_size', String(pageSize))

      const query = params.toString()
      const transactionsRes = await fetch(`/api/transactions${query ? `?${query}` : ''}`, {
        cache: 'no-store',
      })
      const transactionsData = await transactionsRes.json()

      if (!transactionsRes.ok) {
        throw new Error(transactionsData.error || 'Failed to load transactions')
      }

      setTransactions(transactionsData.transactions || [])
      setPagination(
        transactionsData.pagination || {
          page,
          pageSize,
          totalCount: transactionsData.transactions?.length || 0,
          totalPages: 1,
          hasNextPage: false,
          hasPrevPage: page > 1,
        }
      )
    } catch (error) {
      console.error('[Transactions Page] Load error:', error)
      if (!silent) toast.error('Failed to load transactions')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [filters, page, pageSize, router])

  useEffect(() => {
    loadTransactions()

    const interval = setInterval(() => {
      if (!document.hidden) loadTransactions(true)
    }, 5_000)

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') loadTransactions(true)
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [loadTransactions])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-[#38bdf8]" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <UserHeader onMenuToggle={setSidebarOpen} userName={userName} userBalance={userBalance} />

      <div className="flex flex-1">
        <UserSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          userBalance={userBalance}
        />

        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
            <DashboardHeader
              title="Transactions"
              description="Review balance credits and deductions in one place."
            />

            <Card className="mb-6">
              <div className="grid gap-4 md:grid-cols-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-foreground">Type</label>
                  <select
                    value={filters.type}
                    onChange={(event) => setFilters((current) => ({ ...current, type: event.target.value }))}
                    className="rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-[#38bdf8] focus:outline-none"
                  >
                    <option value="all">All</option>
                    <option value="deposit">Deposits</option>
                    <option value="welcome_bonus">Welcome Bonus</option>
                    <option value="manual_adjustment">Manual Adjustments</option>
                    <option value="purchase">Purchases</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-foreground">Status</label>
                  <select
                    value={filters.status}
                    onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}
                    className="rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-[#38bdf8] focus:outline-none"
                  >
                    <option value="all">All</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-foreground">From</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))}
                    className="rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-[#38bdf8] focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-foreground">To</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))}
                    className="rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-[#38bdf8] focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {transactions.length} of {pagination.totalCount} results
                </p>

                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">Rows</label>
                  <select
                    value={pageSize}
                    onChange={(event) => setPageSize(Number(event.target.value))}
                    className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:border-[#38bdf8] focus:outline-none"
                  >
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                </div>
              </div>
            </Card>

            <Card>
              {transactions.length === 0 ? (
                <div className="py-10 text-center">
                  <Wallet className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No transactions found yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {transactions.map((transaction) => {
                    const isCredit = transaction.direction === 'credit'
                    const Icon = isCredit ? ArrowDownLeft : ArrowUpRight
                    const amountClass = isCredit ? 'text-emerald-600' : 'text-red-600'

                    return (
                      <div key={transaction.id} className="flex items-center justify-between gap-4 py-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${isCredit ? 'bg-emerald-100/40' : 'bg-red-100/40'}`}>
                            <Icon className={`h-4 w-4 ${amountClass}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground">{transaction.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(transaction.occurred_at).toLocaleString()} · {transaction.status}
                            </p>
                            {transaction.reference_id ? (
                              <p className="truncate text-xs text-muted-foreground">Ref: {transaction.reference_id}</p>
                            ) : null}
                          </div>
                        </div>

                        <p className={`flex-shrink-0 text-sm font-bold ${amountClass}`}>
                          {isCredit ? '+' : '-'}{formatNaira(transaction.amount)}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>

            <div className="mt-4 flex items-center justify-between">
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
        </main>
      </div>
    </div>
  )
}