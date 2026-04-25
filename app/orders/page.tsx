"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
    Package,
    Clock,
    CheckCircle2,
    XCircle,
    ShoppingBag,
    ArrowRight,
    Loader2,
    ChevronDown,
    ChevronUp,
    Receipt,
    Copy,
    Eye,
    EyeOff,
} from "lucide-react"

interface Credential {
    id: number | null
    username: string | null
    password: string | null
}

interface Order {
    id: number
    product_id?: number | null
    product_name: string
    quantity: number
    total_price: string
    payment_status: string
    order_status?: string
    payment_method_name?: string
    payment_error_message?: string | null
    credential_count?: number
    credentials: Credential[]
    created_at: string
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
    completed: { label: "Completed", icon: CheckCircle2, color: "text-emerald-500" },
    pending: { label: "Pending", icon: Clock, color: "text-amber-500" },
    failed: { label: "Failed", icon: XCircle, color: "text-destructive" },
    processing: { label: "Processing", icon: Clock, color: "text-[#38bdf8]" },
}

function StatusBadge({ status }: { status: string }) {
    const cfg = statusConfig[status?.toLowerCase()] ?? statusConfig.pending
    const Icon = cfg.icon
    return (
        <span className={`flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
            <Icon className="h-3.5 w-3.5" />
            {cfg.label}
        </span>
    )
}

function OrderCard({ order }: { order: Order }) {
    const [expanded, setExpanded] = useState(false)
    const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
    const date = new Date(order.created_at)

    const formatPrice = (price: string | number) =>
        `₦${Number(price).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`

    function copyToClipboard(text: string, label: string) {
        navigator.clipboard.writeText(text)
        toast.success(`${label} copied`)
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:border-[#38bdf8]/30">
            <div
                className="flex cursor-pointer items-center gap-4 p-4"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0c4a6e]/30 to-[#075985]/30">
                    <Package className="h-5 w-5 text-[#38bdf8]" />
                </div>

                <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{order.product_name}</p>
                    <p className="text-xs text-muted-foreground">
                        {date.toLocaleDateString("en-NG", { day: "2-digit", month: "short", year: "numeric" })}
                        {order.payment_method_name && ` · ${order.payment_method_name}`}
                    </p>
                </div>

                <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-foreground">{formatPrice(order.total_price)}</p>
                    <StatusBadge status={order.payment_status} />
                </div>

                {expanded ? (
                    <ChevronUp className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                ) : (
                    <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                )}
            </div>

            {expanded && (
                <div className="border-t border-border bg-secondary/30 px-4 py-3">
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <dt className="text-muted-foreground">Order ID</dt>
                        <dd className="font-mono text-xs text-foreground">#{order.id}</dd>
                        <dt className="text-muted-foreground">Quantity</dt>
                        <dd className="text-foreground">{order.quantity}</dd>
                        <dt className="text-muted-foreground">Unit Price</dt>
                        <dd className="text-foreground">
                            {formatPrice(Number(order.total_price) / (order.quantity || 1))}
                        </dd>
                        <dt className="text-muted-foreground">Payment Status</dt>
                        <dd>
                            <StatusBadge status={order.payment_status} />
                        </dd>
                        <dt className="text-muted-foreground">Credentials</dt>
                        <dd className="text-foreground">{order.credential_count ?? order.credentials.length}</dd>
                    </dl>

                    {order.payment_status === "completed" && order.credentials.length > 0 ? (
                        <div className="mt-4 space-y-3 rounded-xl border border-green-200/70 bg-green-50/40 p-4 dark:border-green-900 dark:bg-green-950/20">
                            <p className="text-sm font-semibold text-foreground">Assigned Credentials</p>
                            {order.credentials.map((credential, index) => {
                                const passwordKey = `${order.id}-${index}`
                                return (
                                    <div key={credential.id ?? `${order.id}-${index}`} className="space-y-3 rounded-lg border border-border bg-background p-3">
                                        {credential.username ? (
                                            <div>
                                                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Username</p>
                                                <div className="flex items-center gap-2 rounded-lg bg-secondary/50 p-2.5">
                                                    <code className="flex-1 text-sm text-foreground">{credential.username}</code>
                                                    <button
                                                        type="button"
                                                        onClick={() => copyToClipboard(credential.username as string, "Username")}
                                                        className="text-muted-foreground transition-colors hover:text-foreground"
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : null}

                                        {credential.password ? (
                                            <div>
                                                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">Password</p>
                                                <div className="flex items-center gap-2 rounded-lg bg-secondary/50 p-2.5">
                                                    <code className="flex-1 text-sm text-foreground">
                                                        {showPasswords[passwordKey]
                                                            ? credential.password
                                                            : "•".repeat(credential.password.length)}
                                                    </code>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setShowPasswords((previous) => ({
                                                                ...previous,
                                                                [passwordKey]: !previous[passwordKey],
                                                            }))
                                                        }
                                                        className="text-muted-foreground transition-colors hover:text-foreground"
                                                    >
                                                        {showPasswords[passwordKey] ? (
                                                            <EyeOff className="h-4 w-4" />
                                                        ) : (
                                                            <Eye className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => copyToClipboard(credential.password as string, "Password")}
                                                        className="text-muted-foreground transition-colors hover:text-foreground"
                                                    >
                                                        <Copy className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                )
                            })}
                        </div>
                    ) : null}

                    {order.payment_status === "completed" && order.credentials.length === 0 ? (
                        <p className="mt-4 text-sm text-muted-foreground">Credentials are still being prepared for this order.</p>
                    ) : null}
                </div>
            )}
        </div>
    )
}

export default function OrdersPage() {
    const router = useRouter()
    const [orders, setOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<"all" | "pending" | "completed" | "failed">("all")

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch("/api/orders")
                if (res.status === 401) {
                    router.push("/login")
                    return
                }
                if (!res.ok) throw new Error("Failed to load orders")
                const data = await res.json()
                setOrders(data.orders ?? data)
            } catch {
                toast.error("Failed to load orders")
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [router])

    const filtered =
        filter === "all" ? orders : orders.filter((o) => o.payment_status?.toLowerCase() === filter)

    const total = orders.length
    const pending = orders.filter((o) => o.payment_status?.toLowerCase() === "pending").length
    const completed = orders.filter((o) => o.payment_status?.toLowerCase() === "completed").length

    const totalSpent = orders
        .filter((o) => o.payment_status?.toLowerCase() === "completed")
        .reduce((sum, o) => sum + Number(o.total_price), 0)

    const formatPrice = (n: number) =>
        `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <SiteHeader />

            <main className="flex-1 px-4 py-8">
                <div className="mx-auto max-w-3xl">
                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-foreground">Order History</h1>
                        <p className="mt-1 text-muted-foreground">
                            Track and manage all your purchases
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[
                            { label: "Total Orders", value: total, icon: Receipt, color: "text-[#38bdf8]" },
                            { label: "Pending", value: pending, icon: Clock, color: "text-amber-500" },
                            { label: "Completed", value: completed, icon: CheckCircle2, color: "text-emerald-500" },
                            { label: "Total Spent", value: formatPrice(totalSpent), icon: Package, color: "text-[#38bdf8]" },
                        ].map((stat) => {
                            const Icon = stat.icon
                            return (
                                <div key={stat.label} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                                    <Icon className={`h-5 w-5 mb-2 ${stat.color}`} />
                                    <p className="text-xl font-bold text-foreground">{stat.value}</p>
                                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                                </div>
                            )
                        })}
                    </div>

                    {/* Filters */}
                    <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
                        {(["all", "pending", "completed", "failed"] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all capitalize ${filter === f
                                    ? "bg-[#38bdf8] text-white"
                                    : "bg-card text-muted-foreground hover:bg-secondary hover:text-foreground border border-border"
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    {/* Orders List */}
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-[#38bdf8]" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card py-20 text-center">
                            <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
                            <div>
                                <p className="font-semibold text-foreground">No purchases yet</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {filter === "all"
                                        ? "Your order history will appear here after your first purchase."
                                        : `No ${filter} orders found.`}
                                </p>
                            </div>
                            <Button asChild className="gap-2 bg-[#38bdf8] text-white hover:bg-[#0ea5e9]">
                                <Link href="/shop">
                                    Browse Products
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {filtered.map((order) => (
                                <OrderCard key={order.id} order={order} />
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <SiteFooter />
        </div>
    )
}
