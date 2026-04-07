const { neon } = require('@neondatabase/serverless')

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required to run this script.')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)

async function seedPaymentMethods() {
  console.log('[Payment Methods] Starting payment methods seeding...')

  try {
    // Check if payment methods table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'payment_methods'
      )
    `

    if (!tableCheck[0].exists) {
      console.error('[Payment Methods] payment_methods table does not exist')
      process.exit(1)
    }

    // Check if Korapay method already exists
    const existingKorapay = await sql`
      SELECT id FROM payment_methods 
      WHERE type = 'korapay' AND name = 'Korapay'
      LIMIT 1
    `

    if (existingKorapay.length === 0) {
      // Insert default Korapay payment method with JSONB config
      const result = await sql`
        INSERT INTO payment_methods (
          name,
          type,
          config,
          is_active,
          sort_order,
          created_at,
          updated_at
        )
        VALUES (
          'Korapay',
          'korapay',
          '{"displayName": "Korapay", "description": "Pay securely using Korapay payment gateway", "icon": "korapay"}'::jsonb,
          true,
          1,
          NOW(),
          NOW()
        )
        RETURNING id, name, type, is_active
      `

      const method = result[0]
      console.log(
        `[Payment Methods] Successfully seeded Korapay payment method (ID: ${method.id})`
      )
    } else {
      console.log('[Payment Methods] Korapay payment method already exists')
    }

    // Check if Dashboard method already exists
    const existingDashboard = await sql`
      SELECT id FROM payment_methods 
      WHERE type = 'dashboard' AND name = 'Dashboard Balance'
      LIMIT 1
    `

    if (existingDashboard.length === 0) {
      // Insert Dashboard Balance payment method
      const result = await sql`
        INSERT INTO payment_methods (
          name,
          type,
          config,
          is_active,
          sort_order,
          created_at,
          updated_at
        )
        VALUES (
          'Dashboard Balance',
          'dashboard',
          '{"displayName": "Dashboard Balance", "description": "Pay using your account balance", "icon": "wallet"}'::jsonb,
          true,
          2,
          NOW(),
          NOW()
        )
        RETURNING id, name, type, is_active
      `

      const method = result[0]
      console.log(
        `[Payment Methods] Successfully seeded Dashboard Balance payment method (ID: ${method.id})`
      )
    } else {
      console.log('[Payment Methods] Dashboard Balance payment method already exists')
    }

    console.log('[Payment Methods] Seeding completed successfully')
  } catch (error) {
    console.error('[Payment Methods] Error during seeding:', error)
    process.exit(1)
  }
}

seedPaymentMethods()
