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
    <section id="testimonials" className="bg-background py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-3 font-[var(--font-heading)] text-3xl font-bold text-foreground md:text-4xl">
            What Our Customers Say
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Join thousands of satisfied customers who trust NETTOOLZ
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="flex flex-col rounded-xl border border-border bg-card p-6 transition-all hover:shadow-lg hover:shadow-[#38bdf8]/10"
            >
              <Quote className="mb-4 h-8 w-8 text-[#bae6fd]" />
              <p className="mb-4 flex-1 text-sm leading-relaxed text-muted-foreground">
                {`"${t.content}"`}
              </p>
              <div className="mb-3 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < t.rating ? "fill-[#38bdf8] text-[#38bdf8]" : "text-border"
                    }`}
                  />
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
