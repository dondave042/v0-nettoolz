"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  LogOut,
  Home,
  CreditCard,
  BarChart3,
  Menu,
  X,
  Settings,
} from "lucide-react"
import { toast } from "sonner"

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/payment-methods", label: "Payment Methods", icon: CreditCard },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" })
    toast.success("Logged out successfully")
    setMobileOpen(false)
    router.push("/admin/login")
  }

  function isLinkActive(href: string) {
    if (href === "/admin") return pathname === href
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  const navigation = (
    <>
      <div className="flex items-center gap-3 border-b border-[#075985] px-5 py-4">
        <img src="/images/logo.png" alt="NETTOOLZ" className="h-8 w-8 rounded-full" />
        <span className="font-bold text-white">NETTOOLZ Admin</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4" aria-label="Admin navigation">
        {links.map(({ href, label, icon: Icon }) => {
          const isActive = isLinkActive(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
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

      <div className="border-t border-[#075985] px-3 py-4">
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
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
    </>
  )

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-md border border-border p-2 text-foreground"
          aria-label="Open admin menu"
        >
          <Menu className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-foreground">NETTOOLZ Admin</span>
        <div className="w-8" />
      </div>

      <aside className="hidden w-64 flex-col border-r border-border bg-[#0c4a6e] text-[#e0f2fe] md:flex">
        {navigation}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="Close admin menu"
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-border bg-[#0c4a6e] text-[#e0f2fe] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#075985] px-5 py-4">
              <span className="font-bold text-white">Menu</span>
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5 text-[#7dd3fc]" />
              </button>
            </div>
            {navigation}
          </aside>
        </div>
      )}
    </>
  )
}
