import Link from 'next/link'
import Footer from './components/Footer'
import TickerSearchForm from './components/TickerSearchForm'
import RecentlyViewed from './components/RecentlyViewed'
import { api } from '@/lib/api'
import SignalBadge from './components/SignalBadge'
import type { DashboardStock } from '@/lib/types'

export const revalidate = 60

// SVG icons
const IconBarChart = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>
  </svg>
)
const IconRefresh = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.63"/>
  </svg>
)
const IconTarget = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
)
const IconTrophy = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="8 21 12 21 16 21"/><line x1="12" y1="17" x2="12" y2="21"/>
    <path d="M7 4H17a2 2 0 0 1 2 2v3a6 6 0 0 1-6 6 6 6 0 0 1-6-6V6a2 2 0 0 1 2-2z"/>
    <path d="M5 9H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h2"/><path d="M19 9h2a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2"/>
  </svg>
)

const features = [
  {
    Icon: IconBarChart,
    color: { bg: 'rgba(16,185,129,0.08)', icon: '#10b981', border: 'rgba(16,185,129,0.14)' },
    title: '5-Check Screener',
    description: 'Revenue growth, margins, balance sheet strength, P/S ratio, and technicals — distilled into a single BUY / HOLD / SELL signal.',
  },
  {
    Icon: IconRefresh,
    color: { bg: 'rgba(139,92,246,0.08)', icon: '#a78bfa', border: 'rgba(139,92,246,0.14)' },
    title: '5-Year Backtest',
    description: 'See exactly how the algorithm performed historically against buy-and-hold, with a full trade log and equity curve.',
  },
  {
    Icon: IconTarget,
    color: { bg: 'rgba(59,130,246,0.08)', icon: '#60a5fa', border: 'rgba(59,130,246,0.14)' },
    title: 'DCF Analyzer',
    description: 'Bear / Base / Bull scenario valuation. Dial in growth, margins, and P/E multiples to discover your personal fair value.',
  },
  {
    Icon: IconTrophy,
    color: { bg: 'rgba(245,158,11,0.08)', icon: '#fbbf24', border: 'rgba(245,158,11,0.14)' },
    title: 'Live Leaderboard',
    description: 'Continuously-ranked list of 100+ tickers scored by fundamentals. Filter by signal, sector, or market cap instantly.',
  },
]

export default async function HomePage() {
  const dashboard   = await api.dashboard(100).catch(() => null)
  const topBuys     = dashboard?.stocks.filter(s => s.signal === 'BUY').slice(0, 6) ?? []
  const buyCount    = dashboard?.stocks.filter(s => s.signal === 'BUY').length ?? 0
  const totalScanned = dashboard?.stocks.length ?? 0

  return (
    <div className="min-h-screen relative z-10">
      {/* ── Navbar ── */}
      <nav className="border-b border-white/[0.06] bg-[#03070f]/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
          <span className="text-gradient font-display font-bold text-lg tracking-[4px]">SPAN</span>
          <Link
            href="/dashboard"
            className="btn btn-primary"
            style={{ background: 'rgba(16,185,129,0.12)', borderColor: 'rgba(16,185,129,0.22)', color: '#34d399' }}
          >
            View Leaderboard →
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden py-24 px-5">
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute left-1/2 top-0 -translate-x-1/2 w-[700px] h-[500px] opacity-30"
            style={{ background: 'radial-gradient(ellipse at center, rgba(16,185,129,0.18) 0%, transparent 65%)' }}
          />
          <div
            className="absolute left-1/4 bottom-0 w-[400px] h-[300px] opacity-20"
            style={{ background: 'radial-gradient(ellipse at center, rgba(59,130,246,0.2) 0%, transparent 65%)' }}
          />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          {totalScanned > 0 && (
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-8 animate-fade-in"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
              <span className="font-mono">{buyCount}</span>
              <span className="opacity-60">BUY signals across</span>
              <span className="font-mono">{totalScanned}</span>
              <span className="opacity-60">stocks</span>
            </div>
          )}

          <h1 className="font-display text-6xl sm:text-7xl leading-[1.0] mb-6 animate-fade-up" style={{ animationDelay: '0.05s' }}>
            <span className="text-white">Invest with</span>
            <br />
            <span className="text-gradient">conviction.</span>
          </h1>

          <p className="text-mist text-lg leading-relaxed max-w-xl mx-auto mb-10 font-body animate-fade-up" style={{ animationDelay: '0.12s' }}>
            Fundamental analysis, backtesting, and DCF valuation in seconds.
            Search any ticker for an instant signal.
          </p>

          <div className="animate-fade-up" style={{ animationDelay: '0.18s' }}>
            <TickerSearchForm />
          </div>

          <div className="animate-fade-up" style={{ animationDelay: '0.24s' }}>
            <RecentlyViewed />
          </div>
        </div>
      </section>

      {/* ── Top BUY signals ── */}
      {topBuys.length > 0 && (
        <section className="max-w-5xl mx-auto px-5 pb-16">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-1 h-4 rounded-full" style={{ background: 'linear-gradient(180deg, #34d399, #059669)' }} />
              <h2 className="text-xs font-semibold text-mist uppercase tracking-[0.1em]">Top BUY Signals</h2>
            </div>
            <Link href="/dashboard?signal=BUY" className="text-xs font-semibold" style={{ color: '#34d399' }}>
              All {buyCount} →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {topBuys.map((s) => (
              <BuyCard key={s.symbol} stock={s} />
            ))}
          </div>
        </section>
      )}

      {/* ── Feature grid ── */}
      <section className="max-w-5xl mx-auto px-5 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-4 rounded-full" style={{ background: 'linear-gradient(180deg, #60a5fa, #3b82f6)' }} />
          <h2 className="text-xs font-semibold text-mist uppercase tracking-[0.1em]">What&apos;s inside</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map(({ Icon, color, title, description }) => (
            <div
              key={title}
              className="rounded-xl p-5"
              style={{ background: '#0a1221', border: '1px solid rgba(255,255,255,0.07)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
                style={{ background: color.bg, border: `1px solid ${color.border}`, color: color.icon }}
              >
                <Icon />
              </div>
              <h3 className="font-semibold text-white text-sm mb-1.5">{title}</h3>
              <p className="text-xs text-fog leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-5">
        <Footer />
      </div>
    </div>
  )
}

function BuyCard({ stock: s }: { stock: DashboardStock }) {
  return (
    <Link
      href={`/view/${s.symbol}`}
      className="group relative rounded-xl p-4 block transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-500/25 hover:shadow-elevated"
      style={{ background: '#0a1221', border: '1px solid rgba(255,255,255,0.07)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-mono font-bold text-white text-sm tracking-wider">{s.symbol}</div>
          <div className="text-[10px] text-smoke mt-0.5 truncate max-w-[110px]">{s.companyName}</div>
        </div>
        <SignalBadge signal={s.signal} size="sm" />
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="font-mono text-sm font-bold text-white">{s.price ?? '—'}</span>
        <span className="font-mono text-xs font-bold" style={{ color: s.score >= 15 ? '#34d399' : '#60a5fa' }}>
          {s.score}pts
        </span>
      </div>

      <div className="flex gap-0.5 mt-3">
        {Array.from({ length: s.totalChecks }).map((_, i) => (
          <span
            key={i}
            className="flex-1 h-0.5 rounded-full"
            style={{ background: i < s.greens ? '#10b981' : 'rgba(239,68,68,0.35)' }}
          />
        ))}
      </div>
    </Link>
  )
}
