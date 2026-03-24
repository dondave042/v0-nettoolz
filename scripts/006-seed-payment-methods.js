import { sql } from '@vercel/postgres'

async function seedPaymentMethods() {
  console.log('[Payment Methods] Starting payment methods seeding...')

  try {
    // Check if payment methods table exists
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'payment_methods'
      )
    `

    if (!tableExists.rows[0].exists) {
      console.error('[Payment Methods] payment_methods table does not exist')
      process.exit(1)
    }

    // Check if Korapay method already exists
    const existing = await sql`
      SELECT id FROM payment_methods 
      WHERE provider = 'korapay' AND name = 'Korapay'
      LIMIT 1
    `

    if (existing.rows.length > 0) {
      console.log('[Payment Methods] Korapay payment method already exists')
      return
    }

    // Insert default Korapay payment method
    const result = await sql`
      INSERT INTO payment_methods (
        name,
        provider,
        description,
        is_active,
        created_at,
        updated_at
      )
      VALUES (
        'Korapay',
        'korapay',
        'Pay securely using Korapay payment gateway',
        true,
        NOW(),
        NOW()
      )
      RETURNING id, name, provider, is_active
    `

    const method = result.rows[0]
    console.log(
      `[Payment Methods] Successfully seeded Korapay payment method (ID: ${method.id})`
    )

    // Optional: Seed additional payment methods for future use
    const additionalMethods = [
      {
        name: 'Paystack',
        provider: 'paystack',
        description: 'Pay with Paystack',
        active: false, // Disabled for now
      },
      {
        name: 'Flutterwave',
        provider: 'flutterwave',
        description: 'Pay with Flutterwave',
        active: false, // Disabled for now
      },
    ]

    for (const method of additionalMethods) {
      const existing = await sql`
        SELECT id FROM payment_methods 
        WHERE provider = ${method.provider}
        LIMIT 1
      `

      if (existing.rows.length === 0) {
        await sql`
          INSERT INTO payment_methods (
            name,
            provider,
            description,
            is_active,
            created_at,
            updated_at
          )
          VALUES (
            ${method.name},
            ${method.provider},
            ${method.description},
            ${method.active},
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
