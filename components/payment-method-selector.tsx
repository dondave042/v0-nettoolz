"use client"

import { useEffect, useState } from "react"
import { Check, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface PaymentMethod {
  id: number
  name: string
  type: string
  config: Record<string, unknown> | null
  is_active: boolean
  sort_order: number
}

interface PaymentMethodSelectorProps {
  onSelect: (methodId: number, methodType: string) => void
  selectedMethodId?: number
}

export function PaymentMethodSelector({
  onSelect,
  selectedMethodId,
}: PaymentMethodSelectorProps) {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const res = await fetch("/api/payment-methods")
        if (!res.ok) throw new Error("Failed to fetch payment methods")
        const data = await res.json()
        setMethods(data.methods || [])
        // Auto-select first method if none selected
        if (data.methods && data.methods.length > 0 && !selectedMethodId) {
          onSelect(data.methods[0].id, data.methods[0].type)
        }
      } catch (error) {
        console.error("[v0] Failed to fetch payment methods:", error)
        toast.error("Failed to load payment methods")
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentMethods()
  }, [onSelect, selectedMethodId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-[#38bdf8]" />
      </div>
    )
  }

  if (!methods || methods.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-border bg-secondary/30 p-8 text-center">
        <p className="text-muted-foreground">No payment methods available at the moment</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-foreground">Select a Payment Method</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {methods.map((method) => {
          const isSelected = selectedMethodId === method.id
          const displayName = method.config?.displayName || method.name
          const description = method.config?.description || `Pay using ${method.name}`
          
          return (
            <button
              key={method.id}
              onClick={() => onSelect(method.id, method.type)}
              className={`relative rounded-lg border-2 p-6 text-left transition-all hover:border-[#38bdf8] hover:shadow-md ${
                isSelected
                  ? "border-[#38bdf8] bg-[#38bdf8]/10 shadow-md"
                  : "border-border bg-card hover:bg-secondary/50"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{displayName}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                </div>
                {isSelected && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#38bdf8] text-white">
                    <Check className="h-4 w-4" />
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
