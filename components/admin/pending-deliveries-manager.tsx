'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronDown, Loader2, Search, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/dashboard/card'
import { toast } from 'sonner'

interface PendingDelivery {
  order_id: number
  buyer_id: number
  product_id: number
  total_price: number
  payment_status: string
  payment_confirmed_at: string
  buyer_email: string
  buyer_name: string
  product_name: string
  product_sku: string
  quantity: number
  order_date: string
}

export function PendingDeliveriesManager() {
  const [deliveries, setDeliveries] = useState<PendingDelivery[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<number | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)

  const [formData, setFormData] = useState<Record<number, {
    credentials: string
    delivery_notes: string
  }>>({})

  useEffect(() => {
    fetchDeliveries()
  }, [search, page])

  async function fetchDeliveries() {
    try {
      setLoading(true)
      let url = '/api/admin/deliveries/pending?limit=20&offset=' + (page * 20)
      if (search.trim()) {
        url += '&search=' + encodeURIComponent(search)
      }

      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setDeliveries(data.deliveries || [])
        setTotal(data.pagination?.total || 0)
      } else {
        toast.error('Failed to load pending deliveries')
      }
    } catch (error) {
      console.error('Error fetching deliveries:', error)
      toast.error('Error loading pending deliveries')
    } finally {
      setLoading(false)
    }
  }

  async function handleDeliver(orderId: number) {
    if (!formData[orderId]?.credentials && !formData[orderId]?.delivery_notes) {
      toast.error('Please provide at least credentials or delivery notes')
      return
    }

    setSubmitting(orderId)
    try {
      const credentials = formData[orderId]?.credentials
        ? JSON.parse(formData[orderId].credentials)
        : {}

      const res = await fetch(`/api/admin/deliveries/${orderId}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentials,
          delivery_notes: formData[orderId]?.delivery_notes || null,
        }),
      })

      if (res.ok) {
        toast.success('Product delivered successfully!')
        await fetchDeliveries()
        setExpandedId(null)
        setFormData((prev) => {
          const newData = { ...prev }
          delete newData[orderId]
          return newData
        })
      } else {
        const error = await res.json()
        toast.error(error.error || 'Failed to deliver product')
      }
    } catch (error) {
      console.error('Error delivering product:', error)
      toast.error('Error delivering product')
    } finally {
      setSubmitting(null)
    }
  }

  const totalPages = Math.ceil(total / 20)

  if (loading && deliveries.length === 0) {
    return (
      <Card>
        <div className="p-6 text-center text-muted-foreground">
          Loading pending deliveries...
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Pending Product Deliveries
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {total} order{total !== 1 ? 's' : ''} awaiting product delivery after payment
            </p>
          </div>
          <div className="relative flex-1 min-w-[200px] max-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(0)
              }}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#38bdf8]"
            />
          </div>
        </div>

        {deliveries.length === 0 ? (
          <div className="py-12 text-center">
            <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-foreground font-semibold">All caught up!</p>
            <p className="text-sm text-muted-foreground mt-2">
              There are no pending product deliveries at the moment.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {deliveries.map((delivery) => (
                <div
                  key={delivery.order_id}
                  className="border border-border rounded-lg bg-secondary/30 overflow-hidden"
                >
                  {/* Header */}
                  <button
                    onClick={() =>
                      setExpandedId(
                        expandedId === delivery.order_id ? null : delivery.order_id
                      )
                    }
                    className="w-full p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className="h-5 w-5 text-amber-600" />
                        <p className="font-semibold text-foreground">
                          {delivery.product_name}
                        </p>
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                          Order #{delivery.order_id}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <p>
                          Customer: {delivery.buyer_name} ({delivery.buyer_email})
                        </p>
                        <p>
                          Quantity: {delivery.quantity} | Price: ₦
                          {parseFloat(delivery.total_price).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <ChevronDown
                      className={`h-5 w-5 text-muted-foreground transition-transform ${
                        expandedId === delivery.order_id ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Expanded section */}
                  {expandedId === delivery.order_id && (
                    <div className="border-t border-border p-4 bg-secondary/20 space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Product SKU
                          </p>
                          <p className="font-medium text-foreground">
                            {delivery.product_sku}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">
                            Order Date
                          </p>
                          <p className="font-medium text-foreground">
                            {new Date(delivery.order_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Delivery form */}
                      <div className="space-y-3 border-t border-border pt-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Product Credentials (JSON)
                          </label>
                          <textarea
                            value={formData[delivery.order_id]?.credentials || ''}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                [delivery.order_id]: {
                                  ...prev[delivery.order_id],
                                  credentials: e.target.value,
                                },
                              }))
                            }
                            placeholder='{"username": "user123", "password": "pass123"}'
                            rows={3}
                            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#38bdf8]"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Optional: Paste JSON credentials for the product
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            Delivery Notes
                          </label>
                          <textarea
                            value={formData[delivery.order_id]?.delivery_notes || ''}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                [delivery.order_id]: {
                                  ...prev[delivery.order_id],
                                  delivery_notes: e.target.value,
                                },
                              }))
                            }
                            placeholder="Add any notes about this delivery (optional)"
                            rows={2}
                            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#38bdf8]"
                          />
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={() => handleDeliver(delivery.order_id)}
                            disabled={submitting === delivery.order_id}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          >
                            {submitting === delivery.order_id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Delivering...
                              </>
                            ) : (
                              <>
                                <Check className="mr-2 h-4 w-4" />
                                Mark as Delivered
                              </>
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setExpandedId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4 border-t">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-3 py-2 border border-border rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-secondary"
                >
                  Previous
                </button>
                <span className="text-sm text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(page + 1, totalPages - 1))}
                  disabled={page >= totalPages - 1}
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
