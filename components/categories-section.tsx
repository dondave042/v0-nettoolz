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
    <section id="categories" className="relative bg-background py-20 lg:py-28">
      {/* Subtle background accent */}
      <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-[#e0f2fe]/30 to-transparent"></div>
      
      <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-16 text-center">
          <span className="inline-block rounded-full bg-[#38bdf8]/10 px-4 py-1.5 text-sm font-semibold text-[#0284c7] mb-4">CATEGORIES</span>
          <h2 className="mb-4 font-[var(--font-heading)] text-4xl font-bold text-foreground md:text-5xl">
            Explore by Category
          </h2>
          <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
            Discover premium accounts across all your favorite platforms with exclusive deals and verified sellers
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* All Categories Button */}
          <a
            href={`#products`}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:border-[#38bdf8] hover:shadow-xl hover:shadow-[#38bdf8]/20"
          >
            {/* Hover gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#38bdf8]/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-[#e0f2fe] text-[#0284c7] transition-colors group-hover:bg-[#38bdf8] group-hover:text-white">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-foreground">All Categories</h3>
                <p className="text-sm text-muted-foreground">Browse our complete collection of premium accounts</p>
              </div>
            </div>
          </a>

          {categories.map((cat) => {
            const Icon = iconMap[cat.icon] || Users
            return (
              <a
                key={cat.id}
                href={`#products`}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:border-[#38bdf8] hover:shadow-xl hover:shadow-[#38bdf8]/20"
              >
                {/* Hover gradient background */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#38bdf8]/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
                <div className="relative z-10 flex flex-col gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-[#e0f2fe] text-[#0284c7] transition-colors group-hover:bg-[#38bdf8] group-hover:text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-foreground">{cat.name}</h3>
                    <p className="text-sm text-muted-foreground">{cat.description}</p>
                  </div>
                </div>
              </a>
            )
          })}
        </div>
      </div>
    </section>
  )
}
