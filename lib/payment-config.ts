/**
 * Payment Configuration Validator
 * Validates and caches payment-related environment variables
 */

import {
  PaymentErrorCode,
  createPaymentError,
  logPaymentError,
} from './payment-errors'

export interface PaymentConfig {
  korapayApiKeyId: string
  korapayApiKeySecret: string
  korapayWebhookSecret?: string
  korapayApiBaseUrl: string
  korapayCheckoutUrl?: string
  webhookBaseUrl: string
  environment: 'development' | 'production'
}

/**
 * Cache for validated configuration
 */
let cachedConfig: PaymentConfig | null = null
let configValidationError: Error | null = null
let loggedDevFallbackWarning = false

/**
 * Validate required environment variables for payment processing
 */
function normalizeBaseUrl(value: string): string {
  return value.replace(/\/$/, '')
}

function resolveWebhookBaseUrl(): string | undefined {
  return (
    process.env.WEBHOOK_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined)
  )
}

function isProductionEnv(): boolean {
  return process.env.NODE_ENV === 'production'
}

function resolveDevWebhookBaseUrl(): string {
  return normalizeBaseUrl(resolveWebhookBaseUrl() || 'http://localhost:3000')
}

function validateEnvironmentVariables(): Record<string, string | undefined> {
  const requiredVars = {
    KORAPAY_API_KEY_SECRET:
      process.env.KORAPAY_API_KEY_SECRET || process.env.KORAPAY_SECRET_KEY,
    WEBHOOK_BASE_URL: resolveWebhookBaseUrl(),
  }

  const missing = Object.entries(requiredVars)
    .filter(([, value]) => !value)
    .map(([key]) => key)

  if (missing.length > 0) {
    if (!isProductionEnv()) {
      if (!loggedDevFallbackWarning) {
        console.warn(
          `[PaymentConfig] Missing vars in ${process.env.NODE_ENV || 'development'} mode (${missing.join(', ')}). Falling back to safe local defaults.`
        )
        loggedDevFallbackWarning = true
      }

      return {
        KORAPAY_API_KEY_SECRET:
          requiredVars.KORAPAY_API_KEY_SECRET || 'dev_korapay_disabled',
        WEBHOOK_BASE_URL: resolveDevWebhookBaseUrl(),
      }
    }

    const error = createPaymentError(
      PaymentErrorCode.MISSING_ENV_VARS,
      `Missing required environment variables: ${missing.join(', ')}`,
      { missing }
    )
    logPaymentError(error, 'PaymentConfig')
    throw error
  }

  return requiredVars as Record<string, string>
}

export function getKorapayWebhookSecret(): string {
  const webhookSecret = process.env.KORAPAY_WEBHOOK_SECRET

  if (!webhookSecret) {
    const error = createPaymentError(
      PaymentErrorCode.MISSING_ENV_VARS,
      'Missing required environment variables: KORAPAY_WEBHOOK_SECRET',
      { missing: ['KORAPAY_WEBHOOK_SECRET'] }
    )
    logPaymentError(error, 'PaymentConfig')
    throw error
  }

  return webhookSecret
}

/**
 * Get validated payment configuration
 * Caches the config after first validation to minimize overhead
 */
export function getPaymentConfig(): PaymentConfig {
  // Return cached config if available
  if (cachedConfig) {
    return cachedConfig
  }

  // Return cached error if validation previously failed
  if (configValidationError) {
    throw configValidationError
  }

  try {
    const vars = validateEnvironmentVariables()

    cachedConfig = {
      korapayApiKeyId: process.env.KORAPAY_API_KEY_ID || '',
      korapayApiKeySecret: vars.KORAPAY_API_KEY_SECRET,
      korapayWebhookSecret: process.env.KORAPAY_WEBHOOK_SECRET,
      korapayApiBaseUrl: normalizeBaseUrl(
        process.env.KORAPAY_API_BASE_URL ||
        'https://api.korapay.com/merchant/api/v1'
      ),
      korapayCheckoutUrl: process.env.KORAPAY_CHECKOUT_URL,
      webhookBaseUrl: normalizeBaseUrl(vars.WEBHOOK_BASE_URL),
      environment: process.env.NODE_ENV as
        | 'development'
        | 'production',
    }

    return cachedConfig
  } catch (error) {
    if (error instanceof Error) {
      configValidationError = error
    }
    throw error
  }
}

/**
 * Validate payment amount
 */
export function validatePaymentAmount(
  amount: unknown,
  minAmount: number = 100,
  maxAmount: number = 10000000
): number {
  if (
    typeof amount !== 'number' ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    const error = createPaymentError(
      PaymentErrorCode.INVALID_AMOUNT,
      `Invalid payment amount: ${amount}`,
      { amount }
    )
    logPaymentError(error, 'PaymentValidation')
    throw error
  }

  if (amount < minAmount || amount > maxAmount) {
    const error = createPaymentError(
      PaymentErrorCode.INVALID_AMOUNT,
      `Payment amount ${amount} is outside allowed range (${minAmount} - ${maxAmount})`,
      { amount, minAmount, maxAmount }
    )
    logPaymentError(error, 'PaymentValidation')
    throw error
  }

  return amount
}

/**
 * Validate currency code
 */
export function validateCurrency(currency: unknown): string {
  const validCurrencies = ['NGN', 'USD', 'GHS', 'KES', 'ZAR', 'TZS']

  if (typeof currency !== 'string' || !validCurrencies.includes(currency)) {
    const error = createPaymentError(
      PaymentErrorCode.INVALID_CURRENCY,
      `Invalid currency: ${currency}. Supported currencies: ${validCurrencies.join(', ')}`,
      { currency, validCurrencies }
    )
    logPaymentError(error, 'PaymentValidation')
    throw error
  }

  return currency
}

/**
 * Validate email address
 */
export function validateEmail(email: unknown): string {
  if (typeof email !== 'string') {
    const error = createPaymentError(
      PaymentErrorCode.MISSING_REQUIRED_FIELDS,
      'Email must be a string',
      { email }
    )
    logPaymentError(error, 'PaymentValidation')
    throw error
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    const error = createPaymentError(
      PaymentErrorCode.MISSING_REQUIRED_FIELDS,
      `Invalid email format: ${email}`,
      { email }
    )
    logPaymentError(error, 'PaymentValidation')
    throw error
  }

  return email.toLowerCase().trim()
}

/**
 * Validate payment webhook signature
 * Uses HMAC-SHA256
 */
export async function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const messageBuffer = encoder.encode(payload)
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, messageBuffer)

    // Convert signature buffer to hex string
    const hashArray = Array.from(new Uint8Array(signatureBuffer))
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

    // Compare with provided signature
    return hashHex === signature
  } catch (error) {
    logPaymentError(error, 'WebhookSignatureValidation')
    throw createPaymentError(
      PaymentErrorCode.WEBHOOK_VALIDATION_FAILED,
      'Failed to validate webhook signature',
      { error: error instanceof Error ? error.message : String(error) }
    )
  }
}

/**
 * Initialize payment configuration on application startup
 * Should be called in a layout.tsx or during app initialization
 */
export async function initializePaymentConfig(): Promise<void> {
  try {
    getPaymentConfig()
    console.log('[Payment] Configuration validated successfully')
  } catch (error) {
    console.error('[Payment] Configuration validation failed:', error)
    throw error
  }
}
