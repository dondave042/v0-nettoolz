const { neon } = require('@neondatabase/serverless')

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required')
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)

async function run() {
  try {
    const rows = await sql`SELECT id, name, type, is_active, sort_order, config FROM payment_methods ORDER BY sort_order`
    console.log(JSON.stringify(rows, null, 2))
  } catch (error) {
    console.error('Query failed:', error)
    process.exit(1)
  }
}

run()
