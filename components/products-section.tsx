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
    <section id="products" className="bg-secondary/50 py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-3 font-[var(--font-heading)] text-3xl font-bold text-foreground md:text-4xl">
            Our Products
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Premium digital accounts at unbeatable prices with instant delivery
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
