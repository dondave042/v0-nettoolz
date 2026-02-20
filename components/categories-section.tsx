import { getDb } from "@/lib/db"
import { Users, Play, Gamepad2, Mail, Shield, Cloud } from "lucide-react"

const iconMap: Record<string, React.ElementType> = {
  Users, Play, Gamepad2, Mail, Shield, Cloud,
}

interface Category {
  id: number
  name: string
  slug: string
  description: string
  icon: string
}

export async function CategoriesSection() {
  const sql = getDb()
  const categories = await sql`SELECT * FROM categories ORDER BY sort_order` as Category[]

  return (
    <section id="categories" className="bg-background py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-3 font-[var(--font-heading)] text-3xl font-bold text-foreground md:text-4xl">
            Browse by Category
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Find exactly what you need from our wide selection of premium digital accounts
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => {
            const Icon = iconMap[cat.icon] || Users
            return (
              <a
                key={cat.id}
                href={`#products`}
                className="group flex items-start gap-4 rounded-xl border border-border bg-card p-6 transition-all hover:border-[#38bdf8] hover:shadow-lg hover:shadow-[#38bdf8]/10"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-[#e0f2fe] text-[#0284c7] transition-colors group-hover:bg-[#38bdf8] group-hover:text-white">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-foreground">{cat.name}</h3>
                  <p className="text-sm text-muted-foreground">{cat.description}</p>
                </div>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}
