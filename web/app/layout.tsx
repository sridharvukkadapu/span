import type { Metadata, Viewport } from 'next'
import { DM_Serif_Display, Outfit, DM_Mono } from 'next/font/google'
import './globals.css'

const fontDisplay = DM_Serif_Display({
  weight: ['400'],
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const fontBody = Outfit({
  weight: ['300', '400', '500', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

const fontMono = DM_Mono({
  weight: ['300', '400', '500'],
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'SPAN — Stock Screener',
    template: '%s · SPAN',
  },
  description: 'Fundamental analysis, backtesting, and DCF valuation for 100+ stocks. Instant BUY / HOLD / SELL signals.',
  metadataBase: new URL('https://span-screener.vercel.app'),
  openGraph: {
    title: 'SPAN — Stock Screener',
    description: 'Fundamental analysis, backtesting, and DCF valuation in seconds.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#03070f',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fontDisplay.variable} ${fontBody.variable} ${fontMono.variable}`}>
      <body className="antialiased relative">{children}</body>
    </html>
  )
}
