cd "c:\Users\HomePC\Desktop\v0-nettoolz.worktrees\copilot-worktree-2026-04-23T02-59-07"
git add app / admin / agon - agent_2 - 2f490349 / src /
    git commit - m "feat: add Users & Balances tab and fix naira pricing"
git pushcd "c:\Users\HomePC\Desktop\v0-nettoolz.worktrees\copilot-worktree-2026-04-23T02-59-07"
git add app / admin / agon - agent_2 - 2f490349 / src /
    git commit - m "feat: add Users & Balances tab and fix naira pricing"
git push"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import {
    Zap,
    CreditCard,
    ArrowRight,
    CheckCircle2,
    Loader2,
    Wallet,
    ShieldCheck,
} from "lucide-react"

type Step = "amount" | "confirm" | "done"

export default function QuickPayPage() {
    const router = useRouter()
    const [step, setStep] = useState<Step>("amount")
    const [amount, setAmount] = useState("")
    const [note, setNote] = useState("")
    const [paying, setPaying] = useState(false)

    const numericAmount = parseFloat(amount) || 0
    const formatPrice = (n: number) =>
        `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`

    const handleContinue = () => {
        if (!numericAmount || numericAmount <= 0) {
            toast.error("Please enter a valid amount")
            return
        }
        if (numericAmount > 1_000_000) {
            toast.error("Amount exceeds maximum limit of ₦1,000,000")
            return
        }
        setStep("confirm")
    }

    const handlePay = async () => {
        setPaying(true)
        try {
            const res = await fetch("/api/deposits", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: numericAmount, note }),
            })
            const result = await res.json()
            if (!res.ok) throw new Error(result.error ?? "Payment failed")

            const checkoutUrl = result.checkout_url || result.checkoutUrl

            if (checkoutUrl) {
                window.location.href = checkoutUrl
            } else {
                setStep("done")
            }
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Payment failed")
            setPaying(false)
        }
    }

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <SiteHeader />

            <main className="flex flex-1 items-center justify-center px-4 py-12">
                <div className="w-full max-w-md">
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#38bdf8] to-[#0284c7] shadow-lg">
                            <Zap className="h-7 w-7 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground">Quick Payment</h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Instantly top up your wallet balance with a one-time payment
                        </p>
                    </div>

                    {/* Step Indicator */}
                    <div className="mb-8 flex items-center justify-center gap-2">
                        {(["amount", "confirm", "done"] as Step[]).map((s, i) => (
                            <div key={s} className="flex items-center gap-2">
                                <div
                                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${s === step
                                        ? "bg-[#38bdf8] text-white"
                                        : (["amount", "confirm", "done"].indexOf(step) > i)
                                            ? "bg-emerald-500 text-white"
                                            : "bg-border text-muted-foreground"
                                        }`}
                                >
                                    {(["amount", "confirm", "done"].indexOf(step) > i) ? (
                                        <CheckCircle2 className="h-4 w-4" />
                                    ) : i + 1}
                                </div>
                                {i < 2 && <div className={`h-px w-8 transition-all ${(["amount", "confirm", "done"].indexOf(step) > i) ? "bg-emerald-500" : "bg-border"}`} />}
                            </div>
                        ))}
                    </div>

                    {/* Step Content */}
                    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                        {step === "amount" && (
                            <div className="flex flex-col gap-4">
                                <h2 className="font-semibold text-foreground">Enter Amount</h2>

                                {/* Quick select */}
                                <div className="grid grid-cols-3 gap-2">
                                    {[500, 1000, 2000, 5000, 10000, 20000].map((amt) => (
                                        <button
                                            key={amt}
                                            onClick={() => setAmount(String(amt))}
                                            className={`rounded-xl border px-2 py-2.5 text-sm font-medium transition-all ${amount === String(amt)
                                                ? "border-[#38bdf8] bg-[#38bdf8]/10 text-[#38bdf8]"
                                                : "border-border text-muted-foreground hover:border-[#38bdf8]/50"
                                                }`}
                                        >
                                            ₦{amt.toLocaleString()}
                                        </button>
                                    ))}
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                                        Custom Amount (₦)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-medium text-muted-foreground">₦</span>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            className="pl-7 text-lg font-semibold"
                                            min={100}
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-muted-foreground">Minimum: ₦100 · Maximum: ₦1,000,000</p>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                                        Note <span className="text-muted-foreground">(optional)</span>
                                    </label>
                                    <Input
                                        placeholder="e.g. For digital subscription"
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                    />
                                </div>

                                <Button
                                    onClick={handleContinue}
                                    disabled={!numericAmount}
                                    className="mt-2 w-full gap-2 bg-[#38bdf8] text-white hover:bg-[#0ea5e9]"
                                >
                                    Continue
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}

                        {step === "confirm" && (
                            <div className="flex flex-col gap-5">
                                <h2 className="font-semibold text-foreground">Confirm Payment</h2>

                                <div className="rounded-xl bg-secondary/50 p-4 text-center">
                                    <p className="text-xs text-muted-foreground">You are about to pay</p>
                                    <p className="mt-1 text-4xl font-bold text-foreground">{formatPrice(numericAmount)}</p>
                                    {note && (
                                        <p className="mt-2 text-sm text-muted-foreground">&ldquo;{note}&rdquo;</p>
                                    )}
                                </div>

                                <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-600">
                                    <ShieldCheck className="h-4 w-4 flex-shrink-0" />
                                    <span>Secure payment via Korapay. Your wallet will be credited instantly on success.</span>
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => setStep("amount")}
                                        className="flex-1"
                                    >
                                        Back
                                    </Button>
                                    <Button
                                        onClick={handlePay}
                                        disabled={paying}
                                        className="flex-1 gap-2 bg-[#38bdf8] text-white hover:bg-[#0ea5e9]"
                                    >
                                        {paying ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <CreditCard className="h-4 w-4" />
                                        )}
                                        Pay Now
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === "done" && (
                            <div className="flex flex-col items-center gap-4 py-4 text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
                                    <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-foreground">Payment Initiated!</h2>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Your wallet will be credited once the payment is confirmed. This usually takes a few seconds.
                                    </p>
                                </div>
                                <div className="flex w-full flex-col gap-2 pt-2">
                                    <Button asChild className="gap-2 bg-[#38bdf8] text-white hover:bg-[#0ea5e9]">
                                        <Link href="/wallet">
                                            <Wallet className="h-4 w-4" />
                                            View Wallet
                                        </Link>
                                    </Button>
                                    <Button variant="outline" asChild>
                                        <Link href="/shop">Browse Products</Link>
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    <p className="mt-4 text-center text-xs text-muted-foreground">
                        Need help?{" "}
                        <Link href="/support" className="text-[#38bdf8] hover:underline">
                            Contact support
                        </Link>
                    </p>
                </div>
            </main>

            <SiteFooter />
        </div>
    )
}
