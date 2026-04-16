import { redirect } from "next/navigation"
import { hasAdminUsers } from "@/lib/admin-users"
import { AdminSetupForm } from "@/components/admin/admin-setup-form"

export default async function AdminSetupPage() {
    if (await hasAdminUsers()) {
        redirect("/admin/login")
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0c4a6e] via-[#075985] to-[#0369a1] px-4">
            <div className="w-full max-w-md">
                <div className="mb-8 flex flex-col items-center">
                    <img
                        src="/images/logo.png"
                        alt="NETTOOLZ Logo"
                        className="mb-4 h-20 w-20 drop-shadow-2xl"
                    />
                    <h1 className="font-[var(--font-heading)] text-2xl font-bold text-white">
                        NETTOOLZ Admin Setup
                    </h1>
                    <p className="mt-1 text-center text-sm text-[#bae6fd]">
                        The admin area is not configured yet. Create the first admin account to continue.
                    </p>
                </div>

                <AdminSetupForm />
            </div>
        </div>
    )
}