import Link from "next/link"
import { Mail, Shield, HelpCircle, Phone } from "lucide-react"

const legalLinks = [
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Cookie Policy", href: "/cookies" },
]

const supportLinks = [
  { label: "Support", href: "mailto:nettoolz@outlook.com", icon: Mail },
  { label: "Help Center", href: "/help", icon: HelpCircle },
  { label: "Contact Us", href: "mailto:nettoolz@outlook.com", icon: Mail },
  { label: "FAQ", href: "/faq", icon: HelpCircle },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-[#0c4a6e] text-[#e0f2fe]">
      <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand & Description */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#38bdf8] to-[#0284c7] shadow-md">
                <span className="font-bold text-white text-sm">NT</span>
              </div>
              <span className="text-lg font-bold text-white">NETTOOLZ</span>
            </Link>
            <p className="text-sm leading-relaxed text-[#bae6fd]">
              Your ultimate destination for premium digital accounts, tools, and licenses. Trusted by thousands of customers worldwide.
            </p>
          </div>

          {/* Legal Section */}
          <div>
            <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-white">Legal</h3>
            <ul className="flex flex-col gap-3">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <Link 
                    href={link.href} 
                    className="text-sm text-[#bae6fd] transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Section */}
          <div>
            <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-white">Support</h3>
            <ul className="flex flex-col gap-3">
              <li>
                <a 
                  href="mailto:nettoolz@outlook.com"
                  className="flex items-center gap-2 text-sm text-[#bae6fd] transition-colors hover:text-white"
                >
                  <Mail className="h-4 w-4" />
                  Support
                </a>
              </li>
              <li>
                <Link 
                  href="/help"
                  className="flex items-center gap-2 text-sm text-[#bae6fd] transition-colors hover:text-white"
                >
                  <HelpCircle className="h-4 w-4" />
                  Help Center
                </Link>
              </li>
              <li>
                <a 
                  href="mailto:nettoolz@outlook.com"
                  className="flex items-center gap-2 text-sm text-[#bae6fd] transition-colors hover:text-white"
                >
                  <Phone className="h-4 w-4" />
                  Contact Us
                </a>
              </li>
              <li>
                <Link 
                  href="/faq"
                  className="flex items-center gap-2 text-sm text-[#bae6fd] transition-colors hover:text-white"
                >
                  <HelpCircle className="h-4 w-4" />
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="mb-6 text-sm font-semibold uppercase tracking-wider text-white">Get in Touch</h3>
            <div className="flex flex-col gap-4">
              <div className="rounded-lg bg-[#075985] p-4">
                <p className="text-xs uppercase tracking-wider text-[#38bdf8] font-semibold mb-2">Email Support</p>
                <a 
                  href="mailto:nettoolz@outlook.com"
                  className="text-sm font-medium text-white hover:text-[#7dd3fc] transition-colors break-all"
                >
                  nettoolz@outlook.com
                </a>
              </div>
              <p className="text-xs text-[#bae6fd] leading-relaxed">
                Have questions? Our support team is here to help you with any inquiries about our products and services.
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-12 border-t border-[#075985]"></div>

        {/* Bottom Section */}
        <div className="mt-8 flex flex-col items-center justify-between gap-6 sm:flex-row">
          <p className="text-xs text-[#bae6fd]">
            &copy; 2026 NETTOOLZ. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-[#bae6fd]">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <span className="text-[#075985]">&bull;</span>
            <Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
            <span className="text-[#075985]">&bull;</span>
            <Link href="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link>
            <span className="text-[#075985]">&bull;</span>
            <Link
              href="/admin/login"
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <Shield className="h-3 w-3" />
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
