import { redirect } from "next/navigation"
import { isAuthenticated } from "@/lib/auth"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    redirect("/admin/login")
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">{children}</div>
      </main>
    </div>
  )
}
