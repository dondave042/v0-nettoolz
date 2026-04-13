"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatNaira } from "@/lib/currency"
import { toast } from "sonner"

export default function SignupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      if (form.password !== form.confirmPassword) {
        toast.error("Passwords do not match")
        setLoading(false)
        return
      }

      const res = await fetch("/api/buyers/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        const balance = Number(data.buyer?.balance ?? 0)
        toast.success(`Account created. Balance: ${formatNaira(balance)}`)
        router.push("/dashboard")
      } else {
        toast.error(data.error || "Failed to create account")
      }
    } catch (error) {
      console.error("Signup error:", error)
      toast.error("An error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">Create Account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign up to purchase products and access credentials
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">Full Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="John Doe"
              required
              className="rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-[#38bdf8] focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@example.com"
              required
              className="rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-[#38bdf8] focus:outline-none"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required
              minLength={6}
              className="rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-[#38bdf8] focus:outline-none"
            />
            <p className="text-xs text-muted-foreground">At least 6 characters</p>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-foreground">Confirm Password</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder="••••••••"
              required
              className="rounded-lg border border-border bg-background px-4 py-2 text-foreground focus:border-[#38bdf8] focus:outline-none"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#38bdf8] text-white hover:bg-[#0ea5e9]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        <div className="mt-6 border-t border-border pt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-[#38bdf8] hover:text-[#0ea5e9]">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
