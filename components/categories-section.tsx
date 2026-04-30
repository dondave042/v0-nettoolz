'use client'

import { useState } from 'react'
import { Users, Play, Gamepad2, Mail, Shield, Cloud, ChevronDown } from "lucide-react"
import { getDb } from "@/lib/db"
import { HomepageProductsGrid } from "@/components/homepage-products-grid"

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

async function getCategories(): Promise<Category[]> {
  const sql = getDb()
  return await sql`SELECT * FROM categories ORDER BY sort_order` as Category[]
}

export async function CategoriesSection() {
  const categories = await getCategories()

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

        <HomepageProductsGrid />
        <CategoriesToggle categories={categories} />
      </div>
    </section>
  )
}

function CategoriesToggle({ categories }: { categories: Category[] }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Category Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full border border-[#38bdf8] bg-[#e0f2fe]/10 px-6 py-3 text-sm font-semibold text-[#0284c7] transition-all duration-300 hover:bg-[#e0f2fe]/20 hover:shadow-lg hover:shadow-[#38bdf8]/20"
      >
        <span>View Categories</span>
        <ChevronDown 
          className={`h-4 w-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Category Grid - Hidden by default, shown on toggle */}
      <div
        className={`w-full transition-all duration-500 ease-out overflow-hidden ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 pt-4">
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
    </div>
  )
}
