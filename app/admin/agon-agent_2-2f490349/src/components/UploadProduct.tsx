import { CheckCircle2, KeyRound, Package, Plus, Trash2 } from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"
import { Account, Platform, Product } from "../types"

interface UploadProductProps {
    onAddProduct: (product: Product) => void
}

const emptyAccount: Omit<Account, "id"> = {
    username: "",
    password: "",
    email: "",
    notes: "",
    status: "available",
}

export default function UploadProduct({ onAddProduct }: UploadProductProps) {
    const [productName, setProductName] = useState("")
    const [category, setCategory] = useState("")
    const [platform, setPlatform] = useState<Platform>("instagram")
    const [price, setPrice] = useState("")
    const [description, setDescription] = useState("")
    const [accounts, setAccounts] = useState<Omit<Account, "id">[]>([{ ...emptyAccount }])
    const [submitted, setSubmitted] = useState(false)

    function addAccount() {
        setAccounts((previous) => [...previous, { ...emptyAccount }])
    }

    function removeAccount(index: number) {
        if (accounts.length === 1) return
        setAccounts((previous) => previous.filter((_, currentIndex) => currentIndex !== index))
    }

    function updateAccount(index: number, field: keyof Omit<Account, "id">, value: string) {
        setAccounts((previous) => previous.map((account, currentIndex) => (currentIndex === index ? { ...account, [field]: value } : account)))
    }

    function handleSubmit(event: React.FormEvent) {
        event.preventDefault()
        const product: Product = {
            id: `${Date.now()}`,
            name: productName,
            category,
            platform,
            price: Number(price || 0),
            quantity: accounts.length,
            description,
            status: "active",
            createdAt: new Date(),
            updatedAt: new Date(),
            accounts: accounts.map((account, index) => ({ ...account, id: `${Date.now()}-${index}` })),
        }
        onAddProduct(product)
        setSubmitted(true)
        setProductName("")
        setCategory("")
        setPlatform("instagram")
        setPrice("")
        setDescription("")
        setAccounts([{ ...emptyAccount }])
    }

    return (
        <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Upload New Product</h1>
                <p className="mt-1 text-slate-400">Add a new product with account credentials to your inventory</p>
            </div>

            {submitted && (
                <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-green-300">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5" />
                        Product added to the local agon dashboard state.
                    </div>
                </div>
            )}

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
                <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20">
                        <Package className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">Basic Information</h2>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <input value={productName} onChange={(event) => setProductName(event.target.value)} placeholder="Product name" className="rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white" required />
                    <input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Category" className="rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white" required />
                    <select value={platform} onChange={(event) => setPlatform(event.target.value as Platform)} className="rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white">
                        {(["instagram", "facebook", "twitter", "tiktok", "youtube", "linkedin", "telegram", "other"] as Platform[]).map((entry) => (
                            <option key={entry} value={entry}>{entry}</option>
                        ))}
                    </select>
                    <input value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Price" className="rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white" required />
                    <textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description" className="rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white md:col-span-2" rows={3} />
                </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20">
                            <KeyRound className="h-5 w-5 text-purple-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Account Credentials</h2>
                        </div>
                    </div>
                    <button type="button" onClick={addAccount} className="flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/20 px-4 py-2 text-sm font-medium text-purple-300">
                        <Plus className="h-4 w-4" />
                        Add Account
                    </button>
                </div>
                <div className="space-y-4">
                    {accounts.map((account, index) => (
                        <motion.div key={index} layout className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4">
                            <div className="mb-3 flex items-center justify-between">
                                <span className="text-sm font-medium text-white">Account {index + 1}</span>
                                {accounts.length > 1 && (
                                    <button type="button" onClick={() => removeAccount(index)} className="text-slate-400 hover:text-red-400">
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                <input value={account.username} onChange={(event) => updateAccount(index, "username", event.target.value)} placeholder="Username" className="rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-white" />
                                <input value={account.password} onChange={(event) => updateAccount(index, "password", event.target.value)} placeholder="Password" className="rounded-lg border border-slate-700 bg-slate-900/50 px-3 py-2.5 text-white" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end">
                <button type="submit" className="rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-6 py-3 font-semibold text-white">
                    Save Product
                </button>
            </div>
        </form>
    )
}