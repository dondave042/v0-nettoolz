// Auto-generated Supabase type definitions for NETTOOLZ
// Run `supabase gen types typescript` to regenerate from your project

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    email: string
                    password_hash: string
                    role: "admin" | "user"
                    full_name: string | null
                    balance: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    email: string
                    password_hash: string
                    role?: "admin" | "user"
                    full_name?: string | null
                    balance?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>
            }
            products: {
                Row: {
                    id: string
                    title: string
                    description: string | null
                    price: number
                    category: string | null
                    stock: number
                    image_url: string | null
                    featured: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    description?: string | null
                    price: number
                    category?: string | null
                    stock?: number
                    image_url?: string | null
                    featured?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>
            }
            orders: {
                Row: {
                    id: string
                    user_id: string
                    status: "pending" | "completed" | "failed"
                    total: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    status?: "pending" | "completed" | "failed"
                    total: number
                    created_at?: string
                    updated_at?: string
                }
                Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>
            }
            order_items: {
                Row: {
                    id: string
                    order_id: string
                    product_id: string
                    qty: number
                    unit_price: number
                }
                Insert: {
                    id?: string
                    order_id: string
                    product_id: string
                    qty: number
                    unit_price: number
                }
                Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>
            }
            balance_transactions: {
                Row: {
                    id: string
                    user_id: string
                    type: "credit" | "debit"
                    amount: number
                    note: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    type: "credit" | "debit"
                    amount: number
                    note?: string | null
                    created_at?: string
                }
                Update: Partial<Database["public"]["Tables"]["balance_transactions"]["Insert"]>
            }
            cart_items: {
                Row: {
                    id: string
                    user_id: string
                    product_id: string
                    qty: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    product_id: string
                    qty: number
                    created_at?: string
                }
                Update: Partial<Database["public"]["Tables"]["cart_items"]["Insert"]>
            }
            support_tickets: {
                Row: {
                    id: string
                    user_id: string | null
                    subject: string
                    message: string
                    status: "open" | "in_progress" | "resolved" | "closed"
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id?: string | null
                    subject: string
                    message: string
                    status?: "open" | "in_progress" | "resolved" | "closed"
                    created_at?: string
                    updated_at?: string
                }
                Update: Partial<Database["public"]["Tables"]["support_tickets"]["Insert"]>
            }
        }
        Views: {}
        Functions: {}
        Enums: {}
    }
}

// Convenience row-level types
export type UserRow = Database["public"]["Tables"]["users"]["Row"]
export type ProductRow = Database["public"]["Tables"]["products"]["Row"]
export type OrderRow = Database["public"]["Tables"]["orders"]["Row"]
export type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"]
export type BalanceTransactionRow = Database["public"]["Tables"]["balance_transactions"]["Row"]
export type CartItemRow = Database["public"]["Tables"]["cart_items"]["Row"]
export type SupportTicketRow = Database["public"]["Tables"]["support_tickets"]["Row"]
