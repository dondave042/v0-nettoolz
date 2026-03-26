import Link from "next/link"

export function DashboardFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-12 border-t border-border bg-secondary/20 py-8">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-3 mb-8">
          <div>
            <h3 className="font-semibold text-foreground mb-4">About</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/about" className="hover:text-[#38bdf8] transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-[#38bdf8] transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/careers" className="hover:text-[#38bdf8] transition-colors">
                  Careers
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/terms" className="hover:text-[#38bdf8] transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-[#38bdf8] transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-[#38bdf8] transition-colors">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-4">Support</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/help" className="hover:text-[#38bdf8] transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[#38bdf8] transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-[#38bdf8] transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} NETTOOLZ. All rights reserved.
          </p>
          <div className="flex gap-6 mt-4 sm:mt-0 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-[#38bdf8] transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-[#38bdf8] transition-colors">
              Terms
            </Link>
            <Link href="/security" className="hover:text-[#38bdf8] transition-colors">
              Security
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
