import Link from 'next/link'
import Footer from './components/Footer'
import SearchBar from './components/SearchBar'
import DashboardFilters from './dashboard/DashboardFilters'
import WatchlistPreviewStrip from './components/WatchlistPreviewStrip'
import FirstVisitBanner from './components/FirstVisitBanner'
import Navbar from './components/Navbar'
import { api } from '@/lib/api'

export const revalidate = 60

export default async function HomePage() {
  const dashboard = await api.dashboard(100).catch(() => null)
  const stocks    = dashboard?.stocks ?? []

  const buyCount  = stocks.filter(s => s.signal === 'BUY').length
  const holdCount = stocks.filter(s => s.signal === 'HOLD').length
  const sellCount = stocks.filter(s => s.signal === 'SELL').length

  return (
    <div className="min-h-screen" style={{ background: '#F7F6F2' }}>

      <Navbar />

      {/* ── First-visit dismissible banner ── */}
      <FirstVisitBanner />

      {/* ── Main content ── */}
      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 py-8">

        {/* ── Watchlist preview strip ── */}
        <WatchlistPreviewStrip />

        {/* ── Top bar: search + signal distribution ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5 animate-fade-up">
          {/* Search */}
          <div className="flex-1 max-w-md relative z-[50]">
            <SearchBar variant="hero" />
          </div>

          {/* Signal distribution bar */}
          {stocks.length > 0 && (
            <div
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl shrink-0"
              style={{
                background: '#FFFFFF',
                border:     '1px solid rgba(0,0,0,0.07)',
                boxShadow:  '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              {/* Stacked bar */}
              <div className="flex items-center h-5 rounded-md overflow-hidden gap-px" style={{ width: 80 }}>
                {buyCount  > 0 && <div style={{ flex: buyCount,  background: '#047857' }} className="h-full" title={`${buyCount} BUY`} />}
                {holdCount > 0 && <div style={{ flex: holdCount, background: '#D97706' }} className="h-full" title={`${holdCount} HOLD`} />}
                {sellCount > 0 && <div style={{ flex: sellCount, background: '#991B1B' }} className="h-full" title={`${sellCount} SELL`} />}
              </div>
              {/* Counts */}
              <div className="flex items-center gap-3">
                {[
                  { label: 'Buy',  value: buyCount,  color: '#047857' },
                  { label: 'Hold', value: holdCount, color: '#92400E' },
                  { label: 'Sell', value: sellCount, color: '#991B1B' },
                ].map(s => (
                  <div key={s.label} className="flex flex-col items-center leading-none">
                    <span style={{
                      fontFamily: 'var(--font-serif), "Playfair Display", Georgia, serif',
                      fontSize: '18px', fontWeight: 700, color: s.color,
                      fontVariantNumeric: 'tabular-nums',
                    }}>{s.value}</span>
                    <span style={{
                      fontFamily: 'var(--font-sans), "IBM Plex Sans", sans-serif',
                      fontSize: '9px', fontWeight: 500, letterSpacing: '0.08em',
                      textTransform: 'uppercase', color: '#9CA3AF', marginTop: '2px',
                    }}>{s.label}</span>
                  </div>
                ))}
                <div style={{ width: 1, height: 24, background: 'rgba(0,0,0,0.08)' }} />
                <div className="flex flex-col items-center leading-none">
                  <span style={{
                    fontFamily: 'var(--font-serif), "Playfair Display", Georgia, serif',
                    fontSize: '18px', fontWeight: 700, color: '#374151',
                    fontVariantNumeric: 'tabular-nums',
                  }}>{stocks.length}</span>
                  <span style={{
                    fontFamily: 'var(--font-sans), "IBM Plex Sans", sans-serif',
                    fontSize: '9px', fontWeight: 500, letterSpacing: '0.08em',
                    textTransform: 'uppercase', color: '#9CA3AF', marginTop: '2px',
                  }}>Total</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Section header ── */}
        <div className="flex items-center justify-between mb-3 animate-fade-up" style={{ animationDelay: '0.08s' }}>
          <h2
            style={{
              fontFamily:    'var(--font-sans), Inter, sans-serif',
              fontSize:      '11px',
              fontWeight:    600,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color:         '#9CA3AF',
            }}
          >
            Leaderboard
          </h2>
          {stocks.length > 0 && (
            <span
              style={{
                fontFamily: 'var(--font-mono), "JetBrains Mono", monospace',
                fontSize:   '11px',
                color:      '#D1D5DB',
              }}
            >
              {stocks.length} stocks
            </span>
          )}
        </div>

        {/* ── Leaderboard table ── */}
        <div className="animate-fade-up" style={{ animationDelay: '0.12s' }}>
          <DashboardFilters stocks={stocks} />
        </div>

        {/* ── How it works ── */}
        <details
          className="mt-10 rounded-xl overflow-hidden animate-fade-up"
          style={{
            border:          '1px solid rgba(0,0,0,0.07)',
            background:      '#FFFFFF',
            animationDelay:  '0.18s',
            boxShadow:       '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <summary
            className="flex items-center justify-between px-5 py-4 cursor-pointer select-none list-none"
          >
            <span
              style={{
                fontFamily:    'var(--font-sans), Inter, sans-serif',
                fontSize:      '12px',
                fontWeight:    600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color:         '#374151',
              }}
            >
              How the score works
            </span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </summary>

          <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            <div className="hidden lg:flex items-stretch gap-0">
              {HOW_IT_WORKS.map(({ step, title, description }, i) => (
                <div key={title} className="flex items-stretch flex-1">
                  <div
                    className="relative flex-1 p-5"
                    style={{ borderRight: i < HOW_IT_WORKS.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}
                  >
                    <div className="h-[2px] absolute top-0 left-0 right-0" style={{ background: '#047857' }} />
                    <div
                      style={{
                        fontFamily:  'var(--font-serif), "Playfair Display", Georgia, serif',
                        fontSize:    '20px',
                        fontWeight:  700,
                        color:       'rgba(0,0,0,0.12)',
                        lineHeight:  1,
                        marginBottom: '10px',
                        marginTop:   '4px',
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      0{step}
                    </div>
                    <h3
                      className="font-semibold text-[13px] mb-1.5 leading-snug"
                      style={{ color: '#111827', fontFamily: 'var(--font-sans), Inter, sans-serif' }}
                    >
                      {title}
                    </h3>
                    <p
                      className="text-[11px] leading-relaxed"
                      style={{ color: '#6B7280', fontFamily: 'var(--font-sans), Inter, sans-serif' }}
                    >
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-0 lg:hidden">
              {HOW_IT_WORKS.map(({ step, title, description }, i) => (
                <div
                  key={title}
                  className="flex gap-4 items-start p-4"
                  style={{ borderBottom: i < HOW_IT_WORKS.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none' }}
                >
                  <span
                    style={{
                      fontFamily:  'var(--font-serif), "Playfair Display", Georgia, serif',
                      fontSize:    '18px',
                      fontWeight:  700,
                      color:       'rgba(0,0,0,0.15)',
                      flexShrink:  0,
                      width:       '24px',
                      textAlign:   'center',
                      lineHeight:  1,
                    }}
                  >
                    0{step}
                  </span>
                  <div>
                    <h3
                      className="font-semibold text-[13px] mb-1"
                      style={{ color: '#111827', fontFamily: 'var(--font-sans), Inter, sans-serif' }}
                    >
                      {title}
                    </h3>
                    <p
                      className="text-[11px] leading-relaxed"
                      style={{ color: '#6B7280', fontFamily: 'var(--font-sans), Inter, sans-serif' }}
                    >
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </details>

        <div className="mt-10">
          <Footer />
        </div>
      </div>
    </div>
  )
}

const HOW_IT_WORKS = [
  {
    step: 1,
    title: '6-Factor Screener',
    description: 'Revenue growth, margins, balance sheet, valuation, price trend, and earnings quality — each scored GREEN / YELLOW / RED.',
  },
  {
    step: 2,
    title: 'Composite Score',
    description: 'Checks aggregate into a single score from −17 to +25. Score maps to BUY / HOLD / SELL with confidence level.',
  },
  {
    step: 3,
    title: 'DCF Valuation',
    description: 'Bear, base, and bull scenario fair value using discounted cash flow. Edit every assumption in real time.',
  },
  {
    step: 4,
    title: 'Key Financials',
    description: 'Revenue history, margins, balance sheet strength, and 3-year price projection — all on one page.',
  },
]
