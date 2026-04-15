import { notFound } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import Navbar from '../../components/Navbar'
import SignalBadge from '../../components/SignalBadge'
import Footer from '../../components/Footer'
import WatchlistButton from '../../components/WatchlistButton'
import ViewTracker from '../../components/ViewTracker'
import type { CheckResult, ScreenerResult } from '@/lib/types'

export const revalidate = 60

interface Props { params: { symbol: string } }

export default async function ScreenerPage({ params }: Props) {
  const symbol = params.symbol.toUpperCase()
  const r = await api.screener(symbol).catch(() => null)
  if (!r) notFound()

  const hasFinancials = r.margins.grossMargin != null || r.revenueAnalysis.revenueTtm != null
  const signalColor = r.signal === 'BUY' ? '#10b981' : r.signal === 'SELL' ? '#ef4444' : '#f59e0b'
  const signalColorDim = r.signal === 'BUY' ? 'rgba(16,185,129,0.12)' : r.signal === 'SELL' ? 'rgba(239,68,68,0.10)' : 'rgba(245,158,11,0.10)'

  const greens = r.checks.filter(c => c.light === 'GREEN').length
  const yellows = r.checks.filter(c => c.light === 'YELLOW').length
  const reds = r.checks.filter(c => c.light === 'RED').length
  // Derive display score from checks: each GREEN=+2, YELLOW=0, RED=-2, max 20
  const computedScore = (greens * 2) - (reds * 2)
  const scoreDisplayPct = Math.max(0, Math.min(1, (computedScore + 20) / 40))

  // Score arc math (based on computed score from checks)
  const R = 68; const cx = 80; const cy = 80
  const circumference = 2 * Math.PI * R
  const arcLength = circumference * 0.75
  const dashOffset = arcLength - arcLength * scoreDisplayPct

  return (
    <div className="min-h-screen relative z-10">
      <Navbar symbol={symbol} />

      <div className="max-w-5xl mx-auto px-5 py-8 space-y-5">

        {/* ── HERO ── */}
        <div
          className="relative overflow-hidden rounded-2xl animate-fade-up"
          style={{
            background: 'linear-gradient(160deg, #0c1828 0%, #080f1c 60%, #060c18 100%)',
            border: `1px solid ${signalColor}25`,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05), 0 0 80px ${signalColor}12`,
          }}
        >
          {/* Ambient gradient behind score ring */}
          <div
            className="pointer-events-none absolute -top-16 -left-16 w-[500px] h-[500px] opacity-20"
            style={{ background: `radial-gradient(ellipse, ${signalColor}40 0%, transparent 60%)` }}
          />
          <div
            className="pointer-events-none absolute bottom-0 right-0 w-[300px] h-[300px] opacity-10"
            style={{ background: `radial-gradient(ellipse, ${signalColor}60 0%, transparent 65%)` }}
          />

          <div className="relative z-10 p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row gap-8">

              {/* Left: score ring + signal */}
              <div className="flex flex-col items-center lg:items-start gap-4">
                {/* Score Arc Ring */}
                <div
                  className="relative w-40 h-40 flex-shrink-0"
                  role="img"
                  aria-label={`Score ${computedScore} out of 20 — ${r.signal} signal`}
                >
                  <svg viewBox="0 0 160 160" className="w-full h-full" aria-hidden="true">
                    {/* Track */}
                    <circle
                      cx={cx} cy={cy} r={R}
                      fill="none"
                      stroke="rgba(255,255,255,0.05)"
                      strokeWidth="10"
                      strokeDasharray={`${arcLength} ${circumference}`}
                      strokeDashoffset={circumference * 0.125}
                      strokeLinecap="round"
                      style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                    />
                    {/* Fill */}
                    <circle
                      cx={cx} cy={cy} r={R}
                      fill="none"
                      stroke={signalColor}
                      strokeWidth="10"
                      strokeDasharray={`${arcLength} ${circumference}`}
                      strokeDashoffset={dashOffset + circumference * 0.125}
                      strokeLinecap="round"
                      style={{
                        transform: 'rotate(-90deg)',
                        transformOrigin: '50% 50%',
                        filter: `drop-shadow(0 0 12px ${signalColor}99)`,
                        transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)',
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="num text-4xl font-bold text-white leading-none" style={{ color: signalColor }}>
                      {computedScore}
                    </span>
                    <span className="label-xs text-slate-500 mt-1">score</span>
                    <span className="label-xs mt-0.5" style={{ color: `${signalColor}99` }}>/ 20</span>
                  </div>
                </div>

                {/* Signal + confidence */}
                <div className="flex flex-col items-center lg:items-start gap-2">
                  <SignalBadge signal={r.signal} size="lg" />
                  <div
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full"
                    style={{ background: signalColorDim, border: `1px solid ${signalColor}30` }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: signalColor }} />
                    <span className="label-xs" style={{ color: signalColor }}>
                      {r.confidence} CONFIDENCE
                    </span>
                  </div>
                </div>
              </div>

              {/* Center: company + checks summary */}
              <div className="flex-1">
                <div className="mb-1">
                  <span className="label-xs text-slate-600">{symbol}</span>
                </div>
                <h1 className="font-display text-3xl text-white leading-tight mb-1">
                  {r.companyName ?? symbol}
                </h1>

                {/* Checks tally */}
                <div className="flex items-center gap-3 mt-4 mb-5">
                  {[
                    { label: 'PASS', count: greens,  color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.2)' },
                    { label: 'WARN', count: yellows, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.18)' },
                    { label: 'FAIL', count: reds,    color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.16)' },
                  ].map(({ label, count, color, bg, border }) => (
                    <div
                      key={label}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                      style={{ background: bg, border: `1px solid ${border}` }}
                    >
                      <span className="num text-xl font-bold leading-none" style={{ color }}>{count}</span>
                      <span className="label-xs" style={{ color }}>{label}</span>
                    </div>
                  ))}
                </div>

                {/* Check bar */}
                <div className="flex gap-1 mb-5 max-w-xs">
                  {r.checks.map((c, i) => (
                    <span
                      key={i}
                      className="flex-1 h-2 rounded-full"
                      style={{
                        background: c.light === 'GREEN' ? '#10b981' : c.light === 'YELLOW' ? '#f59e0b' : 'rgba(239,68,68,0.4)',
                        boxShadow: c.light === 'GREEN' ? '0 0 6px rgba(16,185,129,0.4)' : 'none',
                      }}
                    />
                  ))}
                </div>

                {/* Quick stats row */}
                {r.overview.priceFormatted && (
                  <div className="flex flex-wrap gap-5">
                    {[
                      { label: 'Price', val: r.overview.priceFormatted },
                      { label: 'Mkt Cap', val: r.overview.marketCapFormatted },
                      { label: 'P/E', val: r.overview.peRatioFormatted },
                      { label: 'EPS', val: r.overview.epsTtmFormatted },
                    ].filter(m => m.val).map(m => (
                      <div key={m.label}>
                        <div className="label-xs text-slate-600 mb-0.5">{m.label}</div>
                        <div className="num text-sm font-bold text-white">{m.val}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: CTA buttons */}
              <div className="flex lg:flex-col gap-2 flex-wrap lg:justify-start">
                <Link href={`/backtest/${symbol}`} className="btn btn-ghost text-[10px]">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  Backtest
                </Link>
                <Link href={`/basic-analyzer/${symbol}`} className="btn btn-ghost text-[10px]">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                  Basic
                </Link>
                <Link href={`/analyzer/${symbol}`} className="btn btn-ghost text-[10px]">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
                  DCF
                </Link>
                <Link href="/dashboard" className="btn btn-gold text-[10px]">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="18 20 18 10"/><polyline points="12 20 12 4"/><polyline points="6 20 6 14"/></svg>
                  Board
                </Link>
                <WatchlistButton symbol={symbol} />
              </div>
            </div>
          </div>

          <ViewTracker symbol={symbol} />
        </div>

        {/* ── Limited data warning ── */}
        {!hasFinancials && (
          <div
            className="flex items-start gap-3 rounded-xl px-5 py-4 animate-fade-up"
            style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div>
              <div className="text-sm font-semibold text-amber-400 mb-0.5">Limited Data Available</div>
              <div className="text-xs text-slate-500 leading-relaxed">Financial statements not available. Price and technical data shown below.</div>
            </div>
          </div>
        )}

        {/* ── SCREENING CHECKS ── */}
        <div
          className="rounded-2xl overflow-hidden animate-fade-up"
          style={{
            background: '#08111f',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
            animationDelay: '0.05s',
          }}
        >
          <div
            className="flex items-center justify-between px-5 py-4"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
          >
            <div className="flex items-center gap-2">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              <span className="label-sm text-slate-300">Screening Checks</span>
            </div>
            <span className="label-xs text-slate-600">{r.checks.length} factors</span>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {r.checks.map((c, i) => (
              <CheckRow key={c.name} check={c} delay={i * 0.04} />
            ))}
          </div>
        </div>

        {/* ── TWO-COL: Overview + Margins ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-fade-up" style={{ animationDelay: '0.10s' }}>
          <SectionCard title="Overview" iconPath="M12 20V10M18 20V4M6 20v-4">
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: 'Price',      val: r.overview.priceFormatted },
                { label: 'Market Cap', val: r.overview.marketCapFormatted },
                { label: 'EPS (TTM)',  val: r.overview.epsTtmFormatted },
                { label: 'P/E Ratio',  val: r.overview.peRatioFormatted },
                { label: 'P/S Ratio',  val: r.overview.priceToSalesFormatted },
                { label: 'Shares',     val: r.overview.sharesOutstandingFormatted },
              ].map(m => <MiniMetric key={m.label} label={m.label} value={m.val} />)}
            </div>
          </SectionCard>

          <SectionCard title="Margins (TTM)" iconPath="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6">
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: 'Gross',     val: r.margins.grossMarginFormatted },
                { label: 'Operating', val: r.margins.operatingMarginFormatted },
                { label: 'Profit',    val: r.margins.profitMarginFormatted },
                { label: 'FCF',       val: r.margins.fcfMarginFormatted },
              ].map(m => <MiniMetric key={m.label} label={m.label} value={m.val} />)}
            </div>
          </SectionCard>
        </div>

        {/* ── REVENUE ── */}
        {r.revenueAnalysis.revenueYears.length > 0 && (
          <div
            className="rounded-2xl overflow-hidden animate-fade-up"
            style={{
              background: '#08111f',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
              animationDelay: '0.14s',
            }}
          >
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
            >
              <div className="flex items-center gap-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
                </svg>
                <span className="label-sm text-slate-300">Revenue</span>
              </div>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-3 gap-2.5 mb-5">
                <MiniMetric label="Revenue (TTM)"    value={r.revenueAnalysis.revenueTtmFormatted} accent />
                <MiniMetric label="Net Income (TTM)" value={r.revenueAnalysis.netIncomeTtmFormatted} />
                <MiniMetric label="YoY Growth"       value={r.revenueAnalysis.revenueGrowthFormatted} />
              </div>
              <RevenueChart years={r.revenueAnalysis.revenueYears} />
            </div>
          </div>
        )}

        {/* ── TWO-COL: Balance Sheet + Technicals ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 animate-fade-up" style={{ animationDelay: '0.18s' }}>
          <SectionCard title="Balance Sheet" iconPath="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z">
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: 'Cash',       val: r.balanceSheet.cashFormatted },
                { label: 'LT Debt',    val: r.balanceSheet.longTermDebtFormatted },
                { label: 'Total Debt', val: r.balanceSheet.totalDebtFormatted },
                { label: 'Cash/Debt',  val: r.balanceSheet.cashToDebtFormatted },
              ].map(m => <MiniMetric key={m.label} label={m.label} value={m.val} />)}
            </div>
          </SectionCard>

          {r.technicals ? (
            <SectionCard title="Technicals" iconPath="M13 2 3 14h9l-1 8 10-12h-9l1-8z">
              <div className="grid grid-cols-1 gap-2.5">
                <MiniMetric label="SMA (50)" value={r.technicals.sma50Formatted} />
                <MiniMetric label="RSI (14)" value={r.technicals.rsi14Formatted} />
                <MiniMetric label="Trend"    value={r.technicals.priceVsSma50} />
              </div>
            </SectionCard>
          ) : <div />}
        </div>

        {/* ── 3-YEAR PROJECTION ── */}
        {r.projection && (
          <div
            className="rounded-2xl overflow-hidden animate-fade-up"
            style={{
              background: '#08111f',
              border: '1px solid rgba(245,158,11,0.18)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 0 30px rgba(245,158,11,0.04)',
              animationDelay: '0.22s',
            }}
          >
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid rgba(245,158,11,0.12)' }}
            >
              <div className="flex items-center gap-2">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
                </svg>
                <span className="label-sm text-slate-300">3-Year Price Projection</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {['Year','Revenue','Net Income','EPS','Est. Price'].map((h, i) => (
                      <th
                        key={h}
                        className={`px-5 py-3 text-[9px] font-semibold text-slate-600 uppercase tracking-[0.1em] whitespace-nowrap ${i > 0 ? 'text-right' : 'text-left'}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {r.projection.years.map((y, i) => (
                    <tr
                      key={y.year}
                      style={{
                        borderBottom: i < r.projection!.years.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        background: i === r.projection!.years.length - 1 ? 'rgba(245,158,11,0.03)' : undefined,
                      }}
                    >
                      <td className="px-5 py-3 text-sm font-semibold text-slate-400">{y.year}</td>
                      <td className="px-5 py-3 text-sm text-right num text-slate-500">{y.revenueFormatted}</td>
                      <td className="px-5 py-3 text-sm text-right num text-slate-500">{y.netIncomeFormatted}</td>
                      <td className="px-5 py-3 text-sm text-right num text-slate-400">{y.epsFormatted}</td>
                      <td className="px-5 py-3 text-sm text-right num font-bold text-amber-300">{y.priceFormatted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Base growth {r.projection.assumptions.baseGrowthFormatted} · decay {r.projection.assumptions.decayFormatted}/yr ·
                margin {r.projection.assumptions.marginFormatted} · P/E {r.projection.assumptions.peFormatted}
              </p>
            </div>
          </div>
        )}

        <div className="pt-2">
          <Footer />
        </div>
      </div>
    </div>
  )
}

/* ── Check row card ── */
function CheckRow({ check, delay }: { check: CheckResult; delay: number }) {
  const cfg = {
    GREEN:  { icon: 'M20 6 9 17l-5-5', color: '#10b981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.18)' },
    YELLOW: { icon: 'M12 9v4M12 17h.01', color: '#f59e0b', bg: 'rgba(245,158,11,0.07)', border: 'rgba(245,158,11,0.18)' },
    RED:    { icon: 'M18 6 6 18M6 6l12 12', color: '#ef4444', bg: 'rgba(239,68,68,0.07)',  border: 'rgba(239,68,68,0.16)' },
  }[check.light]

  return (
    <div
      className="animate-fade-up rounded-xl p-3.5 flex flex-col gap-2"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, animationDelay: `${delay}s` }}
    >
      <div className="flex items-center gap-2">
        <span
          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
          style={{ background: `${cfg.color}20`, boxShadow: `0 0 8px ${cfg.color}30` }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={cfg.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d={cfg.icon}/>
          </svg>
        </span>
        <span className="text-xs font-semibold text-white leading-snug">{check.name}</span>
      </div>
      <p className="text-[11px] text-slate-500 leading-relaxed">{check.detail}</p>
    </div>
  )
}

/* ── Section card wrapper ── */
function SectionCard({ title, iconPath, children }: { title: string; iconPath: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: '#08111f',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      <div
        className="flex items-center gap-2 px-5 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d={iconPath}/>
        </svg>
        <span className="label-sm text-slate-300">{title}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

/* ── Mini metric tile ── */
function MiniMetric({ label, value, accent }: { label: string; value: string | null | undefined; accent?: boolean }) {
  return (
    <div
      className="rounded-lg px-3.5 py-3"
      style={{
        background: accent ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.025)',
        border: `1px solid ${accent ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)'}`,
      }}
    >
      <div className="label-xs text-slate-600 mb-1">{label}</div>
      <div className={`num text-sm font-bold ${accent ? 'text-emerald-300' : 'text-white'}`}>
        {value ?? '—'}
      </div>
    </div>
  )
}

/* ── Parse formatted revenue string → raw number for bar widths ── */
function parseRevenue(formatted: string): number {
  if (!formatted) return 0
  const s = formatted.replace(/[$,\s]/g, '').toUpperCase()
  const match = s.match(/^([\d.]+)([BKMG]?)$/)
  if (!match) return 0
  const n = parseFloat(match[1])
  const suffix = match[2]
  if (suffix === 'B') return n * 1e9
  if (suffix === 'M') return n * 1e6
  if (suffix === 'K') return n * 1e3
  if (suffix === 'G') return n * 1e9
  return n
}

/* ── Revenue bar chart (real relative widths) ── */
function RevenueChart({ years }: { years: { fiscalYear: string; revenueFormatted: string }[] }) {
  if (years.length === 0) return null

  const values = years.map(y => parseRevenue(y.revenueFormatted))
  const maxVal  = Math.max(...values, 1)

  return (
    <div className="space-y-2" role="list" aria-label="Annual revenue">
      {years.map((y, i) => {
        const pct     = Math.max(4, (values[i] / maxVal) * 100)
        const isLatest = i === 0
        return (
          <div key={y.fiscalYear} className="flex items-center gap-3" role="listitem">
            <span className="num text-[11px] text-slate-500 w-10 shrink-0 text-right">{y.fiscalYear}</span>
            <div
              className="flex-1 h-5 rounded-md overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.03)' }}
              aria-hidden="true"
            >
              <div
                className="h-full rounded-md animate-slide-right"
                style={{
                  width: `${pct}%`,
                  background: isLatest
                    ? 'linear-gradient(90deg, rgba(16,185,129,0.5), rgba(16,185,129,0.25))'
                    : 'linear-gradient(90deg, rgba(16,185,129,0.28), rgba(16,185,129,0.12))',
                  animationDelay: `${i * 0.07}s`,
                }}
              />
            </div>
            <span className="num text-xs font-semibold text-white w-20 shrink-0">{y.revenueFormatted}</span>
          </div>
        )
      })}
    </div>
  )
}
