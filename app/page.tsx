import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ProductListView } from "@/components/product-list-view"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section 
          className="relative overflow-hidden px-4 py-16 text-center"
          style={{
            backgroundImage: `
              url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Copilot_20260429_224405-saZaHhEEfjmw50VhH6xc5EJQpkuU94.png'),
              url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Copilot_20260429_222948-bIXjcnXfpXqQETwyVg9dFGukVLKyJQ.png')
            `,
            backgroundSize: '50%, 50%',
            backgroundPosition: 'left center, right center',
            backgroundRepeat: 'no-repeat, no-repeat',
          }}
        >
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0c4a6e]/85 via-[#0c4a6e]/80 to-[#0c1e2d]/85"></div>
          
          <div className="relative mx-auto max-w-4xl">
            <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-sky-300 md:text-6xl">
              NETTOOLZ
            </h1>
            <div className="mx-auto max-w-2xl rounded-2xl bg-[#7dd3fc] px-6 py-4 shadow-lg shadow-sky-950/20">
              <p className="text-lg font-medium text-[#082f49] md:text-xl">
                Your ultimate destination for premium digital accounts, tools, and licenses. Trusted by thousands of customer
              </p>
            </div>
          </div>
        </section>
        <ProductListView
          showHeader={false}
          title="Product Catalog"
          description="Browse our full catalog of premium digital accounts, tools, and licenses. Instant delivery after purchase."
        />
      </main>
      <SiteFooter />
    </div>
  )
}

