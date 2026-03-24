'use client'

import { useEffect, useState } from 'react'
import { initializeApp, isInitialized, getInitializationError } from '@/lib/startup-init'

/**
 * App Initializer Component
 * Handles payment configuration validation on app startup
 */
export function AppInitializer({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false)
  const [initError, setInitError] = useState<string | null>(null)

  useEffect(() => {
    // Initialize app configuration
    const init = async () => {
      if (isInitialized()) {
        setInitialized(true)
        const error = getInitializationError()
        if (error) {
          setInitError(error.message)
        }
        return
      }

      const success = await initializeApp()
      setInitialized(true)

      if (!success) {
        const error = getInitializationError()
        if (error) {
          setInitError(error.message)
          console.error('[AppInitializer] Initialization error:', error.message)
        }
      }
    }

    init()
  }, [])

  // If there's an initialization error, we can still render the app
  // but log warnings in console and to monitoring services
  if (initError) {
    console.error('[AppInitializer] App initialized with errors:', initError)
    // In production, you might want to send this to error tracking service
  }

  return <>{children}</>
}
