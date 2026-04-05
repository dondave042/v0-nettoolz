import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { AnnouncementsBar } from "@/components/announcements-bar"
import { HeroSection } from "@/components/hero-section"
import { CategoriesSection } from "@/components/categories-section"
import { ProductsSection } from "@/components/products-section"
import { FeaturesSection } from "@/components/features-section"
import { TestimonialsSection } from "@/components/testimonials-section"
import { ContactSection } from "@/components/contact-section"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AnnouncementsBar />
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <CategoriesSection />
        <ProductsSection />
        <FeaturesSection />
        <TestimonialsSection />
        <ContactSection />
      </main>
      <SiteFooter />
    </div>
  )
}
