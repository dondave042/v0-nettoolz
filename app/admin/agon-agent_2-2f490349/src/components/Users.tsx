"use client"

import { AlertCircle, CheckCircle2, Loader2, MinusCircle, PlusCircle, Search, UserCircle2 } from "lucide-react"
import { motion } from "framer-motion"
import { useCallback, useEffect, useRef, useState } from "react"

type Buyer = {
    id: number
    name: string | null
    email: string
    balance: number
}

type Adjustment = {
    id: number
    amount: number
    reason: string | null
    admin_email: string | null
    created_at: string
    buyer: {
        id: number
        name: string | null
        email: string
        balance: number
    }
}

function formatNaira(amount: number) {
    return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function Users() {
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<Buyer[]>([])
    const [searching, setSearching] = useState(false)
    const [selected, setSelected] = useState<Buyer | null>(null)

    const [amount, setAmount] = useState("")
    const [reason, setReason] = useState("")
    const [adjusting, setAdjusting] = useState(false)
    const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)

    const [recentAdjustments, setRecentAdjustments] = useState<Adjustment[]>([])
    const [loadingHistory, setLoadingHistory] = useState(false)

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const searchBuyers = useCallback(async (q: string) => {
        if (q.trim().length < 2) {
            setResults([])
            return
        }
        setSearching(true)
        try {
            const res = await fetch(`/api/admin/buyers/search?query=${encodeURIComponent(q.trim())}`)
            const data = await res.json()
            setResults(Array.isArray(data.buyers) ? data.buyers : [])
        } catch {
            setResults([])
        } finally {
            setSearching(false)
        }
    }, [])

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => searchBuyers(query), 300)
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [query, searchBuyers])

    const loadHistory = useCallback(async () => {
        setLoadingHistory(true)
        try {
            const res = await fetch("/api/admin/balance-adjustments?page=1&page_size=10")
            const data = await res.json()
            setRecentAdjustments(Array.isArray(data.adjustments) ? data.adjustments : [])
        } catch {
            setRecentAdjustments([])
        } finally {
            setLoadingHistory(false)
        }
    }, [])

    useEffect(() => {
        loadHistory()
    }, [loadHistory])

    function selectBuyer(buyer: Buyer) {
        setSelected(buyer)
        setQuery(buyer.email)
        setResults([])
        setAmount("")
        setReason("")
        setFeedback(null)
    }

    async function handleAdjust(event: React.FormEvent) {
        event.preventDefault()
        if (!selected) return
        const parsedAmount = Number(amount)
        if (!Number.isFinite(parsedAmount) || parsedAmount === 0) {
            setFeedback({ type: "error", message: "Enter a non-zero amount (negative to deduct)." })
            return
        }
        setAdjusting(true)
        setFeedback(null)
        try {
            const res = await fetch("/api/admin/balance-adjustments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: selected.email, amount: parsedAmount, reason: reason.trim() || null }),
            })
            const data = await res.json()
            if (!res.ok) {
                throw new Error(data.error || "Failed to adjust balance")
            }
            const newBalance = data.buyer?.balance ?? selected.balance + parsedAmount
            setSelected({ ...selected, balance: newBalance })
            setAmount("")
            setReason("")
            setFeedback({
                type: "success",
                message: `Balance updated to ${formatNaira(newBalance)} (${parsedAmount >= 0 ? "+" : ""}${formatNaira(parsedAmount)})`,
            })
            loadHistory()
        } catch (error) {
            setFeedback({ type: "error", message: error instanceof Error ? error.message : "Unknown error" })
        } finally {
            setAdjusting(false)
        }
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-4xl space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Users & Balances</h1>
                <p className="mt-1 text-slate-400">Search for a buyer and manually adjust their wallet balance.</p>
            </div>

            {/* Search */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20">
                        <Search className="h-5 w-5 text-cyan-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-white">Find Buyer</h2>
                </div>

                <div className="relative">
                    <input
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value)
                            setSelected(null)
                            setFeedback(null)
                        }}
                        placeholder="Search by email or name…"
                        className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                    />
                    {searching && (
                        <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
                    )}
                </div>

                {results.length > 0 && (
                    <ul className="mt-2 overflow-hidden rounded-xl border border-slate-700 bg-slate-800">
                        {results.map((buyer) => (
                            <li key={buyer.id}>
                                <button
                                    type="button"
                                    onClick={() => selectBuyer(buyer)}
                                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-700"
                                >
                                    <div className="flex items-center gap-3">
                                        <UserCircle2 className="h-5 w-5 text-slate-400" />
                                        <div>
                                            <p className="text-sm font-medium text-white">{buyer.name || buyer.email}</p>
                                            {buyer.name && <p className="text-xs text-slate-400">{buyer.email}</p>}
                                        </div>
                                    </div>
                                    <span className="text-sm font-semibold text-cyan-400">{formatNaira(buyer.balance)}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Balance Adjustment Form */}
            {selected && (
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm"
                >
                    <div className="mb-5 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20">
                            <UserCircle2 className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">
                                {selected.name || selected.email}
                            </h2>
                            {selected.name && <p className="text-xs text-slate-400">{selected.email}</p>}
                        </div>
                        <div className="ml-auto rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-center">
                            <p className="text-xs text-slate-400">Current Balance</p>
                            <p className="text-lg font-bold text-cyan-300">{formatNaira(selected.balance)}</p>
                        </div>
                    </div>

                    <form onSubmit={handleAdjust} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-300">
                                    Amount (₦)
                                    <span className="ml-1 text-xs text-slate-500">— use negative to deduct</span>
                                </label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="e.g. 5000 or -2000"
                                    className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-slate-300">Reason</label>
                                <input
                                    type="text"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Optional — e.g. 'Top-up by admin'"
                                    className="w-full rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                                />
                            </div>
                        </div>

                        {feedback && (
                            <div
                                className={`flex items-center gap-2 rounded-xl border p-4 text-sm ${feedback.type === "success"
                                        ? "border-green-500/20 bg-green-500/10 text-green-300"
                                        : "border-red-500/20 bg-red-500/10 text-red-300"
                                    }`}
                            >
                                {feedback.type === "success" ? (
                                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                                ) : (
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                )}
                                {feedback.message}
                            </div>
                        )}

                        <div className="flex items-center gap-3 pt-1">
                            <button
                                type="submit"
                                disabled={adjusting}
                                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-cyan-500/40 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {adjusting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : Number(amount) >= 0 ? (
                                    <PlusCircle className="h-4 w-4" />
                                ) : (
                                    <MinusCircle className="h-4 w-4" />
                                )}
                                {adjusting ? "Applying…" : "Apply Adjustment"}
                            </button>
                            <button
                                type="button"
                                onClick={() => { setSelected(null); setQuery(""); setFeedback(null) }}
                                className="rounded-xl border border-slate-700 px-4 py-3 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                            >
                                Clear
                            </button>
                        </div>
                    </form>
                </motion.div>
            )}

            {/* Recent Adjustments */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                <h2 className="mb-4 text-lg font-semibold text-white">Recent Adjustments</h2>
                {loadingHistory ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
                    </div>
                ) : recentAdjustments.length === 0 ? (
                    <p className="py-6 text-center text-sm text-slate-500">No adjustments recorded yet.</p>
                ) : (
                    <div className="divide-y divide-slate-800/60">
                        {recentAdjustments.map((entry) => {
                            const isCredit = entry.amount >= 0
                            return (
                                <div key={entry.id} className="flex flex-col gap-1 py-3 md:flex-row md:items-center md:justify-between">
                                    <div className="min-w-0">
                                        <p className="text-sm font-medium text-white">
                                            {entry.buyer.name || entry.buyer.email}
                                            {entry.buyer.name && (
                                                <span className="ml-1 text-xs text-slate-500">({entry.buyer.email})</span>
                                            )}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {entry.reason || "Manual adjustment"} · by {entry.admin_email || "admin"} ·{" "}
                                            {new Date(entry.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-slate-400">
                                            Balance: {formatNaira(entry.buyer.balance)}
                                        </span>
                                        <span
                                            className={`flex items-center gap-1 text-sm font-bold ${isCredit ? "text-emerald-400" : "text-red-400"
                                                }`}
                                        >
                                            {isCredit ? (
                                                <PlusCircle className="h-4 w-4" />
                                            ) : (
                                                <MinusCircle className="h-4 w-4" />
                                            )}
                                            {isCredit ? "+" : ""}
                                            {formatNaira(entry.amount)}
                                        </span>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </motion.div>
    )
}
