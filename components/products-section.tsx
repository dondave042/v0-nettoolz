import { getDb } from "@/lib/db"
import { ProductCard } from "@/components/product-card"

interface Product {
  id: number
  sku: string
  name: string
  description: string
  price: string
  available_qty: number
  badge: string | null
  is_featured: boolean
  category_name: string
}

export async function ProductsSection() {
  const sql = getDb()
  const products = await sql`
    SELECT p.*, c.name as category_name
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.is_featured DESC, p.created_at DESC
  ` as Product[]

  return (
    <section id="products" className="relative bg-gradient-to-b from-secondary/30 to-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-16 text-center">
          <span className="inline-block rounded-full bg-[#38bdf8]/10 px-4 py-1.5 text-sm font-semibold text-[#0284c7] mb-4">FEATURED ACCOUNTS</span>
          <h2 className="mb-4 font-[var(--font-heading)] text-4xl font-bold text-foreground md:text-5xl">
            Premium Accounts Collection
          </h2>
          <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
            Handpicked premium accounts with instant delivery, verified sellers, and 30-day money-back guarantee
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        
        {products.length === 0 && (
          <div className="flex min-h-64 items-center justify-center rounded-xl border-2 border-dashed border-border bg-secondary/20">
            <p className="text-muted-foreground">No products available at the moment</p>
          </div>
        )}
      </div>
    </section>
  )
}
