"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatNaira } from "@/lib/currency"

interface AuthBalanceModalProps {
  open: boolean
  title: string
  description: string
  balance: number
  welcomeBonus?: number
  onOpenChange: (open: boolean) => void
}

export function AuthBalanceModal({
  open,
  title,
  description,
  balance,
  welcomeBonus,
  onOpenChange,
}: AuthBalanceModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-6 text-center">
          <p className="text-sm font-medium text-emerald-700">Available balance</p>
          <p className="mt-2 text-4xl font-bold text-foreground">{formatNaira(balance)}</p>
          {typeof welcomeBonus === "number" && welcomeBonus > 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Welcome bonus added: {formatNaira(welcomeBonus)}
            </p>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Redirecting you to your dashboard now.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}