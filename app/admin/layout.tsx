import type { Metadata } from "next"
import type { ReactNode } from "react"

export const metadata: Metadata = {
    title: "Admin — NETTOOLZ",
    description: "NETTOOLZ Admin Panel",
    robots: { index: false, follow: false },
}

export default function AdminRootLayout({ children }: { children: ReactNode }) {
    return <>{children}</>
}
