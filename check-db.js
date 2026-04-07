import 'dotenv/config'
import { getDb } from '../lib/db.js'

async function checkAndAddPaymentMethod() {
  const sql = getDb()

  try {
    // Check existing payment methods
    const methods = await sql`SELECT id, name, type FROM payment_methods`
    console.log('Existing payment methods:', methods)

    // Check if Dashboard method exists
    const dashboardExists = methods.find(m => m.type === 'dashboard')
    if (!dashboardExists) {
      // Add Dashboard Balance method
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
        RETURNING id, name, type
      `
      console.log('Added Dashboard Balance method:', result[0])
    } else {
      console.log('Dashboard Balance method already exists')
    }

    // Check if balance column exists in buyers table
    const balanceCheck = await sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'buyers' AND column_name = 'balance'
    `
    if (balanceCheck.length === 0) {
      console.log('Balance column not found in buyers table. Please run the migration.')
    } else {
      console.log('Balance column exists in buyers table')
    }

  } catch (error) {
    console.error('Error:', error)
  }
}

checkAndAddPaymentMethod()