"use client"

import { useEffect, useState } from "react"
import { CreditCard, Loader2, Save, ShieldCheck, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface PaymentMethod {
    id: number
    name: string
    type: string
    config: Record<string, unknown> | null
    is_active: boolean
    sort_order: number
}

const defaultForm = {
    name: "Korapay",
    is_active: true,
    sort_order: 0,
    displayName: "Korapay",
    description: "Secure Korapay checkout for wallet top-ups.",
}

export default function PaymentMethodsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [legacyMethodCount, setLegacyMethodCount] = useState(0)
    const [korapayMethodId, setKorapayMethodId] = useState<number | null>(null)
    const [form, setForm] = useState(defaultForm)

    useEffect(() => {
        void fetchSetup()
    }, [])

    async function fetchSetup() {
        setLoading(true)
        try {
            const res = await fetch("/api/admin/payment-methods")
            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "Failed to load payment setup")
            }

            const methods = Array.isArray(data.methods) ? (data.methods as PaymentMethod[]) : []
            const korapayMethod = methods.find((method) => method.type === "korapay") || null
            const nonKorapayMethods = methods.filter((method) => method.type !== "korapay")

            setLegacyMethodCount(nonKorapayMethods.length)
            setKorapayMethodId(korapayMethod?.id ?? null)

            if (korapayMethod) {
                setForm({
                    name: korapayMethod.name || "Korapay",
                    is_active: korapayMethod.is_active,
                    sort_order: Number(korapayMethod.sort_order ?? 0),
                    displayName: String(korapayMethod.config?.displayName || korapayMethod.name || "Korapay"),
                    description: String(
                        korapayMethod.config?.description || "Secure Korapay checkout for wallet top-ups."
                    ),
                })
            } else {
                setForm(defaultForm)
            }
        } catch (error) {
            console.error("[Admin Payment Setup] Load error:", error)
            toast.error(error instanceof Error ? error.message : "Failed to load payment setup")
        } finally {
            setLoading(false)
        }
    }

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault()

        if (!form.name.trim()) {
            toast.error("Korapay name is required")
            return
        }

        setSaving(true)

        try {
            const payload = {
                name: form.name.trim(),
                type: "korapay",
                is_active: form.is_active,
                sort_order: Number(form.sort_order || 0),
                config: {
                    displayName: form.displayName.trim() || form.name.trim(),
                    description: form.description.trim(),
                },
            }

            const response = korapayMethodId
                ? await fetch(`/api/admin/payment-methods/${korapayMethodId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                })
                : await fetch("/api/admin/payment-methods", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                })

            const data = await response.json()
            if (!response.ok) {
                throw new Error(data.error || "Failed to save Korapay setup")
            }

            toast.success("Korapay payment setup saved")
            await fetchSetup()
        } catch (error) {
            console.error("[Admin Payment Setup] Save error:", error)
            toast.error(error instanceof Error ? error.message : "Failed to save payment setup")
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#38bdf8]" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Payment Setup</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Korapay handles wallet top-ups. Product purchases are always deducted from buyer balance.
                </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-border bg-card p-6">
                    <div className="mb-4 flex items-start gap-3">
                        <div className="rounded-xl bg-[#38bdf8]/10 p-3 text-[#0284c7]">
                            <Wallet className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-foreground">Purchase Flow</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                All orders complete from wallet balance only. Buyers must top up before checkout when funds are insufficient.
                            </p>
                        </div>
                    </div>

                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-700">
                        Balance purchases are completed instantly and credentials are delivered immediately after deduction.
                    </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-6">
                    <div className="mb-4 flex items-start gap-3">
                        <div className="rounded-xl bg-[#38bdf8]/10 p-3 text-[#0284c7]">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-foreground">Gateway Policy</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Korapay is the only gateway exposed in the admin dashboard for wallet funding.
                            </p>
                        </div>
                    </div>

                    {legacyMethodCount > 0 ? (
                        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-700">
                            {legacyMethodCount} legacy payment method{legacyMethodCount === 1 ? " is" : "s are"} still stored in the database, but checkout no longer uses them.
                        </div>
                    ) : (
                        <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                            No legacy payment methods detected.
                        </div>
                    )}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-border bg-card p-6">
                <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-[#38bdf8]/10 p-3 text-[#0284c7]">
                        <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="font-semibold text-foreground">Korapay Top-up Setup</h2>
                        <p className="text-sm text-muted-foreground">
                            This saves the single Korapay method label used for wallet funding flows.
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-foreground">Method Name</label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(event) => setForm((previous) => ({ ...previous, name: event.target.value }))}
                            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-[#38bdf8] focus:outline-none"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-foreground">Display Name</label>
                        <input
                            type="text"
                            value={form.displayName}
                            onChange={(event) => setForm((previous) => ({ ...previous, displayName: event.target.value }))}
                            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-[#38bdf8] focus:outline-none"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-foreground">Description</label>
                    <textarea
                        value={form.description}
                        onChange={(event) => setForm((previous) => ({ ...previous, description: event.target.value }))}
                        rows={3}
                        className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-[#38bdf8] focus:outline-none"
                    />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium text-foreground">Sort Order</label>
                        <input
                            type="number"
                            value={form.sort_order}
                            onChange={(event) => setForm((previous) => ({ ...previous, sort_order: parseInt(event.target.value) || 0 }))}
                            className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-[#38bdf8] focus:outline-none"
                        />
                    </div>

                    <label className="flex items-center gap-2 self-end text-sm text-foreground">
                        <input
                            type="checkbox"
                            checked={form.is_active}
                            onChange={(event) => setForm((previous) => ({ ...previous, is_active: event.target.checked }))}
                            className="h-4 w-4 rounded border-border accent-[#38bdf8]"
                        />
                        Enable Korapay top-ups
                    </label>
                </div>

                <div className="flex justify-end">
                    <Button type="submit" disabled={saving} className="gap-2 bg-[#38bdf8] text-white hover:bg-[#0ea5e9]">
                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        Save Setup
                    </Button>
                </div>
            </form>
        </div>
    )
}
