"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Menu, X, ShoppingCart, Search, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart-context"
import { CartDrawer } from "@/components/cart-drawer"
import { toast } from "sonner"

const navLinks = [
  { label: "Shop", href: "/" },
  { label: "Orders", href: "/orders" },
  { label: "Wallet", href: "/wallet" },
  { label: "Support", href: "/support" },
]

interface BuyerSession {
  id: number
  email: string
  name: string
}

export function SiteHeader() {
  const router = useRouter()
  const { totalItems } = useCart()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [buyer, setBuyer] = useState<BuyerSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/buyers/me')
        if (res.ok) {
          const data = await res.json()
          setBuyer(data.buyer)
        }
      } catch (error) {
        console.error('[v0] Failed to check buyer session:', error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  const handleLogout = async () => {
    try {
      await fetch('/api/buyers/logout', { method: 'POST' })
      setBuyer(null)
      toast.success('Logged out successfully')
      router.push('/')
    } catch (error) {
      console.error('[v0] Logout error:', error)
      toast.error('Failed to logout')
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-md supports-[backdrop-filter]:bg-card/80 shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img
            src="/images/logo.png"
            alt="NETTOOLZ logo"
            className="h-10 w-10 rounded-full object-cover"
          />
          <span className="font-[var(--font-heading)] text-xl font-bold tracking-tight text-foreground">
            NETTOOLZ
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-2 md:flex" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-[#38bdf8]/10 hover:text-[#0284c7] active:bg-[#38bdf8]/20"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Cart Button */}
          <div className="relative hidden md:flex">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCartOpen(!cartOpen)}
              aria-label="Cart"
              className="relative"
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#38bdf8] text-xs font-bold text-white">
                  {totalItems}
                </span>
              )}
            </Button>
          </div>

          {/* Auth Buttons */}
          {!loading && (
            <div className="hidden items-center gap-2 md:flex">
              {buyer ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Welcome, {buyer.name}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/dashboard')}
                  >
                    Dashboard
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="gap-1"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push('/login')}
                  >
                    Login
                  </Button>
                  <Button
                    size="sm"
                    className="bg-[#38bdf8] text-white hover:bg-[#0ea5e9]"
                    onClick={() => router.push('/signup')}
                  >
                    Sign Up
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <nav className="border-t border-border bg-card px-4 pb-4 md:hidden" aria-label="Mobile navigation">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="border-t border-border pt-3 mt-3 space-y-2">
            {/* Mobile Cart */}
            <button
              onClick={() => {
                setCartOpen(true)
                setMobileOpen(false)
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
            >
              <ShoppingCart className="h-4 w-4" />
              Cart {totalItems > 0 && `(${totalItems})`}
            </button>

            {/* Mobile Auth */}
            {!loading && (
              <>
                {buyer ? (
                  <>
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      Welcome, {buyer.name}
                    </div>
                    <button
                      onClick={() => {
                        router.push('/dashboard')
                        setMobileOpen(false)
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-lg px-3 py-2.5 text-sm font-medium text-[#38bdf8] transition-colors hover:bg-secondary"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </nav>
      )}

      {/* Cart Drawer */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </header>
  )
}
