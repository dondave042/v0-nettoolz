"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  Heart,
  Zap,
  ArrowRight,
  CreditCard,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserHeader } from "@/components/dashboard/user-header"
import { UserSidebar } from "@/components/dashboard/user-sidebar"
import { Card } from "@/components/dashboard/card"
import { DashboardFooter } from "@/components/dashboard/footer"
import { toast } from "sonner"

interface UserStats {
  totalOrders: number
  pendingOrders: number
  totalSpent: number
  wishlistItems: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userName, setUserName] = useState("User")
  const [stats, setStats] = useState<UserStats>({
    totalOrders: 0,
    pendingOrders: 0,
    totalSpent: 0,
    wishlistItems: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/buyers/me")
        if (res.ok) {
          const data = await res.json()
          setUserName(data.buyer?.name || "User")

          // Fetch user stats
          const statsRes = await fetch("/api/buyers/stats")
          if (statsRes.ok) {
            const statsData = await statsRes.json()
            setStats({
              totalOrders: statsData.totalOrders || 0,
              pendingOrders: statsData.pendingOrders || 0,
              totalSpent: statsData.totalSpent || 0,
              wishlistItems: statsData.wishlistItems || 0,
            })
          }
        } else {
          router.push("/")
        }
      } catch (error) {
        console.error("[v0] Failed to fetch user data:", error)
        toast.error("Failed to load dashboard")
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full bg-[#38bdf8]/20 animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <UserHeader onMenuToggle={setSidebarOpen} userName={userName} />
      
      <div className="flex flex-1">
        <UserSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
            {/* Welcome Section */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Welcome back, {userName}!
              </h1>
              <p className="text-muted-foreground">
                Manage your purchases and explore new products
              </p>
            </div>

            {/* Stats Grid */}
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card hoverable>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                    <p className="mt-2 text-3xl font-bold text-foreground">
                      {stats.totalOrders}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-[#38bdf8]/10 flex items-center justify-center">
                    <ShoppingCart className="h-6 w-6 text-[#38bdf8]" />
                  </div>
                </div>
              </Card>

              <Card hoverable>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending Orders</p>
                    <p className="mt-2 text-3xl font-bold text-amber-600">
                      {stats.pendingOrders}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-amber-100/20 flex items-center justify-center">
                    <AlertCircle className="h-6 w-6 text-amber-600" />
                  </div>
                </div>
              </Card>

              <Card hoverable>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                    <p className="mt-2 text-3xl font-bold text-green-600">
                      ₦{stats.totalSpent.toLocaleString()}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-green-100/20 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </Card>

              <Card hoverable>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Wishlist Items</p>
                    <p className="mt-2 text-3xl font-bold text-pink-600">
                      {stats.wishlistItems}
                    </p>
                  </div>
                  <div className="h-12 w-12 rounded-lg bg-pink-100/20 flex items-center justify-center">
                    <Heart className="h-6 w-6 text-pink-600" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-foreground mb-4">Quick Actions</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Link href="/#products">
                  <Card hoverable className="group cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground group-hover:text-[#38bdf8] transition-colors">
                          Shop Products
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Browse our catalog
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-[#38bdf8] transition-colors" />
                    </div>
                  </Card>
                </Link>

                <Link href="/my-purchases">
                  <Card hoverable className="group cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground group-hover:text-[#38bdf8] transition-colors">
                          View Orders
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Your order history
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-[#38bdf8] transition-colors" />
                    </div>
                  </Card>
                </Link>

                <a href="https://checkout.korapay.com/pay/nettoolz" target="_blank" rel="noopener noreferrer">
                  <Card hoverable className="group cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground group-hover:text-green-600 transition-colors">
                          Quick Payment
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          One-time payment
                        </p>
                      </div>
                      <CreditCard className="h-5 w-5 text-muted-foreground group-hover:text-green-600 transition-colors" />
                    </div>
                  </Card>
                </a>

                <Link href="/dashboard/support">
                  <Card hoverable className="group cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground group-hover:text-[#38bdf8] transition-colors">
                          Get Support
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Contact our team
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-[#38bdf8] transition-colors" />
                    </div>
                  </Card>
                </Link>
              </div>
            </div>

            {/* Featured Products Section */}
            <Card header={<h2 className="font-bold text-foreground">Featured Products</h2>}>
              <div className="text-center py-12">
                <Zap className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Check out our latest premium accounts
                </p>
                <Button
                  onClick={() => router.push("/#products")}
                  className="bg-[#38bdf8] text-white hover:bg-[#0ea5e9]"
                >
                  Browse Products
                </Button>
              </div>
            </Card>
          </div>

          <DashboardFooter />
        </main>
      </div>
    </div>
  )
}
