import { Bell, Globe, Save, Shield, ToggleLeft, ToggleRight } from "lucide-react"
import { motion } from "framer-motion"
import { useState } from "react"

export default function Settings() {
    const [notifications, setNotifications] = useState({
        emailNotifs: true,
        pushNotifs: true,
        lowStockAlert: true,
        newOrderAlert: true,
        securityAlerts: true,
    })

    const [settings, setSettings] = useState({
        storeName: "SocialMart Marketplace",
        supportEmail: "support@socialmart.io",
        currency: "USD",
        timezone: "UTC",
        autoApprove: false,
    })

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mx-auto max-w-4xl space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
                <p className="mt-1 text-slate-400">Manage your marketplace preferences</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20">
                        <Globe className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">General Settings</h2>
                        <p className="text-sm text-slate-500">Basic store configuration</p>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <input value={settings.storeName} onChange={(event) => setSettings({ ...settings, storeName: event.target.value })} className="rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white" />
                    <input value={settings.supportEmail} onChange={(event) => setSettings({ ...settings, supportEmail: event.target.value })} className="rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-white" />
                </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20">
                        <Bell className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">Notifications</h2>
                        <p className="text-sm text-slate-500">Configure alert preferences</p>
                    </div>
                </div>
                <div className="space-y-4">
                    {Object.entries(notifications).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between rounded-xl border border-slate-700/50 bg-slate-800/30 p-4">
                            <div>
                                <p className="text-sm font-medium text-white">{key}</p>
                            </div>
                            <button onClick={() => setNotifications({ ...notifications, [key]: !value })} className="p-1">
                                {value ? <ToggleRight className="h-10 w-10 text-cyan-400" /> : <ToggleLeft className="h-10 w-10 text-slate-600" />}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm">
                <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/20">
                        <Shield className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-white">Security</h2>
                        <p className="text-sm text-slate-500">Protect your marketplace</p>
                    </div>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-700/50 bg-slate-800/30 p-4">
                    <div>
                        <p className="text-sm font-medium text-white">Auto-approve Orders</p>
                    </div>
                    <button onClick={() => setSettings({ ...settings, autoApprove: !settings.autoApprove })} className="p-1">
                        {settings.autoApprove ? <ToggleRight className="h-10 w-10 text-cyan-400" /> : <ToggleLeft className="h-10 w-10 text-slate-600" />}
                    </button>
                </div>
            </div>

            <div className="flex justify-end">
                <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 px-8 py-3 font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-cyan-500/40">
                    <Save className="h-5 w-5" />
                    Save Changes
                </button>
            </div>
        </motion.div>
    )
}