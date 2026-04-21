import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Eye, 
  Trash2, 
  Edit3, 
  ChevronDown,
  Copy,
  Shield,
  Instagram,
  Facebook,
  Twitter,
  Music2,
  Monitor,
  Linkedin,
  Send,
  MoreHorizontal,
  X,
  Lock,
  Unlock
} from 'lucide-react';
import { Product, Platform } from '../types';

interface ProductsTableProps {
  products: Product[];
  onDeleteProduct: (id: string) => void;
  onUpdateProduct: (product: Product) => void;
}

const platformIcons: Record<Platform, React.ReactNode> = {
  instagram: <Instagram className="w-4 h-4" />,
  facebook: <Facebook className="w-4 h-4" />,
  twitter: <Twitter className="w-4 h-4" />,
  tiktok: <Music2 className="w-4 h-4" />,
  youtube: <Monitor className="w-4 h-4" />,
  linkedin: <Linkedin className="w-4 h-4" />,
  snapchat: <MoreHorizontal className="w-4 h-4" />,
  telegram: <Send className="w-4 h-4" />,
  other: <Shield className="w-4 h-4" />,
};

const platformColors: Record<Platform, string> = {
  instagram: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  facebook: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  twitter: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  tiktok: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  youtube: 'bg-red-500/20 text-red-400 border-red-500/30',
  linkedin: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
  snapchat: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  telegram: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  other: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

export default function ProductsTable({ products, onDeleteProduct, onUpdateProduct }: ProductsTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPlatform = filterPlatform === 'all' || product.platform === filterPlatform;
    return matchesSearch && matchesPlatform;
  });

  const togglePasswordVisibility = (accountId: string) => {
    setShowPasswords(prev => ({ ...prev, [accountId]: !prev[accountId] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const toggleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const platforms: (Platform | 'all')[] = ['all', 'instagram', 'facebook', 'twitter', 'tiktok', 'youtube', 'linkedin', 'telegram'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Products & Credentials</h1>
          <p className="text-slate-400 mt-1">Manage your products and view account credentials</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedProducts.size > 0 && (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 text-sm font-medium"
            >
              {selectedProducts.size} selected
            </motion.span>
          )}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            type="text"
            placeholder="Search products by name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className="appearance-none pl-12 pr-10 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all cursor-pointer min-w-[180px]"
          >
            <option value="all">All Platforms</option>
            {platforms.filter(p => p !== 'all').map(platform => (
              <option key={platform} value={platform}>{platform.charAt(0).toUpperCase() + platform.slice(1)}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
        </div>
      </div>

      {/* Products List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredProducts.map((product, index) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.05 }}
              className={`rounded-2xl border backdrop-blur-sm overflow-hidden transition-all duration-300 ${
                expandedProduct === product.id 
                  ? 'bg-slate-900/80 border-cyan-500/30 shadow-lg shadow-cyan-500/10' 
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              } ${selectedProducts.has(product.id) ? 'ring-2 ring-cyan-500/50' : ''}`}
            >
              {/* Product Header */}
              <div 
                className="p-5 cursor-pointer"
                onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)}
              >
                <div className="flex items-center gap-4">
                  {/* Checkbox */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelectProduct(product.id);
                    }}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      selectedProducts.has(product.id)
                        ? 'bg-cyan-500 border-cyan-500'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    {selectedProducts.has(product.id) && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  {/* Platform Icon */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${platformColors[product.platform]}`}>
                    {platformIcons[product.platform]}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-semibold text-white truncate">{product.name}</h3>
                      <span className={`px-2 py-0.5 rounded-md text-xs font-medium border ${
                        product.status === 'active' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        product.status === 'inactive' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' :
                        'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {product.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 mt-0.5 truncate">{product.category} • {product.description.substring(0, 60)}...</p>
                  </div>

                  {/* Stats */}
                  <div className="hidden sm:flex items-center gap-6 mr-4">
                    <div className="text-center">
                      <p className="text-lg font-bold text-white">{product.quantity}</p>
                      <p className="text-xs text-slate-500">Qty</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-cyan-400">${product.price.toFixed(2)}</p>
                      <p className="text-xs text-slate-500">Price</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-purple-400">{product.accounts.length}</p>
                      <p className="text-xs text-slate-500">Accounts</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedProduct(expandedProduct === product.id ? null : product.id);
                      }}
                      className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <motion.div
                        animate={{ rotate: expandedProduct === product.id ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      </motion.div>
                    </button>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-cyan-400"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProduct(product.id);
                      }}
                      className="p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Content - Accounts Table */}
              <AnimatePresence>
                {expandedProduct === product.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-slate-800 bg-slate-950/50">
                      <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-cyan-400" />
                          <span className="text-sm font-medium text-white">Account Credentials</span>
                          <span className="text-xs text-slate-500">({product.accounts.length} accounts)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">
                            Available: <span className="text-green-400">{product.accounts.filter(a => a.status === 'available').length}</span> • 
                            Sold: <span className="text-red-400">{product.accounts.filter(a => a.status === 'sold').length}</span>
                          </span>
                        </div>
                      </div>
                      
                      {/* Quantity-based pagination info */}
                      <div className="px-5 py-2 bg-cyan-500/5 border-b border-cyan-500/10">
                        <p className="text-xs text-cyan-400/80">
                          💡 Showing all {product.accounts.length} account pages based on quantity ({product.quantity} units in stock)
                        </p>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-slate-800">
                              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">#</th>
                              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Username</th>
                              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Password</th>
                              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Notes</th>
                              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/50">
                            {product.accounts.map((account, idx) => (
                              <tr key={account.id} className="hover:bg-slate-800/30 transition-colors">
                                <td className="px-5 py-3 text-sm text-slate-500">{idx + 1}</td>
                                <td className="px-5 py-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-white font-mono">{account.username}</span>
                                    <button
                                      onClick={() => copyToClipboard(account.username)}
                                      className="p-1 rounded hover:bg-slate-700 transition-colors"
                                      title="Copy username"
                                    >
                                      <Copy className="w-3.5 h-3.5 text-slate-500 hover:text-cyan-400" />
                                    </button>
                                  </div>
                                </td>
                                <td className="px-5 py-3">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-sm font-mono ${showPasswords[account.id] ? 'text-white' : 'text-slate-500'}`}>
                                      {showPasswords[account.id] ? account.password : '••••••••••'}
                                    </span>
                                    <button
                                      onClick={() => togglePasswordVisibility(account.id)}
                                      className="p-1 rounded hover:bg-slate-700 transition-colors"
                                      title={showPasswords[account.id] ? 'Hide password' : 'Show password'}
                                    >
                                      {showPasswords[account.id] ? (
                                        <Unlock className="w-3.5 h-3.5 text-cyan-400" />
                                      ) : (
                                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => copyToClipboard(account.password)}
                                      className="p-1 rounded hover:bg-slate-700 transition-colors"
                                      title="Copy password"
                                    >
                                      <Copy className="w-3.5 h-3.5 text-slate-500 hover:text-cyan-400" />
                                    </button>
                                  </div>
                                </td>
                                <td className="px-5 py-3">
                                  <span className="text-sm text-slate-400 font-mono">{account.email || '-'}</span>
                                </td>
                                <td className="px-5 py-3">
                                  <span className="text-sm text-slate-400">{account.notes || '-'}</span>
                                </td>
                                <td className="px-5 py-3">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                                    account.status === 'available' ? 'bg-green-500/10 text-green-400' :
                                    account.status === 'sold' ? 'bg-red-500/10 text-red-400' :
                                    'bg-yellow-500/10 text-yellow-400'
                                  }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                      account.status === 'available' ? 'bg-green-400' :
                                      account.status === 'sold' ? 'bg-red-400' : 'bg-yellow-400'
                                    }`} />
                                    {account.status}
                                  </span>
                                </td>
                                <td className="px-5 py-3">
                                  <div className="flex items-center gap-1">
                                    <button className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors text-slate-400 hover:text-cyan-400">
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                    <button className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors text-slate-400 hover:text-red-400">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-slate-400 text-lg">No products found</p>
            <p className="text-slate-600 text-sm mt-1">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
