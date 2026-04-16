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

        {/* ── Hero search bar ── */}
        <div className="flex flex-col items-center gap-3 py-10">
          <h1
            style={{
              fontFamily:    'var(--font-serif), "Playfair Display", Georgia, serif',
              fontSize:      'clamp(28px, 4vw, 42px)',
              fontWeight:    700,
              fontStyle:     'italic',
              color:         '#111827',
              letterSpacing: '-0.02em',
              textAlign:     'center',
              lineHeight:    1.15,
            }}
          >
            Fundamentals. At a glance.
          </h1>
          <p
            className="text-center max-w-sm"
            style={{
              fontFamily: 'var(--font-sans), Inter, sans-serif',
              fontSize:   '13px',
              color:      '#9CA3AF',
              lineHeight: 1.6,
            }}
          >
            Screens, DCF valuations, and 5-year backtests for 100+ stocks
          </p>
          <div className="mt-2 w-full max-w-md">
            <SearchBar variant="hero" />
          </div>
        </div>

        {/* ── Stat strip ── */}
        {stocks.length > 0 && (
          <div className="grid grid-cols-4 gap-3 mb-6 animate-fade-up" style={{ animationDelay: '0.04s' }}>
            {[
              { label: 'Buy',   value: buyCount,      color: '#047857', bg: '#D1FAE5', border: 'rgba(4,120,87,0.25)' },
              { label: 'Hold',  value: holdCount,     color: '#92400E', bg: '#FEF3C7', border: 'rgba(146,64,14,0.25)' },
              { label: 'Sell',  value: sellCount,     color: '#991B1B', bg: '#FEE2E2', border: 'rgba(153,27,27,0.2)' },
              { label: 'Total', value: stocks.length, color: '#374151', bg: '#FFFFFF', border: 'rgba(0,0,0,0.09)' },
            ].map(s => (
              <div
                key={s.label}
                className="rounded-xl px-4 py-3"
                style={{
                  background: s.bg,
                  border:     `1px solid ${s.border}`,
                  boxShadow:  '0 1px 3px rgba(0,0,0,0.05)',
                }}
              >
                <div
                  style={{
                    fontFamily:  'var(--font-serif), "Playfair Display", Georgia, serif',
                    fontSize:    '28px',
                    fontWeight:  700,
                    lineHeight:  1,
                    color:       s.color,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {s.value}
                </div>
                <div
                  className="mt-1"
                  style={{
                    fontFamily:    'var(--font-sans), Inter, sans-serif',
                    fontSize:      '10px',
                    fontWeight:    500,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color:         '#9CA3AF',
                  }}
                >
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        )}

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
    title: '5-Factor Screener',
    description: 'Revenue growth, margins, balance sheet, valuation ratio, and price trend — each scored GREEN / YELLOW / RED.',
  },
  {
    step: 2,
    title: 'Composite Score',
    description: 'Checks aggregate into a single score from −17 to +25. Score maps to BUY / HOLD / SELL with confidence level.',
  },
  {
    step: 3,
    title: '5-Year Backtest',
    description: 'Every signal validated against historical performance. See if the algorithm beat buy-and-hold over 5 years.',
  },
  {
    step: 4,
    title: 'DCF Valuation',
    description: 'Bear, base, and bull scenario fair value using discounted cash flow. Edit every assumption in real time.',
  },
]
