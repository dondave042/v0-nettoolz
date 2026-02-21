"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  Megaphone,
  LogOut,
  Home,
} from "lucide-react"
import { toast } from "sonner"

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" })
    toast.success("Logged out successfully")
    router.push("/admin/login")
  }

  return (
    <aside className="flex w-64 flex-col border-r border-border bg-[#0c4a6e] text-[#e0f2fe]">
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-[#075985] px-5 py-4">
        <Image src="/images/logo.png" alt="NETTOOLZ" width={32} height={32} className="rounded-full" style={{ width: 32, height: "auto" }} />
        <span className="font-bold text-white">NETTOOLZ Admin</span>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 px-3 py-4" aria-label="Admin navigation">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#38bdf8] text-[#0c4a6e]"
                  : "text-[#7dd3fc] hover:bg-[#075985] hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-[#075985] px-3 py-4">
        <Link
          href="/"
          className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#7dd3fc] transition-colors hover:bg-[#075985] hover:text-white"
        >
          <Home className="h-5 w-5" />
          View Site
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#7dd3fc] transition-colors hover:bg-[#075985] hover:text-white"
        >
          <LogOut className="h-5 w-5" />
          Logout
        </button>
      </div>
    </aside>
  )
}
