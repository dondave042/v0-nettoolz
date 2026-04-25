'use client'

import { X, Copy, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

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

interface PaymentDetailsModalProps {
  transaction: Transaction
  onClose: () => void
  onRefresh: () => void
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  completed: <CheckCircle className="h-5 w-5 text-green-600" />,
  pending: <Clock className="h-5 w-5 text-yellow-600" />,
  failed: <AlertCircle className="h-5 w-5 text-red-600" />,
  cancelled: <AlertCircle className="h-5 w-5 text-gray-600" />,
}

const STATUS_COLORS: Record<string, string> = {
  completed: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
}

export function PaymentDetailsModal({
  transaction,
  onClose,
  onRefresh,
}: PaymentDetailsModalProps) {
  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text)
    toast.success(`Copied ${label} to clipboard`)
  }

  function formatCurrency(value: string | number) {
    const num = typeof value === 'string' ? parseFloat(value) : value
    return `₦${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/50 sm:items-center">
      <div className="w-full rounded-t-2xl bg-card sm:max-w-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            {STATUS_ICONS[transaction.payment_status]}
            <div>
              <h2 className="font-semibold text-foreground">Payment Details</h2>
              <p className="text-xs text-muted-foreground">Order #{transaction.order_id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-6 py-6 sm:max-h-[70vh]">
          <div className="space-y-6">
            {/* Status Section */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Payment Status</h3>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  STATUS_COLORS[transaction.payment_status] ||
                  'bg-gray-100 text-gray-800'
                }`}
              >
                {transaction.payment_status.charAt(0).toUpperCase() +
                  transaction.payment_status.slice(1)}
              </span>
              {transaction.payment_failure_reason && (
                <p className="mt-2 text-xs text-red-600">
                  Reason: {transaction.payment_failure_reason}
                </p>
              )}
            </div>

            {/* Transaction Info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Order ID</p>
                <div className="mt-1 flex items-center gap-2">
                  <code className="rounded bg-muted px-2 py-1 text-sm font-mono text-foreground">
                    #{transaction.order_id}
                  </code>
                  <button
                    onClick={() =>
                      copyToClipboard(String(transaction.order_id), 'Order ID')
                    }
                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Reference ID</p>
                <div className="mt-1 flex items-center gap-2">
                  <code className="rounded bg-muted px-2 py-1 text-sm font-mono text-foreground">
                    {transaction.payment_reference_id || 'N/A'}
                  </code>
                  {transaction.payment_reference_id && (
                    <button
                      onClick={() =>
                        copyToClipboard(
                          transaction.payment_reference_id!,
                          'Reference ID'
                        )
                      }
                      className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Buyer Info */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Buyer Information</h3>
              <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="text-sm font-medium text-foreground">
                    {transaction.buyer_name || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {transaction.buyer_email || 'N/A'}
                    </p>
                    {transaction.buyer_email && (
                      <button
                        onClick={() =>
                          copyToClipboard(
                            transaction.buyer_email!,
                            'Email'
                          )
                        }
                        className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Product Information</h3>
              <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Product</p>
                  <p className="text-sm font-medium text-foreground">
                    {transaction.product_name || 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Quantity</p>
                  <p className="text-sm font-medium text-foreground">
                    {transaction.quantity}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Payment Information</h3>
              <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="text-lg font-bold text-foreground">
                    {formatCurrency(transaction.total_price)}
                  </p>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="text-sm font-medium text-foreground">
                    {transaction.payment_method_type || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Payment Timeline</h3>
              <div className="space-y-2">
                <div className="flex gap-3 rounded-lg border border-border bg-muted/30 p-4">
                  <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-[#38bdf8]" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-muted-foreground">Created</p>
                    <p className="mt-1 text-sm text-foreground">
                      {formatDate(transaction.created_at)}
                    </p>
                  </div>
                </div>

                {transaction.payment_confirmed_at && (
                  <div className="flex gap-3 rounded-lg border border-green-200 bg-green-50 p-4">
                    <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-green-600" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-green-700">Confirmed</p>
                      <p className="mt-1 text-sm text-green-900">
                        {formatDate(transaction.payment_confirmed_at)}
                      </p>
                    </div>
                  </div>
                )}

                {transaction.payment_status === 'failed' && (
                  <div className="flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
                    <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-red-600" />
                    <div className="flex-1">
                      <p className="text-xs font-medium text-red-700">Failed</p>
                      {transaction.payment_failure_reason && (
                        <p className="mt-1 text-sm text-red-900">
                          {transaction.payment_failure_reason}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4 sm:flex sm:items-center sm:justify-end sm:gap-3">
          <button
            onClick={onClose}
            className="w-full rounded-lg border border-border bg-muted px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-border sm:w-auto"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
