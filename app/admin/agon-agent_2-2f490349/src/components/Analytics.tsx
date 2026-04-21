import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  PieChart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Clock,
  DollarSign,
  Users
} from 'lucide-react';
import { Product } from '../types';

interface AnalyticsProps {
  products: Product[];
}

export default function Analytics({ products }: AnalyticsProps) {
  // Calculate analytics data
  const totalRevenue = products.reduce((sum, p) => {
    const soldCount = p.accounts.filter(a => a.status === 'sold').length;
    return sum + (soldCount * p.price);
  }, 0);

  const totalPotentialRevenue = products.reduce((sum, p) => sum + (p.accounts.length * p.price), 0);
  
  const platformRevenue = products.reduce((acc, p) => {
    const revenue = p.accounts.filter(a => a.status === 'sold').length * p.price;
    acc[p.platform] = (acc[p.platform] || 0) + revenue;
    return acc;
  }, {} as Record<string, number>);

  const monthlyData = [
    { month: 'Jan', sales: 12, revenue: 599.88 },
    { month: 'Feb', sales: 19, revenue: 949.82 },
    { month: 'Mar', sales: 15, revenue: 749.85 },
    { month: 'Apr', sales: 25, revenue: 1249.75 },
    { month: 'May', sales: 32, revenue: 1599.68 },
    { month: 'Jun', sales: 28, revenue: 1399.72 },
  ];

  const maxSales = Math.max(...monthlyData.map(d => d.sales));

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
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
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold text-white tracking-tight">Analytics</h1>
        <p className="text-slate-400 mt-1">Detailed insights into your marketplace performance</p>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: 'Total Revenue', value: `$${totalRevenue.toLocaleString()}`, change: '+18.2%', up: true, icon: DollarSign, color: 'from-green-500 to-emerald-500' },
          { label: 'Potential Revenue', value: `$${totalPotentialRevenue.toLocaleString()}`, change: '+24.5%', up: true, icon: TrendingUp, color: 'from-cyan-500 to-blue-500' },
          { label: 'Avg. Order Value', value: `$${products.length > 0 ? (totalRevenue / products.reduce((s, p) => s + p.accounts.filter(a => a.status === 'sold').length, 1)).toFixed(2) : '0'}`, change: '+5.3%', up: true, icon: BarChart3, color: 'from-purple-500 to-pink-500' },
          { label: 'Conversion Rate', value: `${((products.reduce((s, p) => s + p.accounts.filter(a => a.status === 'sold').length, 0) / Math.max(1, products.reduce((s, p) => s + p.accounts.length, 0))) * 100).toFixed(1)}%`, change: '-2.1%', up: false, icon: Activity, color: 'from-orange-500 to-amber-500' },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={idx}
              whileHover={{ y: -4 }}
              className="rounded-2xl bg-slate-900/50 border border-slate-800 p-5 backdrop-blur-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${kpi.up ? 'text-green-400' : 'text-red-400'}`}>
                  {kpi.up ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {kpi.change}
                </div>
              </div>
              <p className="text-2xl font-bold text-white">{kpi.value}</p>
              <p className="text-sm text-slate-500 mt-1">{kpi.label}</p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <motion.div 
          variants={itemVariants}
          className="lg:col-span-2 rounded-2xl bg-slate-900/50 border border-slate-800 p-6 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Sales Overview</h2>
              <p className="text-sm text-slate-500">Monthly sales performance</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-300">Last 6 months</span>
            </div>
          </div>
          
          {/* Simple Bar Chart */}
          <div className="flex items-end gap-3 h-64 pt-8">
            {monthlyData.map((data, idx) => (
              <div key={data.month} className="flex-1 flex flex-col items-center gap-2">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(data.sales / maxSales) * 100}%` }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  className="w-full max-w-[50px] rounded-t-lg bg-gradient-to-t from-cyan-500 to-purple-500 relative group cursor-pointer"
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-slate-800 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {data.sales} sales
                  </div>
                </motion.div>
                <span className="text-xs text-slate-500 font-medium">{data.month}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Platform Performance */}
        <motion.div 
          variants={itemVariants}
          className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6 backdrop-blur-sm"
        >
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white">Top Platforms</h2>
            <p className="text-sm text-slate-500">Revenue by platform</p>
          </div>
          
          <div className="space-y-4">
            {Object.entries(platformRevenue)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([platform, revenue], idx) => {
                const maxRev = Math.max(...Object.values(platformRevenue), 1);
                const colors = ['from-pink-500 to-rose-500', 'from-blue-500 to-blue-600', 'from-sky-400 to-blue-500', 'from-red-500 to-red-600', 'from-gray-600 to-gray-700'];
                
                return (
                  <div key={platform} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-md bg-gradient-to-br ${colors[idx]} flex items-center justify-center text-xs font-bold text-white`}>
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium text-white capitalize">{platform}</span>
                      </div>
                      <span className="text-sm font-semibold text-cyan-400">${revenue.toFixed(2)}</span>
                    </div>
                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(revenue / maxRev) * 100}%` }}
                        transition={{ delay: idx * 0.1, duration: 0.5 }}
                        className={`h-full bg-gradient-to-r ${colors[idx]} rounded-full`}
                      />
                    </div>
                  </div>
                );
              })}
          </div>
        </motion.div>
      </div>

      {/* Recent Transactions Table */}
      <motion.div 
        variants={itemVariants}
        className="rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm overflow-hidden"
      >
        <div className="px-6 py-5 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">Recent Transactions</h2>
          <p className="text-sm text-slate-500">Latest account purchases</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Transaction ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Account</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {products.slice(0, 5).flatMap(p => 
                p.accounts.filter(a => a.status === 'sold').slice(0, 1).map(a => ({
                  id: `TXN-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                  product: p.name,
                  account: a.username,
                  amount: p.price,
                  date: new Date().toLocaleDateString()
                }))
              ).map((txn, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-mono text-cyan-400">{txn.id}</td>
                  <td className="px-6 py-4 text-sm text-white">{txn.product}</td>
                  <td className="px-6 py-4 text-sm text-slate-300">{txn.account}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-green-400">${txn.amount.toFixed(2)}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-green-500/10 text-green-400">Completed</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">{txn.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
