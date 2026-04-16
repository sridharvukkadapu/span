import { api } from '@/lib/api'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import WatchlistClient from './WatchlistClient'

export const revalidate = 0

export default async function WatchlistPage() {
  const [tickers, dashboard] = await Promise.all([
    api.watchlist.list().catch(() => [] as string[]),
    api.dashboard(20).catch(() => null),
  ])
  const topStocks = (dashboard?.stocks ?? [])
    .filter(s => s.signal === 'BUY')
    .slice(0, 5)
    .map(s => ({ symbol: s.symbol, companyName: s.companyName, score: s.score }))

  return (
    <div className="min-h-screen" style={{ background: '#F7F6F2' }}>
      <Navbar />

      <div className="max-w-2xl mx-auto px-5 sm:px-8 py-8 space-y-5">

        {/* Header */}
        <div className="animate-fade-up">
          <h1
            style={{
              fontFamily:    'var(--font-serif), "Playfair Display", Georgia, serif',
              fontSize:      '28px',
              fontWeight:    700,
              fontStyle:     'italic',
              color:         '#111827',
              letterSpacing: '-0.02em',
              lineHeight:    1.2,
            }}
          >
            Watchlist
          </h1>
          <p
            className="mt-1"
            style={{
              fontFamily: 'var(--font-sans), Inter, sans-serif',
              fontSize:   '13px',
              color:      '#9CA3AF',
            }}
          >
            Track your favourite tickers
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-xl overflow-hidden animate-fade-up"
          style={{
            animationDelay: '0.06s',
            background:     '#FFFFFF',
            border:         '1px solid rgba(0,0,0,0.07)',
            boxShadow:      '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}
          >
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span
                style={{
                  fontFamily: 'var(--font-sans), Inter, sans-serif',
                  fontSize:   '13px',
                  fontWeight: 600,
                  color:      '#111827',
                }}
              >
                My Watchlist
              </span>
            </div>
            <span
              style={{
                fontFamily:  'var(--font-mono), "JetBrains Mono", monospace',
                fontSize:    '11px',
                fontWeight:  600,
                background:  'rgba(0,0,0,0.04)',
                color:       '#6B7280',
                border:      '1px solid rgba(0,0,0,0.08)',
                borderRadius: '4px',
                padding:     '1px 7px',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {tickers.length}
            </span>
          </div>

          <WatchlistClient initialTickers={tickers} topSuggestions={topStocks} />
        </div>

        <Footer />
      </div>
    </div>
  )
}
