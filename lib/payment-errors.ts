/**
 * Payment Error Handling System
 * Provides structured error classes and utilities for payment-related errors
 */

export enum PaymentErrorCode {
  // Configuration errors
  MISSING_ENV_VARS = 'MISSING_ENV_VARS',
  INVALID_CONFIG = 'INVALID_CONFIG',

  // Payment processing errors
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_CANCELLED = 'PAYMENT_CANCELLED',
  INVALID_PAYMENT_STATUS = 'INVALID_PAYMENT_STATUS',

  // Validation errors
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  INVALID_CURRENCY = 'INVALID_CURRENCY',
  MISSING_REQUIRED_FIELDS = 'MISSING_REQUIRED_FIELDS',

  // Webhook errors
  WEBHOOK_VALIDATION_FAILED = 'WEBHOOK_VALIDATION_FAILED',
  WEBHOOK_PROCESSING_FAILED = 'WEBHOOK_PROCESSING_FAILED',
  DUPLICATE_WEBHOOK = 'DUPLICATE_WEBHOOK',

  // Order/Inventory errors
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  INSUFFICIENT_INVENTORY = 'INSUFFICIENT_INVENTORY',
  INSUFFICIENT_CREDENTIALS = 'INSUFFICIENT_CREDENTIALS',

  // Integration errors
  KORAPAY_API_ERROR = 'KORAPAY_API_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',

  // Authorization errors
  UNAUTHORIZED = 'UNAUTHORIZED',
}

export class PaymentError extends Error {
  code: PaymentErrorCode
  statusCode: number
  userMessage: string
  retryable: boolean
  metadata?: Record<string, any>

  constructor(
    code: PaymentErrorCode,
    message: string,
    userMessage: string,
    statusCode: number = 500,
    retryable: boolean = false,
    metadata?: Record<string, any>
  ) {
    super(message)
    this.name = 'PaymentError'
    this.code = code
    this.statusCode = statusCode
    this.userMessage = userMessage
    this.retryable = retryable
    this.metadata = metadata

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, PaymentError.prototype)
  }
}

/**
 * Error message mapping for user-facing messages
 */
export const ERROR_MESSAGES: Record<PaymentErrorCode, string> = {
  [PaymentErrorCode.MISSING_ENV_VARS]:
    'Payment service is not properly configured. Please try again later.',
  [PaymentErrorCode.INVALID_CONFIG]:
    'Payment service configuration is invalid. Please try again later.',
  [PaymentErrorCode.PAYMENT_FAILED]:
    'Your payment failed. Please check your payment details and try again.',
  [PaymentErrorCode.PAYMENT_CANCELLED]:
    'Your payment was cancelled. Please try again if you wish to complete the purchase.',
  [PaymentErrorCode.INVALID_PAYMENT_STATUS]:
    'Unable to update payment status. Please contact support.',
  [PaymentErrorCode.INVALID_AMOUNT]:
    'Invalid payment amount. Please try again.',
  [PaymentErrorCode.INVALID_CURRENCY]:
    'Invalid currency selected. Please try again.',
  [PaymentErrorCode.MISSING_REQUIRED_FIELDS]:
    'Missing required information. Please fill in all fields.',
  [PaymentErrorCode.WEBHOOK_VALIDATION_FAILED]:
    'Payment verification failed. Please contact support.',
  [PaymentErrorCode.WEBHOOK_PROCESSING_FAILED]:
    'Failed to process your payment. Please contact support.',
  [PaymentErrorCode.DUPLICATE_WEBHOOK]:
    'Payment already processed. Please check your order status.',
  [PaymentErrorCode.ORDER_NOT_FOUND]:
    'Order not found. Please check your order ID.',
  [PaymentErrorCode.INSUFFICIENT_INVENTORY]:
    'Not enough inventory available. Please reduce the quantity.',
  [PaymentErrorCode.INSUFFICIENT_CREDENTIALS]:
    'Not enough credentials available. Please try again later.',
  [PaymentErrorCode.KORAPAY_API_ERROR]:
    'Payment gateway error. Please try again later.',
  [PaymentErrorCode.DATABASE_ERROR]:
    'Database error occurred. Please try again later.',
  [PaymentErrorCode.UNAUTHORIZED]:
    'Unauthorized access. Please log in and try again.',
}

/**
 * HTTP status code mapping for error codes
 */
export const ERROR_STATUS_CODES: Record<PaymentErrorCode, number> = {
  [PaymentErrorCode.MISSING_ENV_VARS]: 500,
  [PaymentErrorCode.INVALID_CONFIG]: 500,
  [PaymentErrorCode.PAYMENT_FAILED]: 400,
  [PaymentErrorCode.PAYMENT_CANCELLED]: 400,
  [PaymentErrorCode.INVALID_PAYMENT_STATUS]: 400,
  [PaymentErrorCode.INVALID_AMOUNT]: 400,
  [PaymentErrorCode.INVALID_CURRENCY]: 400,
  [PaymentErrorCode.MISSING_REQUIRED_FIELDS]: 400,
  [PaymentErrorCode.WEBHOOK_VALIDATION_FAILED]: 401,
  [PaymentErrorCode.WEBHOOK_PROCESSING_FAILED]: 500,
  [PaymentErrorCode.DUPLICATE_WEBHOOK]: 409,
  [PaymentErrorCode.ORDER_NOT_FOUND]: 404,
  [PaymentErrorCode.INSUFFICIENT_INVENTORY]: 400,
  [PaymentErrorCode.INSUFFICIENT_CREDENTIALS]: 400,
  [PaymentErrorCode.KORAPAY_API_ERROR]: 502,
  [PaymentErrorCode.DATABASE_ERROR]: 500,
  [PaymentErrorCode.UNAUTHORIZED]: 401,
}

/**
 * Retryable error codes
 */
export const RETRYABLE_ERRORS = new Set<PaymentErrorCode>([
  PaymentErrorCode.WEBHOOK_PROCESSING_FAILED,
  PaymentErrorCode.DATABASE_ERROR,
  PaymentErrorCode.KORAPAY_API_ERROR,
])

/**
 * Create a PaymentError with sensible defaults
 */
export function createPaymentError(
  code: PaymentErrorCode,
  message: string,
  metadata?: Record<string, any>
): PaymentError {
  const statusCode = ERROR_STATUS_CODES[code]
  const userMessage = ERROR_MESSAGES[code]
  const retryable = RETRYABLE_ERRORS.has(code)

  return new PaymentError(
    code,
    message,
    userMessage,
    statusCode,
    retryable,
    metadata
  )
}

/**
 * Type guard to check if error is a PaymentError
 */
export function isPaymentError(error: unknown): error is PaymentError {
  return error instanceof PaymentError
}

/**
 * Safe error logging that doesn't expose sensitive data
 */
export function logPaymentError(error: unknown, context?: string): void {
  const timestamp = new Date().toISOString()
  const contextStr = context ? `[${context}] ` : ''

  if (isPaymentError(error)) {
    console.error(
      `${contextStr}[${timestamp}] PaymentError(${error.code}): ${error.message}`,
      error.metadata
    )
  } else if (error instanceof Error) {
    console.error(
      `${contextStr}[${timestamp}] Error: ${error.message}`,
      error.stack
    )
  } else {
    console.error(`${contextStr}[${timestamp}] Unknown error:`, error)
  }
}
