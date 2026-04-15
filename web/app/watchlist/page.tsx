import { api } from '@/lib/api'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import WatchlistClient from './WatchlistClient'

export const revalidate = 0

export default async function WatchlistPage() {
  const tickers = await api.watchlist.list().catch(() => [] as string[])

  return (
    <div className="min-h-screen relative z-10">
      <Navbar />

      <div className="max-w-2xl mx-auto px-5 py-8 space-y-5">

        {/* Header */}
        <div className="animate-fade-up">
          <h1 className="text-3xl font-display text-white">Watchlist</h1>
          <p className="text-sm text-fog mt-1">Track your favourite tickers</p>
        </div>

        {/* Card */}
        <div
          className="rounded-xl overflow-hidden animate-fade-up"
          style={{
            animationDelay: '0.06s',
            background: '#0a1221',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span className="text-sm font-semibold text-white">My Watchlist</span>
            </div>
            <span
              className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full"
              style={{ background: 'rgba(59,130,246,0.1)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.2)' }}
            >
              {tickers.length}
            </span>
          </div>

          <WatchlistClient initialTickers={tickers} />
        </div>

        <Footer />
      </div>
    </div>
  )
}
