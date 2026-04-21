import { Product, DashboardStats } from '../types';

export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Instagram Premium Accounts',
    platform: 'instagram',
    category: 'Premium',
    price: 49.99,
    quantity: 15,
    status: 'active',
    description: 'High-quality Instagram accounts with real followers and engagement history',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-20'),
    accounts: [
      { id: 'a1', username: 'sarah_lifestyle', password: 'Inst@2024x', email: 'sarah.l@email.com', notes: '10k followers', status: 'available' },
      { id: 'a2', username: 'travel_mike', password: 'Tr@vel99!', email: 'mike.t@email.com', notes: '25k followers', status: 'available' },
      { id: 'a3', username: 'foodie_anna', password: 'F00d!e22', email: 'anna.f@email.com', notes: '8k followers', status: 'sold' },
      { id: 'a4', username: 'fitness_pro', password: 'F1tn3ss#1', email: 'fit.pro@email.com', notes: '50k followers', status: 'available' },
      { id: 'a5', username: 'tech_guru', password: 'T3ch@Guru', email: 'tech.guru@email.com', notes: '100k followers', status: 'reserved' },
    ]
  },
  {
    id: '2',
    name: 'Facebook Business Pages',
    platform: 'facebook',
    category: 'Business',
    price: 79.99,
    quantity: 8,
    status: 'active',
    description: 'Verified Facebook business pages with established audience',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-10'),
    accounts: [
      { id: 'b1', username: 'TechReviews FB Page', password: 'FB@Biz2024', email: 'techreviews@biz.com', notes: '5k likes', status: 'available' },
      { id: 'b2', username: 'Local Eats Guide', password: 'E@ts#Guide', email: 'localeats@biz.com', notes: '12k followers', status: 'available' },
      { id: 'b3', username: 'Fitness Motivation', password: 'F1tMotiv8', email: 'fitness.motiv@biz.com', notes: '30k followers', status: 'available' },
    ]
  },
  {
    id: '3',
    name: 'Twitter/X Verified Accounts',
    platform: 'twitter',
    category: 'Verified',
    price: 149.99,
    quantity: 5,
    status: 'active',
    description: 'Blue verified Twitter/X accounts with organic following',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-18'),
    accounts: [
      { id: 'c1', username: '@cryptoanalyst', password: 'X$Verif1ed', email: 'crypto@analyst.com', notes: 'Blue badge, 20k followers', status: 'available' },
      { id: 'c2', username: '@newsbreaker', password: 'N3wsBr3ak!', email: 'news@breaker.com', notes: 'Blue badge, 45k followers', status: 'available' },
    ]
  },
  {
    id: '4',
    name: 'TikTok Creator Accounts',
    platform: 'tiktok',
    category: 'Creator',
    price: 29.99,
    quantity: 25,
    status: 'active',
    description: 'Viral TikTok creator accounts with high engagement rates',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-05'),
    accounts: [
      { id: 'd1', username: '@dancequeen_tiktok', password: 'T1kD@nce!', email: 'dancequeen@tik.com', notes: '500k followers', status: 'available' },
      { id: 'd2', username: '@comedyking_official', password: 'C0medy#K1ng', email: 'comedyking@tik.com', notes: '1M followers', status: 'sold' },
      { id: 'd3', username: '@cooking_hacks', password: 'C00kH@cks', email: 'cooking@tik.com', notes: '200k followers', status: 'available' },
      { id: 'd4', username: '@gaming_pro_tik', password: 'G@m3rPr0!', email: 'gamingpro@tik.com', notes: '750k followers', status: 'available' },
    ]
  },
  {
    id: '5',
    name: 'YouTube Channels',
    platform: 'youtube',
    category: 'Monetized',
    price: 299.99,
    quantity: 3,
    status: 'active',
    description: 'Monetized YouTube channels with consistent views',
    createdAt: new Date('2024-03-10'),
    updatedAt: new Date('2024-03-12'),
    accounts: [
      { id: 'e1', username: 'Tech Unboxed YT', password: 'YTUnb0xed#', email: 'techunboxed@yt.com', notes: '100k subs, monetized', status: 'available' },
      { id: 'e2', username: 'Gaming Zone Pro', password: 'G@mingZ0ne', email: 'gamingzone@yt.com', notes: '250k subs, monetized', status: 'available' },
    ]
  },
  {
    id: '6',
    name: 'LinkedIn Premium Profiles',
    platform: 'linkedin',
    category: 'Professional',
    price: 199.99,
    quantity: 10,
    status: 'inactive',
    description: 'LinkedIn profiles with premium features and connections',
    createdAt: new Date('2024-03-15'),
    updatedAt: new Date('2024-03-16'),
    accounts: [
      { id: 'f1', username: 'John Marketing Pro', password: 'L1nk3dIn#1', email: 'john.marketing@pro.com', notes: '500+ connections', status: 'available' },
      { id: 'f2', username: 'Sarah Executive', password: 'Ex3cutiv3$', email: 'sarah.exec@pro.com', notes: '1000+ connections', status: 'available' },
    ]
  },
  {
    id: '7',
    name: 'Telegram Premium Groups',
    platform: 'telegram',
    category: 'Community',
    price: 39.99,
    quantity: 20,
    status: 'active',
    description: 'Active Telegram groups with engaged members',
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date('2024-04-05'),
    accounts: [
      { id: 'g1', username: 'Crypto Signals Elite', password: 'T3lGr@m#1', email: '', notes: '50k members', status: 'available' },
        { id: 'g2', username: 'Trading Masters Hub', password: 'Tr@d3M@st3r', email: '', notes: '25k members', status: 'available' },
        { id: 'g3', username: 'Tech News Daily', password: 'T3chN3ws!', email: '', notes: '100k members', status: 'sold' },
      ]
  },
];

export const getDashboardStats = (products: Product[]): DashboardStats => {
  const totalProducts = products.length;
  const totalAccounts = products.reduce((sum, p) => sum + p.accounts.length, 0);
  const totalRevenue = products.reduce((sum, p) => {
    const soldCount = p.accounts.filter(a => a.status === 'sold').length;
    return sum + (soldCount * p.price);
  }, 0);
  const activeProducts = products.filter(p => p.status === 'active').length;
  const soldAccounts = products.reduce((sum, p) => sum + p.accounts.filter(a => a.status === 'sold').length, 0);
  const availableAccounts = products.reduce((sum, p) => sum + p.accounts.filter(a => a.status === 'available').length, 0);
  const lowStockProducts = products.filter(p => p.quantity <= 5 && p.status === 'active').length;

  return {
    totalProducts,
    totalAccounts,
    totalRevenue,
    activeProducts,
    soldAccounts,
    availableAccounts,
    lowStockProducts
  };
};
