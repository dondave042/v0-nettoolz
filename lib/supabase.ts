import { createClient } from "@supabase/supabase-js"
import type { Database } from "./supabase-types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser / client-side Supabase client (singleton)
let _browserClient: ReturnType<typeof createClient<Database>> | null = null

export function getSupabaseBrowserClient() {
    if (!_browserClient) {
        _browserClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
            },
        })
    }
    return _browserClient
}

// Server-side Supabase client using the service role key for admin operations
export function getSupabaseServerClient() {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set")
    return createClient<Database>(supabaseUrl, serviceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    })
}

// Convenience alias – anon client for server-side reads that respect RLS
export function getSupabaseAnonClient() {
    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false },
    })
}
