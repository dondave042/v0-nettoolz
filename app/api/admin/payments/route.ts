import { NextRequest, NextResponse } from "next/server"
import { getDb } from "@/lib/db"
import { getAdminSession } from "@/lib/admin-auth"

async function requireAdmin() {
  const session = await getAdminSession()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return null
}

export async function GET(request: NextRequest) {
  const unauthorizedResponse = await requireAdmin()
  if (unauthorizedResponse) {
    return unauthorizedResponse
  }

  try {
    const sql = getDb()
    const searchParams = request.nextUrl.searchParams
    const page = Math.max(1, Number(searchParams.get("page") || "1"))
    const perPage = Math.max(1, Math.min(50, Number(searchParams.get("per_page") || "10")))
    const offset = (page - 1) * perPage
    const search = (searchParams.get("search") || "").trim().toLowerCase()
    const status = (searchParams.get("status") || "").trim().toLowerCase()

    const baseRows = await sql`
      SELECT
        o.id,
        o.id AS order_id,
        COALESCE(b.email, o.buyer_email) AS buyer_email,
        b.full_name AS buyer_name,
        p.name AS product_name,
        o.quantity,
        o.total_price,
        COALESCE(o.payment_status, 'pending') AS payment_status,
        pm.type AS payment_method_type,
        o.payment_reference_id,
        o.created_at,
        o.payment_completed_at AS payment_confirmed_at,
        o.payment_error_message AS payment_failure_reason
      FROM orders o
      LEFT JOIN buyers b ON o.buyer_id = b.id
      LEFT JOIN products p ON o.product_id = p.id
      LEFT JOIN payment_methods pm ON o.payment_method_id = pm.id
      ORDER BY o.created_at DESC
    `

    const filteredRows = baseRows.filter((row) => {
      const matchesStatus = !status || String(row.payment_status || "").toLowerCase() === status
      const haystack = [
        row.order_id,
        row.buyer_email,
        row.buyer_name,
        row.product_name,
        row.payment_reference_id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      const matchesSearch = !search || haystack.includes(search)
      return matchesStatus && matchesSearch
    })

    const paginatedRows = filteredRows.slice(offset, offset + perPage)
    const stats = filteredRows.reduce(
      (accumulator, row) => {
        const totalPrice = Number(row.total_price || 0)
        accumulator.total_transactions += 1

        switch (row.payment_status) {
          case "completed":
            accumulator.completed_count += 1
            accumulator.total_revenue += totalPrice
            break
          case "failed":
            accumulator.failed_count += 1
            break
          case "cancelled":
            accumulator.cancelled_count += 1
            break
          default:
            accumulator.pending_count += 1
            accumulator.pending_amount += totalPrice
            break
        }

        return accumulator
      },
      {
        total_transactions: 0,
        completed_count: 0,
        pending_count: 0,
        failed_count: 0,
        cancelled_count: 0,
        total_revenue: 0,
        pending_amount: 0,
      },
    )

    return NextResponse.json({
      transactions: paginatedRows,
      stats: {
        ...stats,
        total_revenue: String(stats.total_revenue),
        pending_amount: String(stats.pending_amount),
      },
      total_pages: Math.max(1, Math.ceil(filteredRows.length / perPage)),
      total: filteredRows.length,
      page,
      per_page: perPage,
    })
  } catch (error) {
    console.error("[Admin Payments] Failed to load payments:", error)
    return NextResponse.json({ error: "Failed to load payments" }, { status: 500 })
  }
}