import type { Metadata, Viewport } from 'next'
import { Inter, Poppins } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Toaster } from 'sonner'
import { CartProvider } from '@/lib/cart-context'
import { AppInitializer } from '@/components/app-initializer'
import './globals.css'

const _inter = Inter({ subsets: ["latin"] })
const _poppins = Poppins({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] })

export const metadata: Metadata = {
  title: 'NETTOOLZ - Premium Digital Accounts',
  description: 'NETTOOLZ is your ultimate destination for premium digital accounts. Browse social media, streaming, gaming, and more at unbeatable prices.',
  keywords: ['premium accounts', 'digital accounts', 'social media', 'streaming', 'NETTOOLZ'],
  icons: {
    icon: '/images/logo.png',
    apple: '/images/logo.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#38bdf8',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AppInitializer>
          <CartProvider>
            {children}
          </CartProvider>
        </AppInitializer>
        <Toaster position="top-right" richColors />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
