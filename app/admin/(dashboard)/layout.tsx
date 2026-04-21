import { redirect } from "next/navigation"
import { isAuthenticated } from "@/lib/auth"
import { AdminDashboardShell } from "@/components/admin/admin-dashboard-shell"

export default async function AdminDashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const authenticated = await isAuthenticated()
    if (!authenticated) {
        redirect("/admin/login")
    }

    return <AdminDashboardShell>{children}</AdminDashboardShell>
}
