"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Lock, Mail, Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Login failed")
        return
      }

      toast.success("Welcome back!")
      router.push("/admin")
    } catch {
      toast.error("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0c4a6e] via-[#075985] to-[#0369a1] px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <Image
            src="/images/logo.png"
            alt="NETTOOLZ Logo"
            width={80}
            height={80}
            className="mb-4 drop-shadow-2xl"
          />
          <h1 className="font-[var(--font-heading)] text-2xl font-bold text-white">
            NETTOOLZ Admin
          </h1>
          <p className="mt-1 text-sm text-[#bae6fd]">Sign in to your admin panel</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[#38bdf8]/20 bg-white/10 p-8 backdrop-blur"
        >
          <div className="mb-5 flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-[#e0f2fe]">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7dd3fc]" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@nettoolz.com"
                className="w-full rounded-lg border border-[#38bdf8]/30 bg-white/10 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-[#7dd3fc]/60 focus:border-[#38bdf8] focus:outline-none focus:ring-2 focus:ring-[#38bdf8]/20"
              />
            </div>
          </div>

          <div className="mb-6 flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium text-[#e0f2fe]">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7dd3fc]" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-[#38bdf8]/30 bg-white/10 py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-[#7dd3fc]/60 focus:border-[#38bdf8] focus:outline-none focus:ring-2 focus:ring-[#38bdf8]/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7dd3fc] hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full gap-2 bg-[#38bdf8] text-[#0c4a6e] hover:bg-[#7dd3fc]"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing In...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Sign In
              </>
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-[#7dd3fc]">
          Protected area. Authorized personnel only.
        </p>
      </div>
    </div>
  )
}
