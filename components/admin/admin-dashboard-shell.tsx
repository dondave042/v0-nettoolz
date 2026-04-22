"use client"

import { usePathname } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

export function AdminDashboardShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const agonExperienceRoutes = new Set(["/admin", "/admin/products", "/admin/analytics", "/admin/settings"])

    if (pathname && agonExperienceRoutes.has(pathname)) {
        return <div className="min-h-screen bg-background">{children}</div>
    }

    return (
        <div className="flex min-h-screen bg-background">
            <AdminSidebar />
            <main className="flex-1 overflow-auto">
                <div className="mx-auto max-w-7xl px-4 pb-8 pt-20 md:py-8 lg:px-8">{children}</div>
            </main>
        </div>
    )
}