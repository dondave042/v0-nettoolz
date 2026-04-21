import { motion } from 'framer-motion';
import { 
  Package, 
  DollarSign, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Product } from '../types';
import { getDashboardStats } from '../data/mockData';

interface DashboardProps {
  products: Product[];
}

const statCards = [
  { key: 'totalProducts', label: 'Total Products', icon: Package, color: 'from-cyan-500 to-blue-500', bgColor: 'bg-cyan-500/10', textColor: 'text-cyan-400' },
  { key: 'totalAccounts', label: 'Total Accounts', icon: Users, color: 'from-purple-500 to-pink-500', bgColor: 'bg-purple-500/10', textColor: 'text-purple-400' },
  { key: 'totalRevenue', label: 'Total Revenue', icon: DollarSign, color: 'from-green-500 to-emerald-500', bgColor: 'bg-green-500/10', textColor: 'text-green-400', prefix: '$' },
  { key: 'activeProducts', label: 'Active Products', icon: CheckCircle2, color: 'from-orange-500 to-amber-500', bgColor: 'bg-orange-500/10', textColor: 'text-orange-400' },
  { key: 'soldAccounts', label: 'Sold Accounts', icon: ShoppingCart, color: 'from-red-500 to-rose-500', bgColor: 'bg-red-500/10', textColor: 'text-red-400' },
  { key: 'lowStockProducts', label: 'Low Stock Alert', icon: AlertTriangle, color: 'from-yellow-500 to-orange-500', bgColor: 'bg-yellow-500/10', textColor: 'text-yellow-400' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function Dashboard({ products }: DashboardProps) {
  const stats = getDashboardStats(products);

  // Recent activity simulation
  const recentActivity = products.slice(0, 5).flatMap(p => 
    p.accounts.slice(0, 2).map(a => ({
      product: p.name,
      account: a.username,
      status: a.status,
      time: Math.floor(Math.random() * 60) + 1 + 'm ago'
    }))
  );

  // Platform distribution
  const platformCounts = products.reduce((acc, p) => {
    acc[p.platform] = (acc[p.platform] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-slate-400 mt-1">Welcome back! Here's your marketplace overview.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <TrendingUp className="w-4 h-4 text-green-400" />
          <span className="text-sm text-slate-300">Live</span>
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const value = stats[stat.key as keyof typeof stats];
          const displayValue = stat.prefix ? `${stat.prefix}${value.toLocaleString()}` : value.toLocaleString();
          
          return (
            <motion.div
              key={stat.key}
              whileHover={{ y: -4, scale: 1.02 }}
              className={`relative overflow-hidden rounded-2xl ${stat.bgColor} border border-slate-700/50 p-5 backdrop-blur-sm`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.textColor} mt-2`}>{displayValue}</p>
                </div>
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3 text-green-400" />
                <span className="text-xs text-green-400 font-medium">+12.5%</span>
                <span className="text-xs text-slate-500 ml-1">vs last week</span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <motion.div 
          variants={itemVariants}
          className="lg:col-span-2 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
              <p className="text-sm text-slate-500">Latest account transactions</p>
            </div>
            <button className="text-sm text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
              View All
            </button>
          </div>
          <div className="divide-y divide-slate-800/50">
            {recentActivity.map((activity, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="px-6 py-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    activity.status === 'sold' ? 'bg-red-500/10' : 
                    activity.status === 'reserved' ? 'bg-yellow-500/10' : 'bg-green-500/10'
                  }`}>
                    <Users className={`w-5 h-5 ${
                      activity.status === 'sold' ? 'text-red-400' : 
                      activity.status === 'reserved' ? 'text-yellow-400' : 'text-green-400'
                    }`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{activity.account}</p>
                    <p className="text-xs text-slate-500">{activity.product}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                    activity.status === 'sold' ? 'bg-red-500/10 text-red-400' :
                    activity.status === 'reserved' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-green-500/10 text-green-400'
                  }`}>
                    {activity.status}
                  </span>
                  <span className="text-xs text-slate-500">{activity.time}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Platform Distribution */}
        <motion.div 
          variants={itemVariants}
          className="rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Platform Distribution</h2>
          <div className="space-y-4">
            {Object.entries(platformCounts).map(([platform, count]) => {
              const percentage = (count / products.length) * 100;
              const colors: Record<string, string> = {
                instagram: 'from-pink-500 to-rose-500',
                facebook: 'from-blue-500 to-blue-600',
                twitter: 'from-sky-400 to-blue-500',
                tiktok: 'from-gray-700 to-gray-900',
                youtube: 'from-red-500 to-red-600',
                linkedin: 'from-blue-600 to-blue-700',
                telegram: 'from-sky-500 to-blue-500',
                snapchat: 'from-yellow-400 to-orange-500',
                other: 'from-slate-500 to-slate-600',
              };
              
              return (
                <div key={platform}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-slate-300 capitalize">{platform}</span>
                    <span className="text-sm text-slate-500">{count} products</span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className={`h-full bg-gradient-to-r ${colors[platform] || colors.other} rounded-full`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Quick Stats Row */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-cyan-500/20 p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
              <DollarSign className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Available Inventory Value</p>
              <p className="text-2xl font-bold text-white mt-1">
                ${(stats.availableAccounts * 49.99).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Conversion Rate</p>
              <p className="text-2xl font-bold text-white mt-1">
                {stats.totalAccounts > 0 ? ((stats.soldAccounts / stats.totalAccounts) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
