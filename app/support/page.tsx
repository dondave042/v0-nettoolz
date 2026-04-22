"use client"

import { useState } from "react"
import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import {
    HelpCircle,
    Mail,
    MessageSquare,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Loader2,
    Zap,
    Shield,
    Clock,
} from "lucide-react"

const FAQ_ITEMS = [
    {
        q: "How do I purchase a product?",
        a: "Browse the Shop, add items to your cart, and proceed to checkout. You can pay using your wallet balance or via Korapay (card, bank transfer). Your credentials are delivered instantly after payment.",
    },
    {
        q: "How long does delivery take?",
        a: "All digital products are delivered instantly to your account. You can view your purchases in the Orders section of your dashboard.",
    },
    {
        q: "How do I top up my wallet?",
        a: "Go to Wallet → Top Up, enter an amount, and complete payment via Korapay. Your balance will be credited within seconds of a successful payment.",
    },
    {
        q: "What payment methods are accepted?",
        a: "We accept debit/credit cards, bank transfers, and USSD via Korapay. You can also use your NETTOOLZ wallet balance.",
    },
    {
        q: "Can I get a refund?",
        a: "Digital products are generally non-refundable due to their instant delivery nature. However, if you experience an issue, please open a support ticket and our team will review it.",
    },
    {
        q: "How do I contact support?",
        a: "Use the contact form below to send us a message, or email support@nettoolz.com. We typically respond within 24 hours.",
    },
    {
        q: "Is my data secure?",
        a: "Yes. We use industry-standard encryption for all transactions. Payments are processed securely via Korapay and we never store your card details.",
    },
]

function FaqItem({ item }: { item: (typeof FAQ_ITEMS)[0] }) {
    const [open, setOpen] = useState(false)
    return (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
            <button
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                onClick={() => setOpen(!open)}
            >
                <span className="font-medium text-foreground">{item.q}</span>
                {open ? (
                    <ChevronUp className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                ) : (
                    <ChevronDown className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                )}
            </button>
            {open && (
                <div className="border-t border-border bg-secondary/30 px-5 py-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                </div>
            )}
        </div>
    )
}

export default function SupportPage() {
    const [form, setForm] = useState({ subject: "", message: "" })
    const [submitting, setSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.subject.trim() || !form.message.trim()) {
            toast.error("Please fill in all fields")
            return
        }
        setSubmitting(true)
        try {
            const res = await fetch("/api/support/ticket", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            })
            const result = await res.json()
            if (!res.ok) throw new Error(result.error ?? "Failed to submit ticket")
            setSubmitted(true)
            toast.success("Support ticket submitted successfully!")
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to submit ticket")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="flex min-h-screen flex-col bg-background">
            <SiteHeader />

            <main className="flex-1">
                {/* Hero */}
                <section className="border-b border-border bg-gradient-to-br from-[#0c4a6e] to-[#0c1e2d] px-4 py-14 text-center">
                    <div className="mx-auto max-w-2xl">
                        <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[#38bdf8]/20">
                            <HelpCircle className="h-6 w-6 text-[#38bdf8]" />
                        </div>
                        <h1 className="text-3xl font-bold text-white md:text-4xl">Help Center</h1>
                        <p className="mt-3 text-[#7dd3fc]">
                            Get answers fast or reach our support team directly. We&apos;re here to help.
                        </p>
                    </div>
                </section>

                <div className="mx-auto max-w-5xl px-4 py-12 lg:px-8">
                    {/* Feature highlights */}
                    <div className="mb-12 grid gap-4 sm:grid-cols-3">
                        {[
                            { icon: Zap, title: "Instant Answers", desc: "Browse our FAQ for quick self-serve solutions" },
                            { icon: Clock, title: "Fast Response", desc: "Support tickets answered within 24 hours" },
                            { icon: Shield, title: "Secure Support", desc: "All tickets encrypted and kept confidential" },
                        ].map((f) => {
                            const Icon = f.icon
                            return (
                                <div key={f.title} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
                                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[#38bdf8]/10">
                                        <Icon className="h-5 w-5 text-[#38bdf8]" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-foreground text-sm">{f.title}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <div className="grid gap-10 lg:grid-cols-2">
                        {/* FAQ Section */}
                        <section id="faq">
                            <h2 className="mb-5 text-xl font-bold text-foreground">
                                Frequently Asked Questions
                            </h2>
                            <div className="flex flex-col gap-2">
                                {FAQ_ITEMS.map((item, i) => (
                                    <FaqItem key={i} item={item} />
                                ))}
                            </div>
                        </section>

                        {/* Contact Form */}
                        <section id="contact">
                            <h2 className="mb-5 text-xl font-bold text-foreground">Contact Support</h2>

                            {submitted ? (
                                <div className="flex flex-col items-center gap-4 rounded-2xl border border-border bg-card p-10 text-center">
                                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10">
                                        <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-foreground">Ticket Submitted!</h3>
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            We&apos;ve received your message. Our support team will get back to you within 24 hours.
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSubmitted(false)
                                            setForm({ subject: "", message: "" })
                                        }}
                                    >
                                        Submit Another
                                    </Button>
                                </div>
                            ) : (
                                <form
                                    onSubmit={handleSubmit}
                                    className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
                                >
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-foreground">Subject</label>
                                        <Input
                                            placeholder="e.g. Issue with my order #123"
                                            value={form.subject}
                                            onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-foreground">Message</label>
                                        <Textarea
                                            placeholder="Describe your issue in detail..."
                                            value={form.message}
                                            onChange={(e) => setForm({ ...form, message: e.target.value })}
                                            rows={6}
                                            required
                                        />
                                    </div>

                                    <div className="flex items-center gap-2 rounded-xl border border-[#38bdf8]/20 bg-[#38bdf8]/5 p-3 text-sm text-muted-foreground">
                                        <Mail className="h-4 w-4 text-[#38bdf8] flex-shrink-0" />
                                        <span>You&apos;ll receive a reply at the email associated with your account.</span>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={submitting}
                                        className="gap-2 bg-[#38bdf8] text-white hover:bg-[#0ea5e9]"
                                    >
                                        {submitting ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <MessageSquare className="h-4 w-4" />
                                        )}
                                        Send Message
                                    </Button>

                                    <p className="text-center text-xs text-muted-foreground">
                                        Or email us directly at{" "}
                                        <a href="mailto:support@nettoolz.com" className="text-[#38bdf8] hover:underline">
                                            support@nettoolz.com
                                        </a>
                                    </p>
                                </form>
                            )}
                        </section>
                    </div>
                </div>
            </main>

            <SiteFooter />
        </div>
    )
}
