import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  Bell, 
  Shield, 
  Palette,
  Globe,
  Save,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { useState } from 'react';

export default function Settings() {
  const [notifications, setNotifications] = useState({
    emailNotifs: true,
    pushNotifs: true,
    lowStockAlert: true,
    newOrderAlert: true,
    securityAlerts: true
  });

  const [settings, setSettings] = useState({
    storeName: 'SocialMart Marketplace',
    supportEmail: 'support@socialmart.io',
    currency: 'USD',
    timezone: 'UTC',
    autoApprove: false
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto space-y-6"
    >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-bold text-white tracking-tight">Settings</h1>
          <p className="text-slate-400 mt-1">Manage your marketplace preferences</p>
        </motion.div>

        {/* General Settings */}
        <motion.div 
          variants={itemVariants}
          className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <Globe className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">General Settings</h2>
              <p className="text-sm text-slate-500">Basic store configuration</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Store Name</label>
              <input
                type="text"
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white focus:outline-none focus:border-cyan-500/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Support Email</label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white focus:outline-none focus:border-cyan-500/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Currency</label>
              <select
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white focus:outline-none focus:border-cyan-500/50 transition-all"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="Crypto">Crypto</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Timezone</label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white focus:outline-none focus:border-cyan-500/50 transition-all"
              >
                <option value="UTC">UTC</option>
                <option value="EST">Eastern Time</option>
                <option value="PST">Pacific Time</option>
                <option value="GMT">GMT</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Notification Settings */}
        <motion.div 
          variants={itemVariants}
          className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Bell className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Notifications</h2>
              <p className="text-sm text-slate-500">Configure alert preferences</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { key: 'emailNotifs', label: 'Email Notifications', desc: 'Receive updates via email' },
              { key: 'pushNotifs', label: 'Push Notifications', desc: 'Browser push notifications' },
              { key: 'lowStockAlert', label: 'Low Stock Alerts', desc: 'Get notified when products are running low' },
              { key: 'newOrderAlert', label: 'New Order Alerts', desc: 'Instant notification for new orders' },
              { key: 'securityAlerts', label: 'Security Alerts', desc: 'Login and security notifications' },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
                <div>
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                </div>
                <button
                  onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key as keyof typeof notifications] })}
                  className="p-1"
                >
                  {notifications[item.key as keyof typeof notifications] ? (
                    <ToggleRight className="w-10 h-10 text-cyan-400" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-slate-600" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Security Settings */}
        <motion.div 
          variants={itemVariants}
          className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Security</h2>
              <p className="text-sm text-slate-500">Protect your marketplace</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
              <div>
                <p className="text-sm font-medium text-white">Auto-approve Orders</p>
                <p className="text-xs text-slate-500 mt-0.5">Automatically approve orders without review</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, autoApprove: !settings.autoApprove })}
                className="p-1"
              >
                {settings.autoApprove ? (
                  <ToggleRight className="w-10 h-10 text-cyan-400" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-slate-600" />
                )}
              </button>
            </div>
            <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-300">Security Tip</p>
                  <p className="text-xs text-slate-400 mt-1">Always enable two-factor authentication for admin access. Regularly rotate credential access keys.</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.div variants={itemVariants} className="flex justify-end">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all"
          >
            <Save className="w-5 h-5" />
            Save Changes
          </motion.button>
        </motion.div>
      </motion.div>
  );
}
