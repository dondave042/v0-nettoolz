import { AlertTriangle, ArrowUpRight, CheckCircle2, DollarSign, Package, ShoppingCart, TrendingUp, Users } from "lucide-react"
import { motion } from "framer-motion"
import { getDashboardStats } from "../data/mockData"
import { Product } from "../types"

interface DashboardProps {
    products: Product[]
}

const statCards = [
    { key: "totalProducts", label: "Total Products", icon: Package, color: "from-cyan-500 to-blue-500", bgColor: "bg-cyan-500/10", textColor: "text-cyan-400" },
    { key: "totalAccounts", label: "Total Accounts", icon: Users, color: "from-purple-500 to-pink-500", bgColor: "bg-purple-500/10", textColor: "text-purple-400" },
    { key: "totalRevenue", label: "Total Revenue", icon: DollarSign, color: "from-green-500 to-emerald-500", bgColor: "bg-green-500/10", textColor: "text-green-400", prefix: "₦" },
    { key: "activeProducts", label: "Active Products", icon: CheckCircle2, color: "from-orange-500 to-amber-500", bgColor: "bg-orange-500/10", textColor: "text-orange-400" },
    { key: "soldAccounts", label: "Sold Accounts", icon: ShoppingCart, color: "from-red-500 to-rose-500", bgColor: "bg-red-500/10", textColor: "text-red-400" },
    { key: "lowStockProducts", label: "Low Stock Alert", icon: AlertTriangle, color: "from-yellow-500 to-orange-500", bgColor: "bg-yellow-500/10", textColor: "text-yellow-400" },
]

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
}

export default function Dashboard({ products }: DashboardProps) {
    const stats = getDashboardStats(products)

    const recentActivity = products.slice(0, 5).flatMap((product, productIndex) =>
        product.accounts.slice(0, 2).map((account, accountIndex) => ({
            product: product.name,
            account: account.username,
            status: account.status,
            time: `${(productIndex * 2 + accountIndex + 1) * 5}m ago`,
        }))
    )

    const platformCounts = products.reduce((accumulator, product) => {
        accumulator[product.platform] = (accumulator[product.platform] || 0) + 1
        return accumulator
    }, {} as Record<string, number>)

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
            <motion.div variants={itemVariants} className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
                    <p className="mt-1 text-slate-400">Welcome back! Here's your marketplace overview.</p>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-slate-700/50 bg-slate-800/50 px-4 py-2">
                    <TrendingUp className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-slate-300">Live</span>
                    <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                </div>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {statCards.map((stat) => {
                    const Icon = stat.icon
                    const value = stats[stat.key as keyof typeof stats]
                    const displayValue = stat.prefix ? `${stat.prefix}${value.toLocaleString()}` : value.toLocaleString()

                    return (
                        <motion.div key={stat.key} whileHover={{ y: -4, scale: 1.02 }} className={`relative overflow-hidden rounded-2xl border border-slate-700/50 p-5 backdrop-blur-sm ${stat.bgColor}`}>
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{stat.label}</p>
                                    <p className={`mt-2 text-2xl font-bold ${stat.textColor}`}>{displayValue}</p>
                                </div>
                                <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                                    <Icon className="h-5 w-5 text-white" />
                                </div>
                            </div>
                            <div className="mt-3 flex items-center gap-1">
                                <ArrowUpRight className="h-3 w-3 text-green-400" />
                                <span className="text-xs font-medium text-green-400">+12.5%</span>
                                <span className="ml-1 text-xs text-slate-500">vs last week</span>
                            </div>
                        </motion.div>
                    )
                })}
            </motion.div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <motion.div variants={itemVariants} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 backdrop-blur-sm lg:col-span-2">
                    <div className="flex items-center justify-between border-b border-slate-800 px-6 py-5">
                        <div>
                            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
                            <p className="text-sm text-slate-500">Latest account transactions</p>
                        </div>
                        <button className="text-sm font-medium text-cyan-400 transition-colors hover:text-cyan-300">View All</button>
                    </div>
                    <div className="divide-y divide-slate-800/50">
                        {recentActivity.map((activity, index) => (
                            <motion.div key={`${activity.account}-${index}`} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-slate-800/30">
                                <div className="flex items-center gap-4">
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${activity.status === "sold" ? "bg-red-500/10" : activity.status === "reserved" ? "bg-yellow-500/10" : "bg-green-500/10"}`}>
                                        <Users className={`h-5 w-5 ${activity.status === "sold" ? "text-red-400" : activity.status === "reserved" ? "text-yellow-400" : "text-green-400"}`} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">{activity.account}</p>
                                        <p className="text-xs text-slate-500">{activity.product}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`rounded-lg px-2.5 py-1 text-xs font-medium ${activity.status === "sold" ? "bg-red-500/10 text-red-400" : activity.status === "reserved" ? "bg-yellow-500/10 text-yellow-400" : "bg-green-500/10 text-green-400"}`}>
                                        {activity.status}
                                    </span>
                                    <span className="text-xs text-slate-500">{activity.time}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                    <h2 className="mb-4 text-lg font-semibold text-white">Platform Distribution</h2>
                    <div className="space-y-4">
                        {Object.entries(platformCounts).map(([platform, count]) => {
                            const percentage = (count / products.length) * 100
                            return (
                                <div key={platform}>
                                    <div className="mb-1.5 flex items-center justify-between">
                                        <span className="text-sm font-medium capitalize text-slate-300">{platform}</span>
                                        <span className="text-sm text-slate-500">{count} products</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 0.8, delay: 0.2 }} className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500" />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    )
}