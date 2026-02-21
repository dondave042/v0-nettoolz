import Image from "next/image"
import { ArrowRight, Shield, Zap, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#0c4a6e] via-[#075985] to-[#0369a1]">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute left-1/4 top-1/4 h-72 w-72 rounded-full bg-[#38bdf8] blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-[#7dd3fc] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-20 lg:px-8 lg:py-28">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:justify-between">
          {/* Text content */}
          <div className="max-w-2xl text-center lg:text-left">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#38bdf8]/30 bg-[#38bdf8]/10 px-4 py-1.5 text-sm font-medium text-[#7dd3fc]">
              <Zap className="h-4 w-4" />
              Trusted by 10,000+ Customers
            </div>
            <h1 className="mb-6 text-balance font-[var(--font-heading)] text-4xl font-extrabold leading-tight tracking-tight text-white md:text-5xl lg:text-6xl">
              The Ultimate Destination for{" "}
              <span className="text-[#38bdf8]">Premium Digital Accounts</span>
            </h1>
            <p className="mb-8 max-w-xl text-pretty text-lg leading-relaxed text-[#bae6fd]">
              Get instant access to premium social media, streaming, gaming, and
              more. Verified accounts, unbeatable prices, and 24/7 customer
              support.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
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
            <div className="mt-10 flex flex-wrap justify-center gap-6 lg:justify-start">
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

          {/* Hero image / logo */}
          <div className="flex-shrink-0">
            <div className="relative">
              <div className="absolute -inset-4 rounded-full bg-[#38bdf8]/20 blur-2xl" />
              <Image
                src="/images/logo.png"
                alt="NETTOOLZ Premium Web Logs"
                width={280}
                height={280}
                className="relative drop-shadow-2xl"
                style={{ width: 280, height: "auto" }}
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
