export interface Product {
    id: string
    name: string
    platform:
    | "instagram"
    | "facebook"
    | "twitter"
    | "tiktok"
    | "youtube"
    | "linkedin"
    | "snapchat"
    | "telegram"
    | "other"
    category: string
    price: number
    quantity: number
    status: "active" | "inactive" | "sold_out"
    image?: string
    images?: string[]
    description: string
    accounts: Account[]
    createdAt: Date
    updatedAt: Date
}

export interface Account {
    id: string
    username: string
    password: string
    email?: string
    notes?: string
    status: "available" | "sold" | "reserved"
}

export interface DashboardStats {
    totalProducts: number
    totalAccounts: number
    totalRevenue: number
    activeProducts: number
    soldAccounts: number
    availableAccounts: number
    lowStockProducts: number
}

export type AdminTab = "dashboard" | "products" | "categories" | "upload" | "analytics" | "users" | "settings"

export type Platform = Product["platform"]
