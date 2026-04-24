import { Shield, Zap, Clock, CreditCard, Headphones, RefreshCcw } from "lucide-react"

const features = [
  {
    icon: Zap,
    title: "Instant Delivery",
    description: "Get your accounts delivered instantly after purchase. No waiting, no delays.",
  },
  {
    icon: Shield,
    title: "100% Secure",
    description: "All transactions are encrypted and secure. Your data is always protected.",
  },
  {
    icon: CreditCard,
    title: "Best Prices",
    description: "We offer the most competitive prices in the market. Guaranteed.",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Our support team is available around the clock to help you.",
  },
  {
    icon: RefreshCcw,
    title: "Replacement Guarantee",
    description: "If anything goes wrong, we replace your account for free.",
  },
  {
    icon: Clock,
    title: "Long Lasting",
    description: "All accounts are premium quality and built to last.",
  },
]

export function FeaturesSection() {
  return (
    <section className="relative bg-gradient-to-br from-[#0c4a6e] via-[#075985] to-[#0369a1] py-20 lg:py-28 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-[#0f88bb] opacity-100"></div>

      <div className="relative mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-16 text-center">
          <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-sm font-semibold text-[#7dd3fc] mb-4 backdrop-blur-sm">WHY CHOOSE US</span>
          <h2 className="mb-4 font-[var(--font-heading)] text-4xl font-bold text-white md:text-5xl bg-[#1985ba]">
            Unbeatable Features & Benefits
          </h2>
          <p className="mx-auto max-w-3xl text-lg text-[#bae6fd]">
            Experience the best service with our industry-leading features designed for your success
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group relative overflow-hidden rounded-2xl border border-[#38bdf8]/30 bg-white/5 p-8 text-center backdrop-blur transition-all duration-300 hover:border-[#38bdf8]/60 hover:bg-white/10 hover:shadow-2xl hover:shadow-[#38bdf8]/20"
            >
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#38bdf8]/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              
              <div className="relative z-10">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-xl bg-[#38bdf8]/20 text-[#38bdf8] transition-all duration-300 group-hover:bg-[#38bdf8] group-hover:text-white group-hover:scale-110 mx-auto">
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="mb-2 font-semibold text-white text-lg">{title}</h3>
                <p className="text-sm leading-relaxed text-[#bae6fd]">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
