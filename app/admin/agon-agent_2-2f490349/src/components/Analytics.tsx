import { Activity, ArrowDownRight, ArrowUpRight, BarChart3, Clock, DollarSign, TrendingUp } from "lucide-react"
import { motion } from "framer-motion"
import { Product } from "../types"

interface AnalyticsProps {
    products: Product[]
}

export default function Analytics({ products }: AnalyticsProps) {
    const totalRevenue = products.reduce((sum, product) => {
        const soldCount = product.accounts.filter((account) => account.status === "sold").length
        return sum + soldCount * product.price
    }, 0)

    const totalPotentialRevenue = products.reduce((sum, product) => sum + product.accounts.length * product.price, 0)
    const soldAccounts = products.reduce((sum, product) => sum + product.accounts.filter((account) => account.status === "sold").length, 0)
    const totalAccounts = products.reduce((sum, product) => sum + product.accounts.length, 0)
    const avgOrder = soldAccounts > 0 ? totalRevenue / soldAccounts : 0

    const monthlyData = [12, 19, 15, 25, 32, 28]
    const maxSales = Math.max(...monthlyData)

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Analytics</h1>
                <p className="mt-1 text-slate-400">Detailed insights into your marketplace performance</p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
                {[
                    { label: "Total Revenue", value: `₦${totalRevenue.toLocaleString()}`, change: "+18.2%", up: true, icon: DollarSign, color: "from-green-500 to-emerald-500" },
                    { label: "Potential Revenue", value: `₦${totalPotentialRevenue.toLocaleString()}`, change: "+24.5%", up: true, icon: TrendingUp, color: "from-cyan-500 to-blue-500" },
                    { label: "Avg. Order Value", value: `₦${avgOrder.toFixed(2)}`, change: "+5.3%", up: true, icon: BarChart3, color: "from-purple-500 to-pink-500" },
                    { label: "Conversion Rate", value: `${((soldAccounts / Math.max(1, totalAccounts)) * 100).toFixed(1)}%`, change: "-2.1%", up: false, icon: Activity, color: "from-orange-500 to-amber-500" },
                ].map((kpi) => {
                    const Icon = kpi.icon
                    return (
                        <motion.div key={kpi.label} whileHover={{ y: -4 }} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
                            <div className="mb-4 flex items-start justify-between">
                                <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${kpi.color}`}>
                                    <Icon className="h-5 w-5 text-white" />
                                </div>
                                <div className={`flex items-center gap-1 text-sm font-medium ${kpi.up ? "text-green-400" : "text-red-400"}`}>
                                    {kpi.up ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                                    {kpi.change}
                                </div>
                            </div>
                            <p className="text-2xl font-bold text-white">{kpi.value}</p>
                            <p className="mt-1 text-sm text-slate-500">{kpi.label}</p>
                        </motion.div>
                    )
                })}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm lg:col-span-2">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold text-white">Sales Overview</h2>
                            <p className="text-sm text-slate-500">Monthly sales performance</p>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5">
                            <Clock className="h-4 w-4 text-slate-400" />
                            <span className="text-sm text-slate-300">Last 6 months</span>
                        </div>
                    </div>
                    <div className="flex h-64 items-end gap-3 pt-8">
                        {monthlyData.map((sales, index) => (
                            <div key={index} className="flex flex-1 flex-col items-center gap-2">
                                <motion.div initial={{ height: 0 }} animate={{ height: `${(sales / maxSales) * 100}%` }} transition={{ delay: index * 0.1, duration: 0.5 }} className="w-full max-w-[50px] rounded-t-lg bg-gradient-to-t from-cyan-500 to-purple-500" />
                                <span className="text-xs font-medium text-slate-500">{["Jan", "Feb", "Mar", "Apr", "May", "Jun"][index]}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                    <h2 className="text-lg font-semibold text-white">Top Platforms</h2>
                    <p className="mb-6 text-sm text-slate-500">Revenue by platform</p>
                    <div className="space-y-4">
                        {products.slice(0, 5).map((product, index) => {
                            const revenue = product.accounts.filter((account) => account.status === "sold").length * product.price
                            const width = Math.max(10, (revenue / Math.max(totalRevenue, 1)) * 100)
                            return (
                                <div key={product.id} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium text-white">{product.platform}</span>
                                        <span className="text-sm font-semibold text-cyan-400">₦{revenue.toFixed(2)}</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${width}%` }} transition={{ delay: index * 0.1, duration: 0.5 }} className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-purple-500" />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </motion.div>
    )
}