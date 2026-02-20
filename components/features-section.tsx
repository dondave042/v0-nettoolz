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
    <section className="bg-gradient-to-br from-[#0c4a6e] via-[#075985] to-[#0369a1] py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="mb-3 font-[var(--font-heading)] text-3xl font-bold text-white md:text-4xl">
            Why Choose NETTOOLZ?
          </h2>
          <p className="mx-auto max-w-2xl text-[#bae6fd]">
            We provide the best experience for buying premium digital accounts
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="group flex flex-col items-center rounded-xl border border-[#38bdf8]/20 bg-white/5 p-8 text-center backdrop-blur transition-all hover:border-[#38bdf8]/40 hover:bg-white/10"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-[#38bdf8]/20 text-[#38bdf8] transition-colors group-hover:bg-[#38bdf8] group-hover:text-white">
                <Icon className="h-7 w-7" />
              </div>
              <h3 className="mb-2 font-semibold text-white">{title}</h3>
              <p className="text-sm leading-relaxed text-[#bae6fd]">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
