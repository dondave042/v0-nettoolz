import { NextResponse } from "next/server"
import { getAdminSession } from "@/lib/admin-auth"
import { getSupabaseServerClient } from "@/lib/supabase"

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"])

const rolesAllowedToManageCatalog = new Set([
    "admin",
    "super_admin",
    "editor",
    "manager",
    "support",
])

function canManageCatalog(role?: string) {
    if (!role) {
        return true
    }

    return rolesAllowedToManageCatalog.has(role)
}

function sanitizeName(fileName: string) {
    return fileName
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9._-]/g, "")
        .slice(-80)
}

export async function POST(request: Request) {
    const session = await getAdminSession()
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    if (!canManageCatalog(session.role)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    try {
        const formData = await request.formData()
        const file = formData.get("file")

        if (!(file instanceof File)) {
            return NextResponse.json({ error: "Image file is required" }, { status: 400 })
        }

        if (!ALLOWED_MIME_TYPES.has(file.type)) {
            return NextResponse.json({ error: "Unsupported file type" }, { status: 400 })
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            return NextResponse.json({ error: "Image is too large (max 5MB)" }, { status: 400 })
        }

        const bucketName = process.env.SUPABASE_PRODUCT_IMAGES_BUCKET || "product-images"
        const safeFileName = sanitizeName(file.name || "product-image")
        const extension = safeFileName.includes(".") ? safeFileName.split(".").pop() : "png"
        const path = `admin-products/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`

        const supabase = getSupabaseServerClient()
        const { error: uploadError } = await supabase.storage
            .from(bucketName)
            .upload(path, file, {
                cacheControl: "3600",
                upsert: false,
                contentType: file.type,
            })

        if (uploadError) {
            console.error("[Admin Upload] Storage upload failed:", uploadError)
            return NextResponse.json(
                { error: "Failed to upload image", details: uploadError.message },
                { status: 500 }
            )
        }

        const { data: publicData } = supabase.storage.from(bucketName).getPublicUrl(path)
        return NextResponse.json({
            url: publicData.publicUrl,
            path,
            bucket: bucketName,
        })
    } catch (error) {
        console.error("[Admin Upload] Unexpected error:", error)
        return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
    }
}