import Image from "next/image"
import Link from "next/link"
import { Shield, Mail, MessageCircle } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-[#0c4a6e] text-[#e0f2fe]">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand Column */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/images/logo.png"
                alt="NETTOOLZ Logo"
                width={36}
                height={36}
                className="rounded-full"
                style={{ width: 36, height: "auto" }}
              />
              <span className="text-lg font-bold text-white">NETTOOLZ</span>
            </Link>
            <p className="text-sm leading-relaxed text-[#7dd3fc]">
              Your ultimate destination for premium digital accounts. Trusted by thousands of customers worldwide.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Quick Links</h3>
            <ul className="flex flex-col gap-2">
              {["Home", "Products", "Categories", "Testimonials"].map((item) => (
                <li key={item}>
                  <Link
                    href={`/#${item.toLowerCase()}`}
                    className="text-sm text-[#7dd3fc] transition-colors hover:text-white"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Support</h3>
            <ul className="flex flex-col gap-3">
              <li className="flex items-center gap-2 text-sm text-[#7dd3fc]">
                <Mail className="h-4 w-4" />
                <span>support@nettoolz.com</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-[#7dd3fc]">
                <MessageCircle className="h-4 w-4" />
                <span>Live Chat Available</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-[#7dd3fc]">
                <Shield className="h-4 w-4" />
                <span>Secure Transactions</span>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">Legal</h3>
            <ul className="flex flex-col gap-2">
              {["Terms of Service", "Privacy Policy", "Refund Policy"].map((item) => (
                <li key={item}>
                  <Link
                    href="#"
                    className="text-sm text-[#7dd3fc] transition-colors hover:text-white"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[#075985] pt-8 sm:flex-row">
          <p className="text-sm text-[#7dd3fc]">
            &copy; {new Date().getFullYear()} NETTOOLZ. All rights reserved.
          </p>
          <Link
            href="/admin/login"
            className="flex items-center gap-2 rounded-lg border border-[#075985] px-4 py-2 text-sm font-medium text-[#7dd3fc] transition-colors hover:border-[#38bdf8] hover:text-white"
          >
            <Shield className="h-4 w-4" />
            Admin
          </Link>
        </div>
      </div>
    </footer>
  )
}
