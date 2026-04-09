 "use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Menu, X, ShoppingCart, Bell } from "lucide-react"
import { useCart } from "@/lib/cart-context"
import { CartDrawer } from "@/components/cart-drawer"
import { toast } from "sonner"

interface UserHeaderProps {
  onMenuToggle?: (open: boolean) => void
  userName?: string
}

export function UserHeader({ onMenuToggle, userName = "Guest" }: UserHeaderProps) {
  const router = useRouter()
  const { totalItems } = useCart()
  const [cartOpen, setCartOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await fetch("/api/buyers/logout", { method: "POST" })
      toast.success("Logged out successfully")
      router.push("/")
    } catch (error) {
      toast.error("Failed to logout")
    }
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Left: Logo and Menu Toggle */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => onMenuToggle?.(true)}
                className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
              >
                <Menu className="h-6 w-6" />
              </button>
              <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#38bdf8] to-[#0284c7] flex items-center justify-center text-white font-bold text-sm">
                  NT
                </div>
                <span className="font-bold text-foreground hidden sm:inline">NETTOOLZ</span>
              </Link>
            </div>

            {/* Center: Navigation (Desktop only) */}
            <nav className="hidden lg:flex items-center gap-6 text-sm">
              <Link href="/" className="text-muted-foreground hover:text-[#38bdf8] transition-colors">
                Home
              </Link>
              <Link href="/#products" className="text-muted-foreground hover:text-[#38bdf8] transition-colors">
                Shop
              </Link>
              <Link href="/my-purchases" className="text-muted-foreground hover:text-[#38bdf8] transition-colors">
                Orders
              </Link>
              <Link href="/dashboard/support" className="text-muted-foreground hover:text-[#38bdf8] transition-colors">
                Support
              </Link>
            </nav>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCartOpen(true)}
                className="relative p-2 text-muted-foreground hover:text-[#38bdf8] transition-colors"
              >
                <ShoppingCart className="h-6 w-6" />
                {totalItems > 0 && (
                  <span className="absolute top-0 right-0 h-5 w-5 rounded-full bg-[#38bdf8] text-white text-xs font-bold flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>

              <button className="p-2 text-muted-foreground hover:text-[#38bdf8] transition-colors">
                <Bell className="h-6 w-6" />
              </button>

              <div className="hidden sm:flex items-center gap-3 border-l border-border pl-3">
                <div className="text-right text-sm">
                  <p className="font-medium text-foreground">{userName}</p>
                  <p className="text-xs text-muted-foreground">User</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-red-600 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      </header>
    </>
  )
}
