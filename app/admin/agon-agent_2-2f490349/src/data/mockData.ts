import { DashboardStats, Product } from "../types"

export const mockProducts: Product[] = [
    {
        id: "1",
        name: "Instagram Premium Accounts",
        platform: "instagram",
        category: "Premium",
        price: 7500,
        quantity: 15,
        status: "active",
        description: "High-quality Instagram accounts with real followers and engagement history",
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-20"),
        accounts: [
            { id: "a1", username: "sarah_lifestyle", password: "Inst@2024x", email: "sarah.l@email.com", notes: "10k followers", status: "available" },
            { id: "a2", username: "travel_mike", password: "Tr@vel99!", email: "mike.t@email.com", notes: "25k followers", status: "available" },
            { id: "a3", username: "foodie_anna", password: "F00d!e22", email: "anna.f@email.com", notes: "8k followers", status: "sold" },
            { id: "a4", username: "fitness_pro", password: "F1tn3ss#1", email: "fit.pro@email.com", notes: "50k followers", status: "available" },
            { id: "a5", username: "tech_guru", password: "T3ch@Guru", email: "tech.guru@email.com", notes: "100k followers", status: "reserved" },
        ],
    },
    {
        id: "2",
        name: "Facebook Business Pages",
        platform: "facebook",
        category: "Business",
        price: 12500,
        quantity: 8,
        status: "active",
        description: "Verified Facebook business pages with established audience",
        createdAt: new Date("2024-02-01"),
        updatedAt: new Date("2024-02-10"),
        accounts: [
            { id: "b1", username: "TechReviews FB Page", password: "FB@Biz2024", email: "techreviews@biz.com", notes: "5k likes", status: "available" },
            { id: "b2", username: "Local Eats Guide", password: "E@ts#Guide", email: "localeats@biz.com", notes: "12k followers", status: "available" },
            { id: "b3", username: "Fitness Motivation", password: "F1tMotiv8", email: "fitness.motiv@biz.com", notes: "30k followers", status: "available" },
        ],
    },
    {
        id: "3",
        name: "Twitter/X Verified Accounts",
        platform: "twitter",
        category: "Verified",
        price: 25000,
        quantity: 5,
        status: "active",
        description: "Blue verified Twitter/X accounts with organic following",
        createdAt: new Date("2024-02-15"),
        updatedAt: new Date("2024-02-18"),
        accounts: [
            { id: "c1", username: "@cryptoanalyst", password: "X$Verif1ed", email: "crypto@analyst.com", notes: "Blue badge, 20k followers", status: "available" },
            { id: "c2", username: "@newsbreaker", password: "N3wsBr3ak!", email: "news@breaker.com", notes: "Blue badge, 45k followers", status: "available" },
        ],
    },
    {
        id: "4",
        name: "TikTok Creator Accounts",
        platform: "tiktok",
        category: "Creator",
        price: 5000,
        quantity: 25,
        status: "active",
        description: "Viral TikTok creator accounts with high engagement rates",
        createdAt: new Date("2024-03-01"),
        updatedAt: new Date("2024-03-05"),
        accounts: [
            { id: "d1", username: "@dancequeen_tiktok", password: "T1kD@nce!", email: "dancequeen@tik.com", notes: "500k followers", status: "available" },
            { id: "d2", username: "@comedyking_official", password: "C0medy#K1ng", email: "comedyking@tik.com", notes: "1M followers", status: "sold" },
            { id: "d3", username: "@cooking_hacks", password: "C00kH@cks", email: "cooking@tik.com", notes: "200k followers", status: "available" },
            { id: "d4", username: "@gaming_pro_tik", password: "G@m3rPr0!", email: "gamingpro@tik.com", notes: "750k followers", status: "available" },
        ],
    },
    {
        id: "5",
        name: "YouTube Channels",
        platform: "youtube",
        category: "Monetized",
        price: 45000,
        quantity: 3,
        status: "active",
        description: "Monetized YouTube channels with consistent views",
        createdAt: new Date("2024-03-10"),
        updatedAt: new Date("2024-03-12"),
        accounts: [
            { id: "e1", username: "Tech Unboxed YT", password: "YTUnb0xed#", email: "techunboxed@yt.com", notes: "100k subs, monetized", status: "available" },
            { id: "e2", username: "Gaming Zone Pro", password: "G@mingZ0ne", email: "gamingzone@yt.com", notes: "250k subs, monetized", status: "available" },
        ],
    },
]

export const getDashboardStats = (products: Product[]): DashboardStats => {
    const totalProducts = products.length
    const totalAccounts = products.reduce((sum, product) => sum + product.accounts.length, 0)
    const totalRevenue = products.reduce((sum, product) => {
        const soldCount = product.accounts.filter((account) => account.status === "sold").length
        return sum + soldCount * product.price
    }, 0)
    const activeProducts = products.filter((product) => product.status === "active").length
    const soldAccounts = products.reduce(
        (sum, product) => sum + product.accounts.filter((account) => account.status === "sold").length,
        0
    )
    const availableAccounts = products.reduce(
        (sum, product) => sum + product.accounts.filter((account) => account.status === "available").length,
        0
    )
    const lowStockProducts = products.filter((product) => product.quantity <= 5 && product.status === "active").length

    return {
        totalProducts,
        totalAccounts,
        totalRevenue,
        activeProducts,
        soldAccounts,
        availableAccounts,
        lowStockProducts,
    }
}