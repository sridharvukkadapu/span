import type { Metadata, Viewport } from 'next'
import { Playfair_Display, Inter, JetBrains_Mono } from 'next/font/google'
import BottomTabBar from './components/BottomTabBar'
import './globals.css'

const fontSerif = Playfair_Display({
  weight: ['400', '600', '700', '900'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
})

const fontSans = Inter({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

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
  themeColor: '#F7F6F2',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fontSerif.variable} ${fontSans.variable} ${fontMono.variable}`}>
      <body className="antialiased relative pb-[52px] sm:pb-0">
        {children}
        <BottomTabBar />
      </body>
    </html>
  )
}
