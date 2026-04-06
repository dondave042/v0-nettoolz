import { getDb } from "@/lib/db"
import { Star, Quote } from "lucide-react"

interface Testimonial {
  id: number
  name: string
  role: string
  content: string
  rating: number
}

export async function TestimonialsSection() {
  const sql = getDb()
  const testimonials = await sql`SELECT * FROM testimonials WHERE is_visible = true ORDER BY created_at DESC LIMIT 8` as Testimonial[]

  return (
    <section id="testimonials" className="relative bg-gradient-to-b from-secondary/20 to-background py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-16 text-center">
          <span className="inline-block rounded-full bg-[#38bdf8]/10 px-4 py-1.5 text-sm font-semibold text-[#0284c7] mb-4">TESTIMONIALS</span>
          <h2 className="mb-4 font-[var(--font-heading)] text-4xl font-bold text-foreground md:text-5xl">
            Loved by Thousands of Customers
          </h2>
          <p className="mx-auto max-w-3xl text-lg text-muted-foreground">
            See what our satisfied customers have to say about their experience with NETTOOLZ
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="group relative overflow-hidden flex flex-col rounded-2xl border border-border bg-card p-7 transition-all duration-300 hover:border-[#38bdf8] hover:shadow-xl hover:shadow-[#38bdf8]/15"
            >
              {/* Hover gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#38bdf8]/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              <div className="relative z-10 flex flex-col h-full">
                <Quote className="mb-4 h-7 w-7 text-[#38bdf8]" />
                <p className="mb-6 flex-1 text-sm leading-relaxed text-muted-foreground italic">
                  {`"${t.content}"`}
                </p>
                <div className="flex items-end justify-between pt-4 border-t border-border">
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < t.rating ? "fill-[#38bdf8] text-[#38bdf8]" : "text-border"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
