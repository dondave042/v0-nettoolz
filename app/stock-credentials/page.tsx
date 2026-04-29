"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2, Eye, EyeOff, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { toast } from "sonner"

interface Stock {
  id: number
  name: string
  symbol: string
  price: number
  category: string
}

interface CredentialPair {
  stockId: number
  username: string
  password: string
}

interface StockWithCredentials extends Stock {
  credentials: CredentialPair[]
}

// Mock stock data - in production, this would come from an API
const mockStocks: Stock[] = [
  { id: 1, name: "Apple Inc", symbol: "AAPL", price: 150.25, category: "Technology" },
  { id: 2, name: "Microsoft Corporation", symbol: "MSFT", price: 380.45, category: "Technology" },
  { id: 3, name: "Tesla Inc", symbol: "TSLA", price: 242.84, category: "Automotive" },
  { id: 4, name: "Amazon.com Inc", symbol: "AMZN", price: 175.99, category: "E-commerce" },
  { id: 5, name: "Nvidia Corporation", symbol: "NVDA", price: 875.30, category: "Technology" },
]

export default function StockCredentialsPage() {
  const [stocksWithCredentials, setStocksWithCredentials] = useState<StockWithCredentials[]>([])
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({})
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({})

  // Initialize stocks with empty credential pairs
  useEffect(() => {
    const initialized = mockStocks.map((stock) => ({
      ...stock,
      credentials: [{ stockId: stock.id, username: "", password: "" }],
    }))
    setStocksWithCredentials(initialized)
  }, [])

  const addCredentialRow = (stockId: number) => {
    setStocksWithCredentials((prev) =>
      prev.map((stock) =>
        stock.id === stockId
          ? {
              ...stock,
              credentials: [
                ...stock.credentials,
                { stockId, username: "", password: "" },
              ],
            }
          : stock
      )
    )
    // Clear any existing validation error for this stock
    setValidationErrors((prev) => {
      const updated = { ...prev }
      delete updated[`stock-${stockId}`]
      return updated
    })
  }

  const removeCredentialRow = (stockId: number, index: number) => {
    setStocksWithCredentials((prev) =>
      prev.map((stock) =>
        stock.id === stockId
          ? {
              ...stock,
              credentials: stock.credentials.filter((_, i) => i !== index),
            }
          : stock
      )
    )
  }

  const updateCredential = (
    stockId: number,
    index: number,
    field: "username" | "password",
    value: string
  ) => {
    setStocksWithCredentials((prev) =>
      prev.map((stock) =>
        stock.id === stockId
          ? {
              ...stock,
              credentials: stock.credentials.map((cred, i) =>
                i === index ? { ...cred, [field]: value } : cred
              ),
            }
          : stock
      )
    )
  }

  const validateStockCredentials = (stock: StockWithCredentials): boolean => {
    const hasAnyFilled = stock.credentials.some(
      (c) => c.username.trim() || c.password.trim()
    )

    if (!hasAnyFilled) {
      return true // Empty is valid
    }

    const allFilled = stock.credentials.every(
      (c) => c.username.trim() && c.password.trim()
    )

    if (!allFilled) {
      setValidationErrors((prev) => ({
        ...prev,
        [`stock-${stock.id}`]: "All credential fields must be filled or all empty",
      }))
      return false
    }

    return true
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all stocks
    const newErrors: { [key: string]: string } = {}
    let hasErrors = false

    stocksWithCredentials.forEach((stock) => {
      if (!validateStockCredentials(stock)) {
        hasErrors = true
      }
    })

    if (hasErrors) {
      toast.error("Please complete all credential fields")
      return
    }

    // Collect all valid credentials
    const allCredentials = stocksWithCredentials.flatMap((stock) =>
      stock.credentials
        .filter((c) => c.username.trim() && c.password.trim())
        .map((c) => ({
          stockSymbol: stock.symbol,
          stockName: stock.name,
          username: c.username,
          password: c.password,
        }))
    )

    console.log("[v0] Submitting credentials:", allCredentials)
    console.log("[v0] Total stocks with credentials:", allCredentials.length)

    // In production, send to API
    toast.success(
      `Submitted credentials for ${new Set(allCredentials.map((c) => c.stockSymbol)).size} stocks`
    )
  }

  const getCredentialCountInfo = () => {
    const totalStocks = stocksWithCredentials.length
    const stocksWithCreds = stocksWithCredentials.filter((s) =>
      s.credentials.some((c) => c.username.trim() || c.password.trim())
    ).length
    const totalCredentials = stocksWithCredentials.reduce(
      (sum, s) =>
        sum +
        s.credentials.filter((c) => c.username.trim() && c.password.trim()).length,
      0
    )

    return { totalStocks, stocksWithCreds, totalCredentials }
  }

  const { totalStocks, stocksWithCreds, totalCredentials } = getCredentialCountInfo()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-6xl px-4 py-12">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">
              Stock Credentials Manager
            </h1>
            <p className="mt-2 text-muted-foreground">
              Dynamically assign credentials to each stock. The credential count automatically
              syncs with the number of displayed stocks.
            </p>
          </div>

          {/* Stats */}
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Total Stocks</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{totalStocks}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Stocks with Credentials</p>
              <p className="mt-2 text-3xl font-bold text-primary">{stocksWithCreds}</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-muted-foreground">Total Credential Pairs</p>
              <p className="mt-2 text-3xl font-bold text-accent-foreground">
                {totalCredentials}
              </p>
            </div>
          </div>

          {/* Info Alert */}
          <div className="mb-8 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/30 dark:bg-blue-900/20">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-semibold">Dynamic Synchronization</p>
                <p className="mt-1">
                  Each stock automatically gets its own credential input section. The total number
                  of credential pairs will match the number of stocks displayed.
                </p>
              </div>
            </div>
          </div>

          {/* Stocks Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {stocksWithCredentials.map((stock) => {
              const filledCreds = stock.credentials.filter(
                (c) => c.username.trim() || c.password.trim()
              ).length
              const error = validationErrors[`stock-${stock.id}`]

              return (
                <div
                  key={stock.id}
                  className="overflow-hidden rounded-lg border border-border bg-card"
                >
                  {/* Stock Header */}
                  <div className="border-b border-border bg-muted/50 px-6 py-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-baseline gap-3">
                          <h3 className="text-lg font-semibold text-foreground">
                            {stock.name}
                          </h3>
                          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                            {stock.symbol}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          ${stock.price.toFixed(2)} • {stock.category}
                        </p>
                      </div>
                      <div className="flex gap-2 rounded-full bg-accent/10 px-4 py-2">
                        <span className="text-sm font-medium text-accent-foreground">
                          {filledCreds} of {stock.credentials.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Credentials Section */}
                  <div className="space-y-4 px-6 py-4">
                    {error && (
                      <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
                        <p className="text-sm text-destructive">{error}</p>
                      </div>
                    )}

                    <div className="space-y-3">
                      {stock.credentials.map((cred, index) => {
                        const credKey = `${stock.id}-${index}`
                        const showPassword = showPasswords[credKey]
                        const isFilled = cred.username.trim() || cred.password.trim()

                        return (
                          <div
                            key={index}
                            className={`flex flex-col gap-3 rounded-lg border border-border/50 bg-muted/30 p-4 sm:flex-row sm:items-end sm:gap-2 ${
                              isFilled ? "ring-1 ring-primary/20" : ""
                            }`}
                          >
                            {/* Index Badge */}
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-medium text-primary">
                              {index + 1}
                            </div>

                            {/* Username Input */}
                            <div className="flex-1">
                              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                Username
                              </label>
                              <input
                                type="text"
                                value={cred.username}
                                onChange={(e) =>
                                  updateCredential(
                                    stock.id,
                                    index,
                                    "username",
                                    e.target.value
                                  )
                                }
                                placeholder="Enter username"
                                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                              />
                            </div>

                            {/* Password Input */}
                            <div className="flex-1">
                              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                                Password
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type={showPassword ? "text" : "password"}
                                  value={cred.password}
                                  onChange={(e) =>
                                    updateCredential(
                                      stock.id,
                                      index,
                                      "password",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Enter password"
                                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowPasswords((prev) => ({
                                      ...prev,
                                      [credKey]: !showPassword,
                                    }))
                                  }
                                  className="flex items-center justify-center rounded-lg border border-border bg-background px-3 text-muted-foreground hover:bg-muted hover:text-foreground"
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Delete Button */}
                            {stock.credentials.length > 1 && (
                              <button
                                type="button"
                                onClick={() =>
                                  removeCredentialRow(stock.id, index)
                                }
                                className="flex h-10 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/10 px-3 hover:bg-destructive/20"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </button>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Add Credential Row Button */}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addCredentialRow(stock.id)}
                      className="w-full gap-2 border-dashed"
                    >
                      <Plus className="h-4 w-4" />
                      Add Another Credential Pair
                    </Button>
                  </div>
                </div>
              )
            })}

            {/* Summary */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-6">
              <h3 className="text-lg font-semibold text-foreground">Summary</h3>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Stocks Listed</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">{totalStocks}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Credentials to Submit</p>
                  <p className="mt-1 text-2xl font-bold text-primary">{totalCredentials}</p>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                {totalCredentials === totalStocks
                  ? "✓ Credential count matches stock count perfectly"
                  : `Note: You have ${totalCredentials} credentials for ${totalStocks} stocks`}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="submit"
                className="flex-1 gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Submit All Credentials
              </Button>
              <Button
                type="reset"
                variant="outline"
                className="flex-1"
              >
                Clear Form
              </Button>
            </div>
          </form>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
