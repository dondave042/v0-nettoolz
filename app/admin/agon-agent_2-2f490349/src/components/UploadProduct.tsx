import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  X, 
  Plus, 
  Trash2, 
  Image as ImageIcon,
  Package,
  DollarSign,
  Hash,
  FileText,
  User,
  KeyRound,
  Mail,
  MessageSquare,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Product, Platform, Account } from '../types';

interface UploadProductProps {
  onAddProduct: (product: Product) => void;
}

const platforms: { value: Platform; label: string; icon: string }[] = [
  { value: 'instagram', label: 'Instagram', icon: '📸' },
  { value: 'facebook', label: 'Facebook', icon: '📘' },
  { value: 'twitter', label: 'Twitter/X', icon: '🐦' },
  { value: 'tiktok', label: 'TikTok', icon: '🎵' },
  { value: 'youtube', label: 'YouTube', icon: '▶️' },
  { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { value: 'snapchat', label: 'Snapchat', icon: '👻' },
  { value: 'telegram', label: 'Telegram', icon: '✈️' },
  { value: 'other', label: 'Other', icon: '🌐' },
];

const emptyAccount: Omit<Account, 'id'> = {
  username: '',
  password: '',
  email: '',
  notes: '',
  status: 'available'
};

export default function UploadProduct({ onAddProduct }: UploadProductProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Product form state
  const [formData, setFormData] = useState({
    name: '',
    platform: 'instagram' as Platform,
    category: '',
    price: '',
    quantity: '',
    description: '',
    status: 'active' as Product['status']
  });
  
  // Accounts state
  const [accounts, setAccounts] = useState<Omit<Account, 'id'>[]>([{ ...emptyAccount }]);

  const addAccount = () => {
    setAccounts([...accounts, { ...emptyAccount }]);
  };

  const removeAccount = (index: number) => {
    if (accounts.length > 1) {
      setAccounts(accounts.filter((_, i) => i !== index));
    }
  };

  const updateAccount = (index: number, field: keyof Omit<Account, 'id'>, value: string) => {
    const updated = [...accounts];
    updated[index] = { ...updated[index], [field]: value };
    setAccounts(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newProduct: Product = {
      id: Date.now().toString(),
      name: formData.name,
      platform: formData.platform,
      category: formData.category,
      price: parseFloat(formData.price) || 0,
      quantity: parseInt(formData.quantity) || accounts.length,
      status: formData.status,
      description: formData.description,
      createdAt: new Date(),
      updatedAt: new Date(),
      accounts: accounts.map((acc, idx) => ({
        ...acc,
        id: `${Date.now()}-${idx}`
      }))
    };
    
    onAddProduct(newProduct);
    setIsSubmitting(false);
    setShowSuccess(true);
    
    // Reset form after success
    setTimeout(() => {
      setFormData({
        name: '',
        platform: 'instagram',
        category: '',
        price: '',
        quantity: '',
        description: '',
        status: 'active'
      });
      setAccounts([{ ...emptyAccount }]);
      setStep(1);
      setShowSuccess(false);
    }, 2000);
  };

  const isFormValid = formData.name && formData.category && formData.price && accounts.some(a => a.username && a.password);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Upload New Product</h1>
        <p className="text-slate-400 mt-1">Add a new product with account credentials to your inventory</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4 mb-8">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center flex-1">
            <div className={`flex items-center justify-center w-10 h-10 rounded-xl font-semibold text-sm transition-all ${
              step >= s 
                ? 'bg-gradient-to-br from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/30' 
                : 'bg-slate-800 text-slate-500 border border-slate-700'
            }`}>
              {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
            </div>
            <div className={`flex-1 h-1 mx-3 rounded-full ${step > s ? 'bg-gradient-to-r from-cyan-500 to-purple-600' : 'bg-slate-800'}`} />
            <span className={`text-sm font-medium ${step >= s ? 'text-white' : 'text-slate-500'}`}>
              {s === 1 ? 'Product Details' : 'Account Credentials'}
            </span>
            {s < 2 && <div className="flex-1 hidden sm:block" />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Basic Info Card */}
              <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                    <Package className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Basic Information</h2>
                    <p className="text-sm text-slate-500">Enter the main product details</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Product Name *
                    </label>
                    <div className="relative">
                      <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Instagram Premium Accounts"
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Platform *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {platforms.map((platform) => (
                        <button
                          key={platform.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, platform: platform.value })}
                          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                            formData.platform === platform.value
                              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 ring-2 ring-cyan-500/20'
                              : 'bg-slate-800/50 text-slate-400 border border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          <span>{platform.icon}</span>
                          <span className="hidden lg:inline">{platform.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Category *
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g., Premium, Business, Verified"
                      className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Price ($) *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="number"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        placeholder="49.99"
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Quantity (Stock)
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <input
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        placeholder={`Auto: ${accounts.length} accounts`}
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Description
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-4 top-4 w-5 h-5 text-slate-500" />
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe your product..."
                        rows={3}
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-end">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(2)}
                  disabled={!formData.name || !formData.category}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next: Add Accounts
                  <Plus className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Accounts Card */}
              <div className="rounded-2xl bg-slate-900/50 border border-slate-800 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                      <KeyRound className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-white">Account Credentials</h2>
                      <p className="text-sm text-slate-500">Add login details for each account</p>
                    </div>
                  </div>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={addAccount}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30 transition-all text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add Account
                  </motion.button>
                </div>

                {/* Quantity Info Banner */}
                <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/20">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-cyan-300">Quantity-Based Pages</p>
                      <p className="text-xs text-slate-400 mt-1">
                        The number of account entries determines how many product pages will be generated. 
                        Currently adding <span className="text-white font-semibold">{accounts.length}</span> accounts.
                        {formData.quantity && parseInt(formData.quantity) !== accounts.length && (
                          <span className="text-yellow-400"> ⚠️ Quantity ({formData.quantity}) doesn't match accounts count.</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Account Forms */}
                <div className="space-y-4">
                  {accounts.map((account, index) => (
                    <motion.div
                      key={index}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-5 rounded-xl bg-slate-800/30 border border-slate-700/50"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center text-sm font-bold text-cyan-400">
                            #{index + 1}
                          </div>
                          <span className="text-sm font-medium text-white">Account {index + 1}</span>
                        </div>
                        {accounts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeAccount(index)}
                            className="p-2 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1.5">
                            Username *
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                              type="text"
                              value={account.username}
                              onChange={(e) => updateAccount(index, 'username', e.target.value)}
                              placeholder="@username or email"
                              className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-cyan-500/50 transition-all"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1.5">
                            Password *
                          </label>
                          <div className="relative">
                            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                              type="text"
                              value={account.password}
                              onChange={(e) => updateAccount(index, 'password', e.target.value)}
                              placeholder="••••••••"
                              className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-cyan-500/50 transition-all"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1.5">
                            Email (Optional)
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                              type="email"
                              value={account.email || ''}
                              onChange={(e) => updateAccount(index, 'email', e.target.value)}
                              placeholder="email@example.com"
                              className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-cyan-500/50 transition-all"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1.5">
                            Notes (Optional)
                          </label>
                          <div className="relative">
                            <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                            <input
                              type="text"
                              value={account.notes || ''}
                              onChange={(e) => updateAccount(index, 'notes', e.target.value)}
                              placeholder="e.g., 10k followers"
                              className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-slate-900/50 border border-slate-700 text-white placeholder:text-slate-500 text-sm focus:outline-none focus:border-cyan-500/50 transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-800 text-white font-semibold border border-slate-700 hover:bg-slate-700 transition-all"
                >
                  Back
                </motion.button>
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={!isFormValid || isSubmitting}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold shadow-lg shadow-green-500/25 hover:shadow-green-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Upload Product
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-md mx-4 text-center"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Product Uploaded!</h3>
              <p className="text-slate-400">Your product has been successfully added to the inventory.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
