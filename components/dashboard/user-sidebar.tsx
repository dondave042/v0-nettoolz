"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ShoppingCart,
  CreditCard,
  Heart,
  HelpCircle,
  LogOut,
  X,
} from "lucide-react"

interface UserSidebarProps {
  onClose?: () => void
  open?: boolean
  userBalance?: number
}

const userLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/my-purchases", label: "Order History", icon: ShoppingCart },
  { href: "/transactions", label: "Transactions", icon: CreditCard },
  { href: "/dashboard/wishlist", label: "Wishlist", icon: Heart },
  { href: "/dashboard/support", label: "Support", icon: HelpCircle },
]

export function UserSidebar({ onClose, open = true, userBalance = 0 }: UserSidebarProps) {
  const pathname = usePathname()

  if (!open) return null

  return (
    <>
      {/* Overlay for mobile */}
      <div
        className="fixed inset-0 z-40 bg-black/50 md:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 z-50 flex flex-col border-r border-border bg-gradient-to-b from-[#0c4a6e] to-[#075985] text-[#e0f2fe] overflow-y-auto md:static md:z-auto">
        {/* Brand */}
        <div className="flex items-center justify-between gap-3 border-b border-[#075985] px-5 py-4">
          <div>
            <h2 className="font-bold text-white text-sm">NETTOOLZ</h2>
            <p className="text-xs text-[#7dd3fc]">User Dashboard</p>
            <div className="mt-2 inline-flex items-center rounded-full border border-[#38bdf8]/40 bg-[#0b3d5a] px-2.5 py-1 text-[11px] font-semibold text-[#7dd3fc] md:hidden">
              Balance: ₦{userBalance.toLocaleString()}
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-[#7dd3fc] hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1" aria-label="User navigation">
          {userLinks.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/")
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[#38bdf8] text-[#0c4a6e] shadow-lg"
                    : "text-[#7dd3fc] hover:bg-[#075985] hover:text-white"
                }`}
                onClick={onClose}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Bottom action */}
        <div className="border-t border-[#075985] px-3 py-4">
          <button
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#7dd3fc] transition-all hover:bg-[#075985] hover:text-white"
            onClick={() => {
              // Logout logic will be handled by parent
              onClose?.()
            }}
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  )
}
