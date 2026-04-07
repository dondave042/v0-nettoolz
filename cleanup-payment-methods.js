const { neon } = require('@neondatabase/serverless')

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)

async function run() {
  try {
    // Keep the canonical Dashboard Balance entry, remove duplicates and malformed dashboard entries.
    const dashboardBalance = await sql`
      SELECT id FROM payment_methods
      WHERE type = 'dashboard' AND name = 'Dashboard Balance'
      ORDER BY id ASC
      LIMIT 1
    `

    if (dashboardBalance.length === 0) {
      throw new Error('No canonical Dashboard Balance method found')
    }

    const keepId = dashboardBalance[0].id

    await sql`
      DELETE FROM payment_methods
      WHERE type = 'dashboard'
        AND id != ${keepId}
    `

    // Make sure the canonical Dashboard Balance entry has the correct values.
    await sql`
      UPDATE payment_methods
      SET name = 'Dashboard Balance',
          type = 'dashboard',
          config = '{"displayName":"Dashboard Balance","description":"Pay using your account balance","icon":"wallet"}'::jsonb,
          is_active = true,
          sort_order = 2
      WHERE id = ${keepId}
    `

    // Standardize active payment methods: only Korapay and Dashboard Balance remain active.
    await sql`
      UPDATE payment_methods
      SET is_active = false
      WHERE type NOT IN ('korapay', 'dashboard')
    `

    // Ensure Korapay is active and first in order.
    await sql`
      UPDATE payment_methods
      SET is_active = true,
          sort_order = 1
      WHERE type = 'korapay'
    `

    console.log('Cleanup completed successfully')
  } catch (error) {
    console.error('Cleanup failed:', error)
    process.exit(1)
  }
}

run()
