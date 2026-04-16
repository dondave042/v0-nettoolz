"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Shield, Mail, Lock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function AdminSetupForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Failed to create admin account")
      }

      toast.success("Admin account created")
      router.push("/admin")
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create admin account")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-[#38bdf8]/20 bg-white/10 p-8 backdrop-blur"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-[#38bdf8]/20 p-3 text-[#e0f2fe]">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-[var(--font-heading)] text-xl font-bold text-white">Create Admin</h2>
          <p className="text-sm text-[#bae6fd]">Set up the first administrator for this workspace.</p>
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-1.5">
        <label htmlFor="setup-email" className="text-sm font-medium text-[#e0f2fe]">
          Email Address
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7dd3fc]" />
          <input
            id="setup-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@nettoolz.com"
            className="w-full rounded-lg border border-[#38bdf8]/30 bg-white/10 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-[#7dd3fc]/60 focus:border-[#38bdf8] focus:outline-none focus:ring-2 focus:ring-[#38bdf8]/20"
          />
        </div>
      </div>

      <div className="mb-5 flex flex-col gap-1.5">
        <label htmlFor="setup-password" className="text-sm font-medium text-[#e0f2fe]">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7dd3fc]" />
          <input
            id="setup-password"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            className="w-full rounded-lg border border-[#38bdf8]/30 bg-white/10 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-[#7dd3fc]/60 focus:border-[#38bdf8] focus:outline-none focus:ring-2 focus:ring-[#38bdf8]/20"
          />
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-1.5">
        <label htmlFor="setup-confirm-password" className="text-sm font-medium text-[#e0f2fe]">
          Confirm Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7dd3fc]" />
          <input
            id="setup-confirm-password"
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Re-enter your password"
            className="w-full rounded-lg border border-[#38bdf8]/30 bg-white/10 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-[#7dd3fc]/60 focus:border-[#38bdf8] focus:outline-none focus:ring-2 focus:ring-[#38bdf8]/20"
          />
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
            Creating Admin...
          </>
        ) : (
          <>
            <Shield className="h-4 w-4" />
            Create Admin Account
          </>
        )}
      </Button>
    </form>
  )
}