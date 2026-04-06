/**
 * Startup Initialization Module
 * Validates payment configuration and other critical setup on app startup
 */

import { initializePaymentConfig } from './payment-config'

let initializationComplete = false
let initializationError: Error | null = null

/**
 * Initialize application configuration
 * Called once when the app starts
 */
export async function initializeApp(): Promise<boolean> {
  if (initializationComplete) {
    if (initializationError) {
      console.warn('[App Init] Initialization failed previously:', initializationError.message)
      return false
    }
    return true
  }

  try {
    console.log('[App Init] Starting application initialization...')

    // Validate payment configuration
    await initializePaymentConfig()

    console.log('[App Init] Payment configuration validated successfully')

    // Additional validations can be added here in the future
    console.log('[App Init] Application initialization completed successfully')
    initializationComplete = true
    return true
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    initializationError = err
    console.error('[App Init] Initialization failed:', err.message)
    return false
  }
}

/**
 * Get the current initialization status
 */
export function isInitialized(): boolean {
  return initializationComplete
}

/**
 * Get any initialization errors
 */
export function getInitializationError(): Error | null {
  return initializationError
}

/**
 * Reset initialization state (mainly for testing)
 */
export function resetInitialization(): void {
  initializationComplete = false
  initializationError = null
}
