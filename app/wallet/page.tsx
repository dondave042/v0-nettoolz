"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    Plus,
    ArrowUpRight,
    ArrowDownLeft,
    Loader2,
    RefreshCw,
    CreditCard,
} from "lucide-react"

interface Transaction {
    id: string | number
    direction?: "credit" | "debit"
    type?: "credit" | "debit"
    amount: number | string
    note?: string
    status?: string
    reference_id?: string
    created_at: string
}

interface WalletData {
    balance: number
    transactions: Transaction[]
}

function TxRow({ tx }: { tx: Transaction }) {
    const type = tx.direction ?? tx.type ?? "credit"
    const amount = Number(tx.amount)
    const isCredit = type === "credit"
    const date = new Date(tx.created_at)

    return (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5">
            <div
                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${isCredit ? "bg-emerald-500/15" : "bg-destructive/10"
                    }`}
            >
                {isCredit ? (
                    <ArrowDownLeft className="h-4.5 w-4.5 text-emerald-500" />
                ) : (
                    <ArrowUpRight className="h-4.5 w-4.5 text-destructive" />
                )}
            </div>

            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                    {tx.note ?? (isCredit ? "Balance Credit" : "Purchase Debit")}
                </p>
                <p className="text-xs text-muted-foreground">
                    {date.toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}
                    {tx.status && ` · ${tx.status}`}
                </p>
            </div>

            <div className={`text-sm font-semibold flex-shrink-0 ${isCredit ? "text-emerald-500" : "text-destructive"}`}>
                {isCredit ? "+" : "-"}₦{amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </div>
        </div>
    )
}

export default function WalletPage() {
    const router = useRouter()
    const [data, setData] = useState<WalletData | null>(null)
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [topUpAmount, setTopUpAmount] = useState("")
    const [topping, setTopping] = useState(false)

    const load = useCallback(async (silent = false) => {
        if (!silent) setLoading(true)
        else setRefreshing(true)
        try {
            const [balRes, txRes] = await Promise.all([
                fetch("/api/buyers/balance"),
                fetch("/api/transactions"),
            ])

            if (balRes.status === 401 || txRes.status === 401) {
                router.push("/login")
                return
            }

            const balData = balRes.ok ? await balRes.json() : { balance: 0 }
            const txData = txRes.ok ? await txRes.json() : { transactions: [] }

            setData({
                balance: Number(balData.balance ?? 0),
                transactions: txData.transactions ?? txData ?? [],
            })
        } catch {
            toast.error("Failed to load wallet data")
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }, [router])

    useEffect(() => { load() }, [load])

    const handleTopUp = async () => {
        const amount = parseFloat(topUpAmount)
        if (!amount || amount <= 0) {
            toast.error("Enter a valid amount")
            return
        }
        if (amount > 1_000_000) {
            toast.error("Amount exceeds maximum deposit limit")
            return
        }
        setTopping(true)
        try {
            const res = await fetch("/api/deposits", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount }),
            })
            const result = await res.json()
            if (!res.ok) throw new Error(result.error ?? "Top-up failed")
            if (result.checkoutUrl) {
                window.location.href = result.checkoutUrl
            } else {
                toast.success("Top-up initiated")
                setTopUpAmount("")
                load(true)
            }
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Top-up failed")
        } finally {
            setTopping(false)
        }
    }

    const formatPrice = (n: number) =>
        `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`

    const credits = (data?.transactions ?? []).filter((t) => (t.direction ?? t.type) === "credit")
    const debits = (data?.transactions ?? []).filter((t) => (t.direction ?? t.type) === "debit")
    const totalIn = credits.reduce((s, t) => s + Number(t.amount), 0)
    const totalOut = debits.reduce((s, t) => s + Number(t.amount), 0)

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <SiteHeader />

            <main className="flex-1 px-4 py-8">
                <div className="mx-auto max-w-3xl">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Wallet</h1>
                            <p className="mt-1 text-sm text-muted-foreground">Manage your balance and transactions</p>
                        </div>
                        <button
                            onClick={() => load(true)}
                            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                            Refresh
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-24">
                            <Loader2 className="h-8 w-8 animate-spin text-[#38bdf8]" />
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6">
                            {/* Balance Card */}
                            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0c4a6e] to-[#0284c7] p-6 text-white shadow-lg">
                                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/5" />
                                <div className="absolute -bottom-6 right-16 h-24 w-24 rounded-full bg-white/5" />
                                <div className="relative">
                                    <div className="mb-1 flex items-center gap-2 text-[#bae6fd]/70 text-sm">
                                        <Wallet className="h-4 w-4" />
                                        <span>Account Balance</span>
                                    </div>
                                    <p className="text-4xl font-bold tracking-tight">
                                        {formatPrice(data?.balance ?? 0)}
                                    </p>
                                    <p className="mt-1 text-sm text-[#bae6fd]/70">Available for purchases</p>

                                    <div className="mt-5 grid grid-cols-2 gap-3">
                                        <div className="rounded-xl bg-white/10 p-3">
                                            <div className="flex items-center gap-1.5 text-[#bae6fd]/70 text-xs mb-1">
                                                <TrendingUp className="h-3 w-3" />
                                                Total In
                                            </div>
                                            <p className="font-semibold text-sm">{formatPrice(totalIn)}</p>
                                        </div>
                                        <div className="rounded-xl bg-white/10 p-3">
                                            <div className="flex items-center gap-1.5 text-[#bae6fd]/70 text-xs mb-1">
                                                <TrendingDown className="h-3 w-3" />
                                                Total Out
                                            </div>
                                            <p className="font-semibold text-sm">{formatPrice(totalOut)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Top-up Card */}
                            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                                <h2 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
                                    <Plus className="h-4 w-4 text-[#38bdf8]" />
                                    Top Up Balance
                                </h2>

                                {/* Quick amounts */}
                                <div className="mb-3 flex flex-wrap gap-2">
                                    {[500, 1000, 2000, 5000, 10000].map((amt) => (
                                        <button
                                            key={amt}
                                            onClick={() => setTopUpAmount(String(amt))}
                                            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${topUpAmount === String(amt)
                                                    ? "border-[#38bdf8] bg-[#38bdf8]/10 text-[#38bdf8]"
                                                    : "border-border text-muted-foreground hover:border-[#38bdf8]/50 hover:text-foreground"
                                                }`}
                                        >
                                            ₦{amt.toLocaleString()}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">₦</span>
                                        <Input
                                            type="number"
                                            placeholder="Enter amount"
                                            value={topUpAmount}
                                            onChange={(e) => setTopUpAmount(e.target.value)}
                                            className="pl-7"
                                            min={100}
                                            max={1000000}
                                        />
                                    </div>
                                    <Button
                                        onClick={handleTopUp}
                                        disabled={topping || !topUpAmount}
                                        className="gap-2 bg-[#38bdf8] text-white hover:bg-[#0ea5e9]"
                                    >
                                        {topping ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <CreditCard className="h-4 w-4" />
                                        )}
                                        Top Up
                                    </Button>
                                </div>
                                <p className="mt-2 text-xs text-muted-foreground">
                                    Payments powered by Korapay. You&apos;ll be redirected to complete your deposit.
                                </p>
                            </div>

                            {/* Transaction History */}
                            <div className="rounded-2xl border border-border bg-card shadow-sm">
                                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                                    <h2 className="font-semibold text-foreground">Balance Activity</h2>
                                    <span className="text-xs text-muted-foreground">
                                        {data?.transactions.length ?? 0} transaction{data?.transactions.length !== 1 ? "s" : ""}
                                    </span>
                                </div>

                                {(data?.transactions ?? []).length === 0 ? (
                                    <div className="flex flex-col items-center gap-3 py-16 text-center px-4">
                                        <Wallet className="h-10 w-10 text-muted-foreground/30" />
                                        <div>
                                            <p className="font-medium text-foreground">No balance activity yet</p>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Your transactions will appear here once you top up or make a purchase.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2 p-4">
                                        {(data?.transactions ?? []).map((tx) => (
                                            <TxRow key={tx.id} tx={tx} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <SiteFooter />
        </div>
    )
}
