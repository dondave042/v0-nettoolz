'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Search, Filter, Eye, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { PaymentDetailsModal } from './payment-details-modal'

interface Transaction {
  id: number
  order_id: number
  buyer_email: string | null
  buyer_name: string | null
  product_name: string | null
  quantity: number
  total_price: string
  payment_status: string
  payment_method_type: string | null
  payment_reference_id: string | null
  created_at: string
  payment_confirmed_at: string | null
  payment_failure_reason: string | null
}

interface Stats {
  total_transactions: number
  completed_count: number
  pending_count: number
  failed_count: number
  cancelled_count: number
  total_revenue: string
  pending_amount: string
}

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
}

export function PaymentsOverview() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [showModal, setShowModal] = useState(false)

  const perPage = 10

  useEffect(() => {
    fetchPayments()
  }, [page, search, status])

  async function fetchPayments() {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
        ...(search && { search }),
        ...(status && { status }),
      })

      const res = await fetch(`/api/admin/payments?${params}`)
      if (res.ok) {
        const data = await res.json()
        setTransactions(data.transactions || [])
        setStats(data.stats || null)
        setTotalPages(data.total_pages || 1)
      } else {
        toast.error('Failed to fetch payments')
      }
    } catch (error) {
      console.error('[v0] Failed to fetch payments:', error)
      toast.error('Failed to load payments')
    } finally {
      setLoading(false)
    }
  }

  function handleViewDetails(transaction: Transaction) {
    setSelectedTransaction(transaction)
    setShowModal(true)
  }

  function formatCurrency(value: string | number) {
    const num = typeof value === 'string' ? parseFloat(value) : value
    return `₦${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <>
      {/* Summary Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground">Total Revenue</p>
          <p className="mt-2 text-2xl font-bold text-green-600">
            {stats ? formatCurrency(stats.total_revenue) : '₦0.00'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {stats?.completed_count || 0} completed
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground">Transactions</p>
          <p className="mt-2 text-2xl font-bold text-[#38bdf8]">
            {stats?.total_transactions || 0}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {stats?.completed_count || 0} successful
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground">Pending Amount</p>
          <p className="mt-2 text-2xl font-bold text-yellow-600">
            {stats ? formatCurrency(stats.pending_amount) : '₦0.00'}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {stats?.pending_count || 0} pending
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs text-muted-foreground">Failed</p>
          <p className="mt-2 text-2xl font-bold text-red-600">
            {stats?.failed_count || 0}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {stats?.cancelled_count || 0} cancelled
          </p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="rounded-xl border border-border bg-card">
        {/* Header with filters */}
        <div className="border-b border-border px-6 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-semibold text-foreground">Payment Transactions</h2>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search order ID, email..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  className="rounded-lg border border-border bg-muted px-3 py-2 pl-9 text-sm text-foreground placeholder-muted-foreground focus:border-[#38bdf8] focus:outline-none"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value)
                    setPage(1)
                  }}
                  className="rounded-lg border border-border bg-muted px-3 py-2 pl-9 text-sm text-foreground focus:border-[#38bdf8] focus:outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[#38bdf8]" />
            </div>
          ) : transactions.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  <th className="px-6 py-3">Order ID</th>
                  <th className="px-6 py-3">Buyer</th>
                  <th className="px-6 py-3">Product</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Method</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-border last:border-0">
                    <td className="px-6 py-3 text-sm font-mono text-foreground">
                      #{tx.order_id}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <div className="text-foreground">{tx.buyer_email || 'N/A'}</div>
                      <div className="text-xs text-muted-foreground">{tx.buyer_name}</div>
                    </td>
                    <td className="px-6 py-3 text-sm text-foreground">
                      <div>{tx.product_name || 'Unknown'}</div>
                      <div className="text-xs text-muted-foreground">Qty: {tx.quantity}</div>
                    </td>
                    <td className="px-6 py-3 text-sm font-medium text-foreground">
                      {formatCurrency(tx.total_price)}
                    </td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">
                      {tx.payment_method_type || 'N/A'}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          STATUS_COLORS[tx.payment_status] ||
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {tx.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-muted-foreground">
                      {formatDate(tx.created_at)}
                    </td>
                    <td className="px-6 py-3 text-center">
                      <button
                        onClick={() => handleViewDetails(tx)}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-[#38bdf8] transition-colors hover:bg-[#38bdf8]/10"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">No transactions found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-t border-border px-6 py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-border bg-muted px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-border disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-border bg-muted px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-border disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedTransaction && (
        <PaymentDetailsModal
          transaction={selectedTransaction}
          onClose={() => {
            setShowModal(false)
            setSelectedTransaction(null)
          }}
          onRefresh={() => fetchPayments()}
        />
      )}
    </>
  )
}
