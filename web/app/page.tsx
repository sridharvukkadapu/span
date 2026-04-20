import Link from 'next/link'
import Footer from './components/Footer'
import SearchBar from './components/SearchBar'
import DashboardFilters from './dashboard/DashboardFilters'
import WatchlistPreviewStrip from './components/WatchlistPreviewStrip'
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

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #FFFFFF 0%, #F7F6F2 100%)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        {/* Subtle grid texture */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            backgroundImage:
              'linear-gradient(rgba(0,0,0,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.025) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 100%)',
          }}
        />

        <div className="max-w-[1280px] mx-auto px-6 sm:px-8 pt-14 pb-12 relative">
          {/* Eyebrow */}
          <div className="flex items-center gap-2 mb-5">
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                fontFamily: 'var(--font-sans), "IBM Plex Sans", sans-serif',
                fontSize: '10px', fontWeight: 600, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: '#047857',
                background: 'rgba(4,120,87,0.08)',
                border: '1px solid rgba(4,120,87,0.18)',
                borderRadius: '99px', padding: '4px 10px',
              }}
            >
              <span
                style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: '#047857', display: 'inline-block',
                  animation: 'pulse-dot 2s ease-in-out infinite',
                }}
              />
              Live · {stocks.length} stocks screened
            </span>
          </div>

          {/* Headline */}
          <h1
            className="mb-4"
            style={{
              fontFamily: 'var(--font-serif), "Playfair Display", Georgia, serif',
              fontSize: 'clamp(32px, 5vw, 56px)',
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              color: '#0A0F0A',
              maxWidth: '680px',
            }}
          >
            Fundamental screening,
            <br />
            <span style={{ fontStyle: 'italic', color: '#047857' }}>
              built for clarity.
            </span>
          </h1>

          {/* Subhead */}
          <p
            className="mb-8"
            style={{
              fontFamily: 'var(--font-sans), "IBM Plex Sans", sans-serif',
              fontSize: 'clamp(14px, 1.8vw, 17px)',
              fontWeight: 400,
              lineHeight: 1.6,
              color: '#6B7280',
              maxWidth: '520px',
            }}
          >
            Revenue growth, margins, balance sheet, valuation — scored GREEN / YELLOW / RED
            across {stocks.length > 0 ? stocks.length : '400+'} large-cap stocks. Updated continuously.
          </p>

          {/* Search + signal bar */}
          <div
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
            style={{ position: 'relative', zIndex: 40 }}
          >
            <div style={{ flex: '0 0 auto', width: 'min(100%, 440px)' }}>
              <SearchBar variant="hero" />
            </div>

            {stocks.length > 0 && (
              <div
                className="flex items-center gap-4 px-4 py-2.5 rounded-xl shrink-0"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid rgba(0,0,0,0.07)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                }}
              >
                {/* Mini bar */}
                <div className="flex h-[5px] rounded-full overflow-hidden gap-px" style={{ width: 64 }}>
                  {buyCount  > 0 && <div style={{ flex: buyCount,  background: '#059669' }} />}
                  {holdCount > 0 && <div style={{ flex: holdCount, background: '#D97706' }} />}
                  {sellCount > 0 && <div style={{ flex: sellCount, background: '#DC2626' }} />}
                </div>

                {[
                  { label: 'Buy',   value: buyCount,     color: '#047857' },
                  { label: 'Hold',  value: holdCount,    color: '#92400E' },
                  { label: 'Sell',  value: sellCount,    color: '#991B1B' },
                  { label: 'Total', value: stocks.length, color: '#374151', divider: true },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-4">
                    {s.divider && <div style={{ width: 1, height: 22, background: 'rgba(0,0,0,0.08)' }} />}
                    <div className="flex flex-col items-center leading-none">
                      <span style={{
                        fontFamily: 'var(--font-serif), "Playfair Display", Georgia, serif',
                        fontSize: '17px', fontWeight: 700, color: s.color,
                        fontVariantNumeric: 'tabular-nums',
                      }}>{s.value}</span>
                      <span style={{
                        fontFamily: 'var(--font-sans), "IBM Plex Sans", sans-serif',
                        fontSize: '8px', fontWeight: 500, letterSpacing: '0.1em',
                        textTransform: 'uppercase', color: '#9CA3AF', marginTop: '3px',
                      }}>{s.label}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Feature chips */}
          <div className="flex flex-wrap items-center gap-2 mt-6">
            {FEATURES.map(f => (
              <span
                key={f}
                style={{
                  fontFamily: 'var(--font-sans), "IBM Plex Sans", sans-serif',
                  fontSize: '11px', color: '#6B7280',
                  background: 'rgba(0,0,0,0.04)',
                  border: '1px solid rgba(0,0,0,0.07)',
                  borderRadius: '6px',
                  padding: '4px 9px',
                }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Watchlist strip ───────────────────────────────────── */}
      <div className="max-w-[1280px] mx-auto px-6 sm:px-8 pt-6">
        <WatchlistPreviewStrip />
      </div>

      {/* ── Leaderboard ───────────────────────────────────────── */}
      <main className="max-w-[1280px] mx-auto px-6 sm:px-8 pb-8">

        {/* Section label */}
        <div
          className="flex items-center justify-between py-4"
          style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', marginBottom: '16px' }}
        >
          <div className="flex items-center gap-2">
            <h2
              style={{
                fontFamily: 'var(--font-sans), "IBM Plex Sans", sans-serif',
                fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: '#374151',
              }}
            >
              Leaderboard
            </h2>
            {stocks.length > 0 && (
              <span
                style={{
                  fontFamily: 'var(--font-mono), "JetBrains Mono", monospace',
                  fontSize: '10px', color: '#9CA3AF',
                  background: 'rgba(0,0,0,0.04)',
                  border: '1px solid rgba(0,0,0,0.07)',
                  borderRadius: '4px',
                  padding: '2px 6px',
                }}
              >
                {stocks.length} stocks
              </span>
            )}
          </div>
          <span
            style={{
              fontFamily: 'var(--font-sans), "IBM Plex Sans", sans-serif',
              fontSize: '10px', color: '#9CA3AF',
            }}
          >
            Ranked by composite score · refreshes every 60s
          </span>
        </div>

        {/* Table */}
        <div style={{ position: 'relative', zIndex: 10 }}>
          <DashboardFilters stocks={stocks} />
        </div>

        {/* How it works */}
        <div
          className="mt-12 rounded-2xl overflow-hidden"
          style={{
            background: '#FFFFFF',
            border: '1px solid rgba(0,0,0,0.07)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          {/* Header */}
          <div
            className="px-6 py-5"
            style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-serif), "Playfair Display", Georgia, serif',
                fontSize: '18px', fontWeight: 700, color: '#111827',
                letterSpacing: '-0.01em',
              }}
            >
              How the score works
            </h2>
            <p
              style={{
                fontFamily: 'var(--font-sans), "IBM Plex Sans", sans-serif',
                fontSize: '12px', color: '#9CA3AF', marginTop: '3px',
              }}
            >
              Six independent checks, one composite score.
            </p>
          </div>

          {/* Cards — desktop */}
          <div className="hidden lg:grid grid-cols-4">
            {HOW_IT_WORKS.map(({ step, title, description, icon }, i) => (
              <div
                key={title}
                className="p-6 relative group"
                style={{
                  borderRight: i < HOW_IT_WORKS.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                }}
              >
                <div
                  className="absolute top-0 left-0 right-0 h-[2px]"
                  style={{ background: 'linear-gradient(90deg, #047857, rgba(4,120,87,0.1))' }}
                />
                <div
                  className="mb-3 w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(4,120,87,0.08)', border: '1px solid rgba(4,120,87,0.14)' }}
                >
                  <span style={{ fontSize: '16px', lineHeight: 1 }}>{icon}</span>
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-mono), "JetBrains Mono", monospace',
                    fontSize: '9px', fontWeight: 600, letterSpacing: '0.12em',
                    textTransform: 'uppercase', color: '#047857', marginBottom: '6px',
                  }}
                >
                  0{step}
                </div>
                <h3
                  style={{
                    fontFamily: 'var(--font-sans), "IBM Plex Sans", sans-serif',
                    fontSize: '13px', fontWeight: 600, color: '#111827',
                    marginBottom: '6px', lineHeight: 1.3,
                  }}
                >
                  {title}
                </h3>
                <p
                  style={{
                    fontFamily: 'var(--font-sans), "IBM Plex Sans", sans-serif',
                    fontSize: '11px', lineHeight: 1.6, color: '#6B7280',
                  }}
                >
                  {description}
                </p>
              </div>
            ))}
          </div>

          {/* Cards — mobile */}
          <div className="lg:hidden divide-y divide-black/[0.05]">
            {HOW_IT_WORKS.map(({ step, title, description, icon }) => (
              <div key={title} className="flex gap-4 p-5 items-start">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: 'rgba(4,120,87,0.08)', border: '1px solid rgba(4,120,87,0.14)' }}
                >
                  <span style={{ fontSize: '15px', lineHeight: 1 }}>{icon}</span>
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono), "JetBrains Mono", monospace',
                      fontSize: '9px', fontWeight: 600, letterSpacing: '0.1em',
                      textTransform: 'uppercase', color: '#047857', marginBottom: '3px',
                    }}
                  >
                    0{step}
                  </div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-sans), "IBM Plex Sans", sans-serif',
                      fontSize: '13px', fontWeight: 600, color: '#111827', marginBottom: '4px',
                    }}
                  >
                    {title}
                  </h3>
                  <p
                    style={{
                      fontFamily: 'var(--font-sans), "IBM Plex Sans", sans-serif',
                      fontSize: '11px', lineHeight: 1.6, color: '#6B7280',
                    }}
                  >
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10">
          <Footer />
        </div>
      </main>
    </div>
  )
}

const FEATURES = [
  '6-factor screener',
  'BUY / HOLD / SELL signal',
  'DCF valuation',
  '3-year projection',
  'Balance sheet analysis',
  'Technicals (SMA50 · RSI)',
]

const HOW_IT_WORKS = [
  {
    step: 1,
    icon: '⬡',
    title: '6-Factor Screener',
    description: 'Revenue growth, margins, balance sheet, valuation, price trend, and earnings quality — each scored GREEN / YELLOW / RED.',
  },
  {
    step: 2,
    icon: '◎',
    title: 'Composite Score',
    description: 'Checks aggregate into a single score from −17 to +25. Score maps to BUY / HOLD / SELL with confidence level.',
  },
  {
    step: 3,
    icon: '⌁',
    title: 'DCF Valuation',
    description: 'Bear, base, and bull scenario fair value using discounted cash flow. Edit every assumption in real time.',
  },
  {
    step: 4,
    icon: '▤',
    title: 'Key Financials',
    description: 'Revenue history, margins, balance sheet strength, and 3-year price projection — all on one page.',
  },
]
