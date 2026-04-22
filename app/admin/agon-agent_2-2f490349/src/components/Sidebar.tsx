import { BarChart3, LayoutDashboard, LogOut, Package, PlusCircle, Settings, Zap } from "lucide-react"
import { motion } from "framer-motion"
import { AdminTab } from "../types"

interface SidebarProps {
    activeTab: AdminTab
    setActiveTab: (tab: AdminTab) => void
}

const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "products", label: "Products", icon: Package },
    { id: "upload", label: "Upload Product", icon: PlusCircle },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
]

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
    return (
        <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            className="fixed left-0 top-0 z-50 flex h-screen w-[260px] flex-col border-r border-cyan-500/20 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950"
        >
            <div className="border-b border-cyan-500/20 p-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-purple-600 shadow-lg shadow-cyan-500/30">
                        <Zap className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white">SocialMart</h1>
                        <p className="text-xs font-medium text-cyan-400/70">Admin Panel</p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto p-4">
                <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Main Menu</p>
                {menuItems.map((item) => {
                    const Icon = item.icon
                    const isActive = activeTab === item.id

                    return (
                        <motion.button
                            key={item.id}
                            whileHover={{ x: 4 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setActiveTab(item.id)}
                            className={`group relative flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${isActive
                                ? "border border-cyan-500/30 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-300 shadow-lg shadow-cyan-500/10"
                                : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                                }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="sidebar-active"
                                    className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-cyan-400 to-purple-500"
                                />
                            )}
                            <Icon className={`h-5 w-5 ${isActive ? "text-cyan-400" : "group-hover:text-cyan-400"}`} />
                            <span>{item.label}</span>
                        </motion.button>
                    )
                })}
            </nav>

            <div className="border-t border-cyan-500/20 p-4">
                <div className="flex items-center gap-3 rounded-xl bg-slate-800/50 px-3 py-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 text-sm font-bold text-white">
                        AD
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-white">Admin User</p>
                        <p className="truncate text-xs text-slate-500">admin@socialmart.io</p>
                    </div>
                    <button className="rounded-lg p-1.5 transition-colors hover:bg-slate-700">
                        <LogOut className="h-4 w-4 text-slate-500" />
                    </button>
                </div>
            </div>
        </motion.aside>
    )
}