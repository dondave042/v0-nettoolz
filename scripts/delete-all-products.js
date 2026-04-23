const fs = require('node:fs')
const path = require('node:path')
const { neon } = require('@neondatabase/serverless')

function loadEnvFile(fileName) {
    const envPath = path.join(process.cwd(), fileName)
    const raw = fs.readFileSync(envPath, 'utf8')
    for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const idx = trimmed.indexOf('=')
        if (idx <= 0) continue
        const key = trimmed.slice(0, idx).trim()
        let value = trimmed.slice(idx + 1)
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1)
        }
        process.env[key] = value
    }
}

async function main() {
    loadEnvFile('.env.production.local')

    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL
    if (!connectionString) {
        throw new Error('DATABASE_URL/POSTGRES_URL not found in .env.production.local')
    }

    const sql = neon(connectionString)

    const before = await sql`SELECT COUNT(*)::int AS count FROM products`
    const deleted = await sql`DELETE FROM products RETURNING id`
    const after = await sql`SELECT COUNT(*)::int AS count FROM products`

    console.log(
        JSON.stringify(
            {
                before: before[0]?.count ?? 0,
                deletedRows: deleted.length,
                after: after[0]?.count ?? 0,
            },
            null,
            2
        )
    )
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
