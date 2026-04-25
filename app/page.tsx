import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ProductListView } from "@/components/product-list-view"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <section className="bg-gradient-to-br from-[#0c4a6e] to-[#0c1e2d] px-4 py-16 text-center">
          <div className="mx-auto max-w-4xl">
            <h1 className="mb-4 text-4xl font-extrabold tracking-tight text-white md:text-6xl">
              NETTOOLZ
            </h1>
            <div className="mx-auto max-w-2xl rounded-2xl bg-sky-300/90 px-6 py-4 shadow-lg shadow-sky-950/20">
              <p className="text-lg font-medium text-sky-950 md:text-xl">
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

