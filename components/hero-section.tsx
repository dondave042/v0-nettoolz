import { ArrowRight, Shield, Zap, Clock, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0c4a6e] via-[#075985] to-[#0369a1]">
      {/* Decorative logo backgrounds */}
      <div className="pointer-events-none absolute inset-0 z-0 select-none">
        <img src="/images/logo.png" alt="Logo" style={{ position: 'absolute', top: '10%', left: '5%', width: 100, opacity: 0.13, zIndex: 1 }} />
        <img src="/apple-icon.png" alt="Apple" style={{ position: 'absolute', top: '60%', left: '10%', width: 70, opacity: 0.10, zIndex: 1 }} />
        <img src="/icon.svg" alt="Icon" style={{ position: 'absolute', top: '20%', right: '10%', width: 90, opacity: 0.10, zIndex: 1 }} />
        {/* Add more icons as desired for effect */}
      </div>

      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-15">
        <div className="absolute left-1/4 top-1/4 h-80 w-80 rounded-full bg-[#38bdf8] blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-[#7dd3fc] blur-3xl animate-pulse delay-1000" />
        <div className="absolute right-1/3 top-1/3 h-72 w-72 rounded-full bg-[#0ea5e9] blur-3xl animate-pulse delay-500" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-24 lg:px-8 lg:py-32">
        <div className="flex flex-col items-center">
          {/* Text content */}
          <div className="max-w-3xl text-center [margin-top:5px]">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#38bdf8]/40 bg-[#38bdf8]/15 px-5 py-2 text-sm font-semibold text-[#7dd3fc] backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              Premium Digital Products
            </div>
            <h1 className="mb-8 text-balance font-[var(--font-heading)] text-5xl font-extrabold leading-tight tracking-tight text-white md:text-6xl lg:text-7xl">
              Shop NETTOOLZ
            </h1>
            <p className="mb-10 max-w-2xl text-pretty text-lg leading-relaxed text-[#bae6fd] md:text-xl">
              Browse our catalog of premium accounts, tools, and licenses. Instant delivery after purchase.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center sm:gap-5">
              <Button
                size="lg"
                className="gap-2 bg-[#38bdf8] text-[#0c4a6e] hover:bg-[#7dd3fc]"
                asChild
              >
                <a href="#products">
                  Browse Products
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-[#38bdf8]/30 bg-transparent text-white hover:bg-[#38bdf8]/10 hover:text-white"
                asChild
              >
                <a href="#categories">View Categories</a>
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="mt-10 flex flex-wrap justify-center gap-6">
              {[
                { icon: Shield, label: "Secure Payments" },
                { icon: Zap, label: "Instant Delivery" },
                { icon: Clock, label: "24/7 Support" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-sm text-[#bae6fd]">
                  <Icon className="h-4 w-4 text-[#38bdf8]" />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
