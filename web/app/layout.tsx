import type { Metadata, Viewport } from 'next'
import { IBM_Plex_Sans, IBM_Plex_Mono, JetBrains_Mono } from 'next/font/google'
import './globals.css'

// IBM Plex Sans — authoritative, financial, trustworthy
const fontBody = IBM_Plex_Sans({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

// IBM Plex Mono — precise tabular figures for data labels
const fontDisplay = IBM_Plex_Sans({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

// JetBrains Mono — best-in-class monospace for financial data
const fontMono = JetBrains_Mono({
  weight: ['400', '500', '600', '700'],
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
  metadataBase: new URL('https://span-flame.vercel.app'),
  openGraph: {
    title: 'SPAN — Stock Screener',
    description: 'Fundamental analysis, backtesting, and DCF valuation in seconds.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#020508',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fontBody.variable} ${fontDisplay.variable} ${fontMono.variable}`}>
      <body className="antialiased relative">{children}</body>
    </html>
  )
}
