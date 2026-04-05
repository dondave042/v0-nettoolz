'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/dashboard/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/currency'
import { toast } from 'sonner'

interface PaymentHistoryItem {
  order_id: number
  product_id: number
  product_name: string
  product_sku: string
  quantity: number
  total_price: number
  payment_status: string
  payment_method_type: string
  payment_method_name?: string
  payment_confirmed_at?: string
  created_at: string
}

interface PaymentHistoryViewProps {
  limit?: number
}

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'success':
      return 'bg-green-100 text-green-700'
    case 'pending':
      return 'bg-amber-100 text-amber-700'
    case 'failed':
    case 'cancelled':
      return 'bg-red-100 text-red-700'
    default:
      return 'bg-gray-100 text-gray-700'
  }
}

export function PaymentHistoryView({ limit = 10 }: PaymentHistoryViewProps) {
  const [history, setHistory] = useState<PaymentHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchHistory()
  }, [filter, page])

  async function fetchHistory() {
    try {
      setLoading(true)
      let url = `/api/buyers/payment-history?limit=${limit}&offset=${page * limit}`
      if (filter) {
        url += `&status=${filter}`
      }

      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setHistory(data.history || [])
        setTotal(data.pagination?.total || 0)
      } else {
        toast.error('Failed to load payment history')
      }
    } catch (error) {
      console.error('Error fetching payment history:', error)
      toast.error('Error loading payment history')
    } finally {
      setLoading(false)
    }
  }

  const formattedTotal = Math.ceil(total / limit)

  return (
    <Card>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h3 className="text-lg font-semibold text-foreground">
            Payment History
          </h3>
          <div className="flex gap-2 flex-wrap">
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value)
                setPage(0)
              }}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#38bdf8]"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">
            Loading payment history...
          </div>
        ) : history.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>No payment history found</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 overflow-x-auto">
              {history.map((item) => (
                <div
                  key={item.order_id}
                  className="p-4 border border-border rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3 mb-2">
                        <p className="font-semibold text-foreground truncate">
                          {item.product_name}
                        </p>
                        <Badge variant="outline" className="w-fit">
                          Order #{item.order_id}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">SKU</p>
                          <p className="text-foreground">{item.product_sku}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Quantity</p>
                          <p className="text-foreground">{item.quantity}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Amount</p>
                          <p className="text-foreground font-semibold">
                            {formatPrice(item.total_price)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Payment Method
                          </p>
                          <p className="text-foreground text-sm">
                            {item.payment_method_name ||
                              item.payment_method_type}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 mt-3 text-xs text-muted-foreground">
                        <p>
                          Ordered:{' '}
                          {new Date(item.created_at).toLocaleDateString()}
                        </p>
                        {item.payment_confirmed_at && (
                          <p>
                            Confirmed:{' '}
                            {new Date(
                              item.payment_confirmed_at
                            ).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <Badge
                        className={`${getStatusColor(
                          item.payment_status
                        )} text-xs font-semibold px-3 py-1`}
                      >
                        {item.payment_status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {formattedTotal > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4 border-t">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-3 py-2 border border-border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary"
                >
                  Previous
                </button>
                <span className="text-sm text-muted-foreground">
                  Page {page + 1} of {formattedTotal}
                </span>
                <button
                  onClick={() => setPage(Math.min(page + 1, formattedTotal - 1))}
                  disabled={page >= formattedTotal - 1}
                  className="px-3 py-2 border border-border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  )
}
