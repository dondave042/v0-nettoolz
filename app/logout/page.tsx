"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function LogoutPage() {
    const router = useRouter()

    useEffect(() => {
        const doLogout = async () => {
            try {
                await fetch("/api/buyers/logout", { method: "POST" })
            } catch {
                // ignore – proceed to redirect regardless
            }
            router.replace("/login")
        }
        doLogout()
    }, [router])

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0c1e2d]">
            <div className="text-center">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#38bdf8] border-t-transparent" />
                <p className="text-white/70 text-sm">Signing you out…</p>
            </div>
        </div>
    )
}
