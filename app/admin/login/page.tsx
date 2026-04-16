import { redirect } from "next/navigation"
import { getAdminSession } from "@/lib/admin-auth"
import { hasAdminUsers } from "@/lib/admin-users"
import AdminLoginPage from "../../api/admin/login/page"

export default async function AdminLoginRoutePage() {
  const session = await getAdminSession()
  if (session) {
    redirect("/admin")
  }

  if (!(await hasAdminUsers())) {
    redirect("/admin/setup")
  }

  return <AdminLoginPage />
}