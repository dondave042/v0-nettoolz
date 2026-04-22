import Link from "next/link"
import { Shield } from "lucide-react"

const aboutLinks = [
  { label: "About Us", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "Careers", href: "/careers" },
]

const legalLinks = [
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Cookie Policy", href: "/cookies" },
]

const supportLinks = [
  { label: "Help Center", href: "/support" },
  { label: "Contact Us", href: "/support#contact" },
  { label: "FAQ", href: "/support#faq" },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-[#0c4a6e] text-[#e0f2fe]">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#38bdf8] to-[#0284c7] shadow-md">
                <span className="font-bold text-white text-sm">NT</span>
              </div>
              <span className="text-lg font-bold text-white">NETTOOLZ</span>
            </Link>
            <p className="text-sm leading-relaxed text-[#7dd3fc]">
              Your ultimate destination for premium digital accounts, tools, and licenses. Trusted by thousands of customers worldwide.
            </p>
          </div>

          {/* About */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">About</h3>
            <ul className="flex flex-col gap-2">
              {aboutLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-[#7dd3fc] transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Legal</h3>
            <ul className="flex flex-col gap-2">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-[#7dd3fc] transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Support</h3>
            <ul className="flex flex-col gap-2">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm text-[#7dd3fc] transition-colors hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[#075985] pt-8 sm:flex-row">
          <p className="text-sm text-[#7dd3fc]">
            &copy; 2026 NETTOOLZ. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-sm text-[#7dd3fc]">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <span>&middot;</span>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <span>&middot;</span>
            <Link href="/security" className="hover:text-white transition-colors">Security</Link>
            <span>&middot;</span>
            <Link
              href="/admin/login"
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <Shield className="h-3.5 w-3.5" />
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
