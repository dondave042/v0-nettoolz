import { ChevronDown, Copy, Edit3, Eye, Facebook, Instagram, Linkedin, Lock, Monitor, MoreHorizontal, Music2, Search, Send, Shield, Trash2, Twitter, Unlock } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"
import { useState } from "react"
import { Platform, Product } from "../types"

interface ProductsTableProps {
    products: Product[]
    onDeleteProduct: (id: string) => Promise<void> | void
    onUpdateProduct: (product: Product) => void
}

const platformIcons: Record<Platform, React.ReactNode> = {
    instagram: <Instagram className="h-4 w-4" />,
    facebook: <Facebook className="h-4 w-4" />,
    twitter: <Twitter className="h-4 w-4" />,
    tiktok: <Music2 className="h-4 w-4" />,
    youtube: <Monitor className="h-4 w-4" />,
    linkedin: <Linkedin className="h-4 w-4" />,
    snapchat: <MoreHorizontal className="h-4 w-4" />,
    telegram: <Send className="h-4 w-4" />,
    other: <Shield className="h-4 w-4" />,
}

export default function ProductsTable({ products, onDeleteProduct }: ProductsTableProps) {
    const [searchQuery, setSearchQuery] = useState("")
    const [expandedProduct, setExpandedProduct] = useState<string | null>(null)
    const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})

    const filteredProducts = products.filter(
        (product) =>
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.category.toLowerCase().includes(searchQuery.toLowerCase())
    )

    async function handleDeleteProduct(id: string, event: React.MouseEvent<HTMLButtonElement>) {
        event.stopPropagation()
        try {
            await onDeleteProduct(id)
        } catch (error) {
            console.error("[ProductsTable] Failed to delete product:", error)
        }
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Products & Credentials</h1>
                <p className="mt-1 text-slate-400">Manage your products and view account credentials</p>
            </div>

            <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search products by name or category..." className="w-full rounded-xl border border-slate-700 bg-slate-800/50 py-3 pl-12 pr-4 text-white placeholder:text-slate-500" />
            </div>

            <div className="space-y-4">
                <AnimatePresence>
                    {filteredProducts.map((product) => (
                        <motion.div key={product.id} layout className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm">
                            <div className="flex cursor-pointer items-center gap-4 p-5" onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)}>
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/50 text-cyan-300">
                                    {platformIcons[product.platform]}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="truncate text-base font-semibold text-white">{product.name}</h3>
                                    <p className="mt-0.5 truncate text-sm text-slate-500">{product.category} • {product.description}</p>
                                </div>
                                <div className="hidden items-center gap-6 sm:flex">
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-white">{product.quantity}</p>
                                        <p className="text-xs text-slate-500">Qty</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-bold text-cyan-400">₦{product.price.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                        <p className="text-xs text-slate-500">Price</p>
                                    </div>
                                </div>
                                <button className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800">
                                    <motion.div animate={{ rotate: expandedProduct === product.id ? 180 : 0 }}>
                                        <ChevronDown className="h-5 w-5" />
                                    </motion.div>
                                </button>
                                <button className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-cyan-400">
                                    <Edit3 className="h-4 w-4" />
                                </button>
                                <button onClick={(event) => handleDeleteProduct(product.id, event)} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-red-400">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>

                            <AnimatePresence>
                                {expandedProduct === product.id && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-slate-800 bg-slate-950/50">
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-slate-800">
                                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Username</th>
                                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Password</th>
                                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                                                        <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-800/50">
                                                    {product.accounts.map((account) => (
                                                        <tr key={account.id} className="transition-colors hover:bg-slate-800/30">
                                                            <td className="px-5 py-3 text-sm font-medium text-white">{account.username}</td>
                                                            <td className="px-5 py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`font-mono text-sm ${showPasswords[account.id] ? "text-white" : "text-slate-500"}`}>
                                                                        {showPasswords[account.id] ? account.password : "••••••••••"}
                                                                    </span>
                                                                    <button onClick={() => setShowPasswords((previous) => ({ ...previous, [account.id]: !previous[account.id] }))} className="rounded p-1 hover:bg-slate-700">
                                                                        {showPasswords[account.id] ? <Unlock className="h-3.5 w-3.5 text-cyan-400" /> : <Lock className="h-3.5 w-3.5 text-slate-500" />}
                                                                    </button>
                                                                    <button onClick={() => navigator.clipboard.writeText(account.password)} className="rounded p-1 hover:bg-slate-700">
                                                                        <Copy className="h-3.5 w-3.5 text-slate-500 hover:text-cyan-400" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-3 text-sm text-slate-300">{account.status}</td>
                                                            <td className="px-5 py-3">
                                                                <button className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-700 hover:text-cyan-400">
                                                                    <Eye className="h-3.5 w-3.5" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    )
}