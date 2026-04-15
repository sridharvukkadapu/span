import Link from 'next/link'
import Footer from './components/Footer'
import TickerSearchForm from './components/TickerSearchForm'
import RecentlyViewed from './components/RecentlyViewed'
import SignalBadge from './components/SignalBadge'
import { api } from '@/lib/api'
import type { DashboardStock } from '@/lib/types'

export const revalidate = 60

export default async function HomePage() {
  const dashboard    = await api.dashboard(100).catch(() => null)
  const stocks       = dashboard?.stocks ?? []
  const topBuys      = stocks.filter(s => s.signal === 'BUY').slice(0, 9)
  const buyCount     = stocks.filter(s => s.signal === 'BUY').length
  const holdCount    = stocks.filter(s => s.signal === 'HOLD').length
  const sellCount    = stocks.filter(s => s.signal === 'SELL').length
  const totalScanned = stocks.length
  const topStock     = topBuys[0]

  return (
    <div className="min-h-screen relative z-10">

      {/* ── Top bar ── */}
      <header className="border-b border-white/[0.05] bg-[#020508]/95 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-5 h-12 flex items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <span className="text-gradient-brand font-display font-bold text-base tracking-[4px]">SPAN</span>
            <div className="hidden sm:flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
              <span className="label-xs text-emerald-500/80">
                {totalScanned > 0 ? `${buyCount} BUY · ${holdCount} HOLD · ${sellCount} SELL` : 'Loading signals…'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/watchlist" className="btn btn-ghost text-[10px]">Watchlist</Link>
            <Link href="/dashboard" className="btn btn-primary text-[10px]">Leaderboard →</Link>
          </div>
        </div>
      </header>

      {/* ── Hero: split layout ── */}
      <section className="max-w-7xl mx-auto px-5 pt-16 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

          {/* Left: headline + search */}
          <div className="pt-4">
            {/* Signal summary strip */}
            {totalScanned > 0 && (
              <div className="flex items-center gap-4 mb-8 animate-fade-in">
                {[
                  { signal: 'BUY',  count: buyCount,  color: '#34d399', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.2)' },
                  { signal: 'HOLD', count: holdCount, color: '#fbbf24', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)' },
                  { signal: 'SELL', count: sellCount, color: '#f87171', bg: 'rgba(239,68,68,0.07)',   border: 'rgba(239,68,68,0.18)' },
                ].map(({ signal, count, color, bg, border }) => (
                  <Link key={signal} href={`/dashboard?signal=${signal}`}>
                    <div
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all hover:-translate-y-0.5"
                      style={{ background: bg, border: `1px solid ${border}` }}
                    >
                      <span className="num text-xl font-bold" style={{ color }}>{count}</span>
                      <span className="label-xs" style={{ color }}>{signal}</span>
                    </div>
                  </Link>
                ))}
                <span className="label-xs text-slate-600">of {totalScanned} stocks</span>
              </div>
            )}

            <h1 className="display-xl text-white mb-2 animate-fade-up" style={{ animationDelay: '0.05s' }}>
              Signal<br />
              <span className="text-gradient-green">Intelligence.</span>
            </h1>

            <p className="text-slate-500 text-base leading-relaxed mt-5 mb-8 max-w-sm animate-fade-up" style={{ animationDelay: '0.1s' }}>
              Fundamental screening, DCF valuation, and 5-year backtesting — distilled into a single score.
            </p>

            <div className="animate-fade-up" style={{ animationDelay: '0.15s' }}>
              <TickerSearchForm />
            </div>

            <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <RecentlyViewed />
            </div>
          </div>

          {/* Right: top stock spotlight */}
          {topStock ? (
            <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <TopStockSpotlight stock={topStock} rank={1} />
            </div>
          ) : (
            <div className="h-64 rounded-2xl animate-shimmer" />
          )}
        </div>
      </section>

      {/* ── Signal leaderboard preview ── */}
      {topBuys.length > 1 && (
        <section className="max-w-7xl mx-auto px-5 pb-16">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-px h-4 bg-emerald-500/40" />
              <span className="label-sm text-slate-400">Top BUY Signals</span>
            </div>
            <Link href="/dashboard" className="label-xs text-emerald-500 hover:text-emerald-400 transition-colors">
              View all {buyCount} →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {topBuys.slice(1, 9).map((s, i) => (
              <SignalCard key={s.symbol} stock={s} rank={i + 2} delay={i * 0.04} />
            ))}
          </div>
        </section>
      )}

      {/* ── How it works ── */}
      <section className="max-w-7xl mx-auto px-5 pb-24">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-px h-4 bg-blue-500/40" />
          <span className="label-sm text-slate-400">The Stack</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {stack.map(({ step, title, description, color }, i) => (
            <div
              key={title}
              className="animate-fade-up"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <div
                className="relative rounded-xl p-5 h-full"
                style={{ background: '#08111f', border: '1px solid rgba(255,255,255,0.06)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}
              >
                <div
                  className="num text-4xl font-bold mb-4 leading-none"
                  style={{ color, opacity: 0.5 }}
                >
                  0{step}
                </div>
                <h3 className="font-semibold text-white text-sm mb-1.5 leading-snug">{title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-5">
        <Footer />
      </div>
    </div>
  )
}

/* ── Spotlight card for the #1 BUY signal ── */
function TopStockSpotlight({ stock: s, rank }: { stock: DashboardStock; rank: number }) {
  const scoreMax   = 20
  const scoreMin   = -20
  const scoreRange = scoreMax - scoreMin
  const pct        = Math.max(0, Math.min(1, (s.score - scoreMin) / scoreRange))

  // SVG arc parameters
  const r = 52; const cx = 64; const cy = 64
  const circumference = 2 * Math.PI * r
  const arcLength     = circumference * 0.75          // 270° arc
  const dashOffset    = arcLength - arcLength * pct

  const signalColor =
    s.signal === 'BUY'  ? '#10b981' :
    s.signal === 'SELL' ? '#ef4444' : '#f59e0b'

  return (
    <Link href={`/view/${s.symbol}`} className="block group">
      <div
        className="relative rounded-2xl p-6 transition-all duration-300 group-hover:-translate-y-1"
        style={{
          background: 'linear-gradient(145deg, #0b1627 0%, #08111f 100%)',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05), 0 0 60px ${signalColor}18`,
        }}
      >
        {/* Ambient glow */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none opacity-20"
          style={{ background: `radial-gradient(ellipse at 30% 0%, ${signalColor}33 0%, transparent 60%)` }}
        />

        {/* Top row */}
        <div className="relative flex items-start justify-between mb-6">
          <div>
            <div className="label-xs text-slate-600 mb-1">#{rank} Top Signal</div>
            <div className="num font-bold text-white text-2xl tracking-wider">{s.symbol}</div>
            <div className="text-xs text-slate-500 mt-0.5 max-w-[160px] truncate">{s.companyName}</div>
          </div>
          <SignalBadge signal={s.signal} size="md" />
        </div>

        {/* Score ring + price */}
        <div className="relative flex items-center justify-between">
          {/* SVG score ring */}
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg viewBox="0 0 128 128" className="w-full h-full">
              {/* Background track */}
              <circle
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="8"
                strokeDasharray={`${arcLength} ${circumference}`}
                strokeDashoffset={circumference * 0.125}
                strokeLinecap="round"
                className="score-ring"
              />
              {/* Score fill */}
              <circle
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke={signalColor}
                strokeWidth="8"
                strokeDasharray={`${arcLength} ${circumference}`}
                strokeDashoffset={dashOffset + circumference * 0.125}
                strokeLinecap="round"
                className="score-ring"
                style={{
                  filter: `drop-shadow(0 0 8px ${signalColor}88)`,
                  transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)',
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="num text-3xl font-bold text-white leading-none">{s.score}</span>
              <span className="label-xs text-slate-500 mt-1">score</span>
            </div>
          </div>

          {/* Right: metrics */}
          <div className="flex-1 pl-6 space-y-3">
            <div>
              <div className="label-xs text-slate-600 mb-0.5">Price</div>
              <div className="num text-xl font-bold text-white">{s.price ?? '—'}</div>
            </div>
            <div>
              <div className="label-xs text-slate-600 mb-0.5">Mkt Cap</div>
              <div className="num text-sm font-semibold text-slate-300">{s.marketCap ?? '—'}</div>
            </div>
            <div>
              <div className="label-xs text-slate-600 mb-1">Checks</div>
              <div className="flex gap-1">
                {Array.from({ length: s.totalChecks }).map((_, i) => (
                  <span
                    key={i}
                    className="flex-1 h-1.5 rounded-full"
                    style={{ background: i < s.greens ? '#10b981' : 'rgba(239,68,68,0.35)' }}
                  />
                ))}
              </div>
              <div className="label-xs text-slate-600 mt-1">{s.greens}/{s.totalChecks} pass</div>
            </div>
          </div>
        </div>

        {/* Confidence */}
        <div
          className="relative mt-5 flex items-center justify-between rounded-lg px-4 py-2.5"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <span className="label-xs text-slate-600">Confidence</span>
          <span className="num text-xs font-bold" style={{ color: signalColor }}>{s.confidence}</span>
        </div>
      </div>
    </Link>
  )
}

/* ── Compact signal card for the grid ── */
function SignalCard({ stock: s, rank, delay }: { stock: DashboardStock; rank: number; delay: number }) {
  const signalColor =
    s.signal === 'BUY'  ? '#10b981' :
    s.signal === 'SELL' ? '#ef4444' : '#f59e0b'

  return (
    <Link
      href={`/view/${s.symbol}`}
      className="block group animate-fade-up"
      style={{ animationDelay: `${delay}s` }}
    >
      <div
        className="rounded-xl p-4 h-full transition-all duration-200 group-hover:-translate-y-0.5"
        style={{
          background: '#08111f',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="label-xs text-slate-600 mb-0.5">#{rank}</div>
            <div className="num font-bold text-white text-sm tracking-wide">{s.symbol}</div>
            <div className="text-[10px] text-slate-600 mt-0.5 truncate max-w-[90px]">{s.companyName}</div>
          </div>
          <div
            className="tag"
            style={{ background: `${signalColor}14`, color: signalColor, borderColor: `${signalColor}30` }}
          >
            {s.signal}
          </div>
        </div>

        <div className="flex items-center justify-between mb-2">
          <span className="num text-sm font-bold text-white">{s.price ?? '—'}</span>
          <span className="num text-xs font-bold" style={{ color: s.score >= 15 ? '#34d399' : '#60a5fa' }}>
            {s.score}
          </span>
        </div>

        <div className="flex gap-0.5">
          {Array.from({ length: s.totalChecks }).map((_, i) => (
            <span
              key={i}
              className="flex-1 h-0.5 rounded-full"
              style={{ background: i < s.greens ? '#10b981' : 'rgba(239,68,68,0.3)' }}
            />
          ))}
        </div>
      </div>
    </Link>
  )
}

const stack = [
  {
    step: 1,
    color: '#34d399',
    title: '5-Factor Screener',
    description: 'Revenue growth, margins, balance sheet, valuation ratio, and price trend — each scored GREEN / YELLOW / RED.',
  },
  {
    step: 2,
    color: '#60a5fa',
    title: 'Composite Score',
    description: 'Checks aggregate into a single score from −20 to +20. Score maps to a BUY / HOLD / SELL signal with confidence.',
  },
  {
    step: 3,
    color: '#a78bfa',
    title: '5-Year Backtest',
    description: 'Every signal is validated against historical performance. See if the algorithm beat buy-and-hold over 5 years.',
  },
  {
    step: 4,
    color: '#fbbf24',
    title: 'DCF Valuation',
    description: 'Bear, base, and bull scenario fair value using discounted cash flow. Edit every assumption in real time.',
  },
]
