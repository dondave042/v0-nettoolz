#!/usr/bin/env node
/**
 * Seed script — inserts demo data into the Neon PostgreSQL database.
 *
 * Usage:
 *   node scripts/seed.mjs
 *
 * Requires DATABASE_URL in the environment (or in .env.local).
 */

import { readFileSync, existsSync } from "fs"
import { neon } from "@neondatabase/serverless"

// ── Load .env.local manually (no dotenv dependency needed) ────────────────────
const envPath = new URL("../.env.local", import.meta.url).pathname
    .replace(/^\/([A-Za-z]:)/, "$1") // Fix Windows drive letter on Windows
if (existsSync(envPath)) {
    const raw = readFileSync(envPath, "utf-8")
    for (const line of raw.split("\n")) {
        const match = line.match(/^([^#=\s][^=]*)=(.*)$/)
        if (match) {
            const [, key, val] = match
            if (!process.env[key]) process.env[key] = val.replace(/^['"]|['"]$/g, "").trim()
        }
    }
}

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
    console.error("ERROR: DATABASE_URL is not set. Add it to .env.local or export it.")
    process.exit(1)
}

const sql = neon(DATABASE_URL)

// ── Password hashing (matches lib/auth.ts) ────────────────────────────────────
async function hashPassword(password) {
    const encoder = new TextEncoder()
    const data = encoder.encode(password + "nettoolz_salt_v1")
    const hashBuffer = await crypto.subtle.digest("SHA-256", data)
    return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function log(msg) {
    console.log(`  ✓ ${msg}`)
}

// ── Seed ──────────────────────────────────────────────────────────────────────
async function seed() {
    console.log("\n🌱  Seeding NETTOOLZ database…\n")

    // 1. Demo buyer
    const buyerEmail = "demo@nettoolz.com"
    const buyerPassword = "demo1234"
    const hash = await hashPassword(buyerPassword)

    const [existingBuyer] = await sql`SELECT id FROM buyers WHERE email = ${buyerEmail}`
    if (existingBuyer) {
        log(`Buyer already exists (id=${existingBuyer.id}), skipping.`)
    } else {
        const [buyer] = await sql`
      INSERT INTO buyers (email, password_hash, full_name, balance)
      VALUES (${buyerEmail}, ${hash}, ${"Demo User"}, ${1000.00})
      RETURNING id
    `
        log(`Created demo buyer: ${buyerEmail} / ${buyerPassword}  (id=${buyer.id}, balance=₦1,000)`)
    }

    // 2. Payment method
    const [existingPm] = await sql`SELECT id FROM payment_methods WHERE name = 'Korapay' LIMIT 1`
    if (existingPm) {
        log("Payment method 'Korapay' already exists, skipping.")
    } else {
        const [pm] = await sql`
      INSERT INTO payment_methods (name, type, is_active)
      VALUES ('Korapay', 'online', true)
      RETURNING id
    `
        log(`Created payment method: Korapay (id=${pm.id})`)
    }

    // 3. Demo products
    const products = [
        {
            name: "Netflix Premium — 1 Month",
            description: "Full HD & Ultra HD streaming. 4 screens. Works on all devices.",
            price: 3500,
            available_qty: 50,
            category: "Streaming",
        },
        {
            name: "Spotify Premium — 3 Months",
            description: "Ad-free music, offline downloads, unlimited skips.",
            price: 2800,
            available_qty: 30,
            category: "Streaming",
        },
        {
            name: "Xbox Game Pass Ultimate — 1 Month",
            description: "100+ console and PC games + Xbox Live Gold included.",
            price: 4200,
            available_qty: 20,
            category: "Gaming",
        },
        {
            name: "PUBG Mobile 1800 UC",
            description: "1800 Unknown Cash for PUBG Mobile in-game purchases.",
            price: 5500,
            available_qty: 100,
            category: "Gaming",
        },
        {
            name: "Microsoft Office 365 — 1 Year",
            description: "Word, Excel, PowerPoint, Teams and 1 TB OneDrive storage.",
            price: 18000,
            available_qty: 15,
            category: "Tools",
        },
        {
            name: "NordVPN — 1 Month",
            description: "Fastest VPN. 5500+ servers in 60 countries. No-logs policy.",
            price: 3200,
            available_qty: 25,
            category: "Tools",
        },
    ]

    for (const p of products) {
        const [existing] = await sql`SELECT id FROM products WHERE name = ${p.name} LIMIT 1`
        if (existing) {
            log(`Product "${p.name}" already exists, skipping.`)
            continue
        }
        const [row] = await sql`
      INSERT INTO products (name, description, price, available_qty)
      VALUES (${p.name}, ${p.description}, ${p.price}, ${p.available_qty})
      RETURNING id
    `
        log(`Created product: ${p.name} — ₦${p.price.toLocaleString()} (id=${row.id})`)
    }

    console.log("\n✅  Seeding complete!\n")
    console.log("   Demo buyer login:")
    console.log(`     Email:    ${buyerEmail}`)
    console.log(`     Password: ${buyerPassword}`)
    console.log(`     Balance:  ₦1,000.00\n`)
}

seed().catch((err) => {
    console.error("\n❌  Seeding failed:", err.message)
    process.exit(1)
})
