/**
 * Payment Status Utilities
 * Helper functions for managing and displaying payment status
 */

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface PaymentStatusBadge {
  status: PaymentStatus
  label: string
  color: string
  bgColor: string
  textColor: string
  icon: string
}

/**
 * Get display information for a payment status
 */
export function getPaymentStatusBadge(
  status: PaymentStatus | string
): PaymentStatusBadge {
  const normalizedStatus = (status as PaymentStatus) || PaymentStatus.PENDING

  switch (normalizedStatus) {
    case PaymentStatus.COMPLETED:
      return {
        status: PaymentStatus.COMPLETED,
        label: 'Paid',
        color: '#10b981',
        bgColor: '#ecfdf5',
        textColor: '#047857',
        icon: '✓',
      }
    case PaymentStatus.FAILED:
      return {
        status: PaymentStatus.FAILED,
        label: 'Failed',
        color: '#ef4444',
        bgColor: '#fef2f2',
        textColor: '#dc2626',
        icon: '✕',
      }
    case PaymentStatus.CANCELLED:
      return {
        status: PaymentStatus.CANCELLED,
        label: 'Cancelled',
        color: '#f59e0b',
        bgColor: '#fffbeb',
        textColor: '#d97706',
        icon: '○',
      }
    case PaymentStatus.PENDING:
    default:
      return {
        status: PaymentStatus.PENDING,
        label: 'Pending',
        color: '#3b82f6',
        bgColor: '#eff6ff',
        textColor: '#1d4ed8',
        icon: '◐',
      }
  }
}

/**
 * Check if payment is complete (funds received)
 */
export function isPaymentComplete(status: PaymentStatus | string): boolean {
  return (status as PaymentStatus) === PaymentStatus.COMPLETED
}

/**
 * Check if payment is in a terminal state (won't change)
 */
export function isPaymentTerminal(status: PaymentStatus | string): boolean {
  const normalizedStatus = status as PaymentStatus
  return [PaymentStatus.COMPLETED, PaymentStatus.FAILED, PaymentStatus.CANCELLED].includes(
    normalizedStatus
  )
}

/**
 * Format payment reference ID for display
 * Shortens long IDs for better readability
 */
export function formatPaymentReference(reference: string | null | undefined): string {
  if (!reference) return 'N/A'
  
  // Show first 8 and last 4 characters
  if (reference.length > 12) {
    return `${reference.slice(0, 8)}...${reference.slice(-4)}`
  }
  
  return reference
}

/**
 * Get human-readable time until payment expires
 * Korapay payments typically expire in 30 minutes
 */
export function getPaymentExpiryTime(createdAt: Date): {
  expiresAt: Date
  minutesRemaining: number
  isExpired: boolean
} {
  const expiryMinutes = 30
  const expiresAt = new Date(createdAt.getTime() + expiryMinutes * 60000)
  const now = new Date()
  const minutesRemaining = Math.ceil(
    (expiresAt.getTime() - now.getTime()) / 60000
  )
  const isExpired = minutesRemaining <= 0

  return {
    expiresAt,
    minutesRemaining: Math.max(0, minutesRemaining),
    isExpired,
  }
}

/**
 * Get formatted expiry message
 */
export function getExpiryMessage(createdAt: Date): string {
  const { minutesRemaining, isExpired } = getPaymentExpiryTime(createdAt)

  if (isExpired) {
    return 'Payment link has expired'
  }

  if (minutesRemaining === 1) {
    return '1 minute remaining'
  }

  return `${minutesRemaining} minutes remaining`
}

/**
 * Map Korapay event types to internal payment status
 */
export function mapKorapayEventToStatus(
  eventType: string
): PaymentStatus {
  switch (eventType) {
    case 'charge.completed':
      return PaymentStatus.COMPLETED
    case 'charge.failed':
      return PaymentStatus.FAILED
    case 'charge.cancelled':
      return PaymentStatus.CANCELLED
    default:
      return PaymentStatus.PENDING
  }
}

/**
 * Get failure reason from Korapay response
 */
export function getPaymentFailureReason(
  errorMessage?: string | null,
  errorCode?: string | null
): string {
  if (!errorMessage && !errorCode) {
    return 'Payment failed for an unknown reason'
  }

  const reasonMap: Record<string, string> = {
    insufficient_funds: 'Insufficient funds in your account',
    card_declined: 'Your card was declined',
    expired_card: 'Your card has expired',
    invalid_card: 'Invalid card information',
    transaction_not_permitted: 'Transaction not permitted on your card',
    lost_card: 'Card has been reported lost',
    stolen_card: 'Card has been reported stolen',
  }

  if (errorCode && reasonMap[errorCode]) {
    return reasonMap[errorCode]
  }

  return errorMessage || 'Payment processing failed'
}

/**
 * Type guard for PaymentStatus
 */
export function isValidPaymentStatus(value: unknown): value is PaymentStatus {
  return Object.values(PaymentStatus).includes(value as PaymentStatus)
}

/**
 * Get next recommended action based on payment status
 */
export function getNextAction(
  status: PaymentStatus | string
): string | null {
  const normalizedStatus = status as PaymentStatus

  switch (normalizedStatus) {
    case PaymentStatus.PENDING:
      return 'Complete your payment to receive credentials'
    case PaymentStatus.COMPLETED:
      return 'Your credentials are ready to use'
    case PaymentStatus.FAILED:
      return 'Please try again with a different payment method'
    case PaymentStatus.CANCELLED:
      return 'You can restart the payment process'
    default:
      return null
  }
}
