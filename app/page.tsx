import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ProductListView } from "@/components/product-list-view"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <ProductListView
          showHeader={true}
          title="Product Catalog"
          description="Browse our full catalog of premium digital accounts, tools, and licenses. Instant delivery after purchase."
        />
      </main>
      <SiteFooter />
    </div>
  )
}

