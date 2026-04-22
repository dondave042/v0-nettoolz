import { neon } from "@neondatabase/serverless"

function getConnectionString() {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL_NON_POOLING

  if (!connectionString) {
    throw new Error("Database connection string is not set")
  }

  return connectionString
}

export function getDb() {
  return neon(getConnectionString())
}
