import { neon } from '@neondatabase/serverless'

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
    const existing = await sql`
      SELECT id FROM payment_methods 
      WHERE type = 'korapay' AND name = 'Korapay'
      LIMIT 1
    `

    if (existing.length > 0) {
      console.log('[Payment Methods] Korapay payment method already exists')
      return
    }

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

    // Optional: Seed additional payment methods for future use
    const additionalMethods = [
      {
        name: 'Paystack',
        type: 'paystack',
        config: { displayName: 'Paystack', description: 'Pay with Paystack', icon: 'paystack' },
        active: false,
        sort: 2,
      },
      {
        name: 'Flutterwave',
        type: 'flutterwave',
        config: { displayName: 'Flutterwave', description: 'Pay with Flutterwave', icon: 'flutterwave' },
        active: false,
        sort: 3,
      },
    ]

    for (const method of additionalMethods) {
      const exists = await sql`
        SELECT id FROM payment_methods 
        WHERE type = ${method.type}
        LIMIT 1
      `

      if (exists.length === 0) {
        await sql`
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
            ${method.name},
            ${method.type},
            ${JSON.stringify(method.config)}::jsonb,
            ${method.active},
            ${method.sort},
            NOW(),
            NOW()
          )
        `
        console.log(
          `[Payment Methods] Seeded ${method.name} payment method (disabled)`
        )
      }
    }

    console.log('[Payment Methods] Payment methods seeding completed successfully')
  } catch (error) {
    console.error('[Payment Methods] Error seeding payment methods:', error)
    process.exit(1)
  }
}

seedPaymentMethods()
