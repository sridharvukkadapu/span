import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { api } from '@/lib/api'
import Navbar           from '../../components/Navbar'
import SignalBadge      from '../../components/SignalBadge'
import ScoreGauge       from '../../components/ScoreGauge'
import CheckMeter       from '../../components/CheckMeter'
import Footer           from '../../components/Footer'
import WatchlistButton  from '../../components/WatchlistButton'
import ViewTracker      from '../../components/ViewTracker'
import StickyHeader     from './StickyHeader'
import InlineDCF        from './InlineDCF'
import InlineBacktest   from './InlineBacktest'

export const revalidate = 60

interface Props { params: { symbol: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const symbol = params.symbol.toUpperCase()
  const data = await api.screener(symbol).catch(() => null)
  const name = data?.companyName ?? symbol
  const signal = data?.signal ?? ''
  const score = data ? `${data.checks.filter(c => c.light === 'GREEN').length * 2 - data.checks.filter(c => c.light === 'RED').length * 2}` : ''
  return {
    title: `${symbol} Analysis`,
    description: `${name} fundamental analysis. Signal: ${signal}. Score: ${score}/25. Screening, DCF valuation, and 5-year backtest.`,
    openGraph: {
      title: `${symbol} — ${signal} · SPAN`,
      description: `${name} · Score ${score}/25. Fundamental screening, DCF, and backtest.`,
    },
  }
}

export default async function ScreenerPage({ params }: Props) {
  const symbol = params.symbol.toUpperCase()

  const [r, analyzerData, backtestData] = await Promise.all([
    api.screener(symbol).catch(() => null),
    api.analyzer(symbol).catch(() => null),
    api.backtest(symbol).catch(() => null),
  ])

  if (!r) notFound()

  const hasFinancials = r.margins.grossMargin != null || r.revenueAnalysis.revenueTtm != null

  const greens  = r.checks.filter(c => c.light === 'GREEN').length
  const yellows = r.checks.filter(c => c.light === 'YELLOW').length
  const reds    = r.checks.filter(c => c.light === 'RED').length
  const computedScore = (greens * 2) - (reds * 2)

  const signalColor =
    r.signal === 'BUY'  ? '#047857' :
    r.signal === 'SELL' ? '#991B1B' : '#92400E'
  const signalBorder =
    r.signal === 'BUY'  ? 'rgba(4,120,87,0.25)' :
    r.signal === 'SELL' ? 'rgba(153,27,27,0.2)'  : 'rgba(146,64,14,0.2)'
  const signalBg =
    r.signal === 'BUY'  ? '#D1FAE5' :
    r.signal === 'SELL' ? '#FEE2E2'  : '#FEF3C7'

  return (
    <div className="min-h-screen" style={{ background: '#F7F6F2' }}>
      <Navbar symbol={symbol} />

      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-8 space-y-5">

        {/* ── VERDICT HERO ── */}
        <div
          className="relative overflow-hidden rounded-xl animate-fade-up"
          style={{
            background: '#FFFFFF',
            border:     `1px solid ${signalBorder}`,
            boxShadow:  '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
          }}
        >
          <StickyHeader
            symbol={symbol}
            company={r.companyName}
            score={computedScore}
            signal={r.signal}
            price={r.overview.priceFormatted}
          />

          {/* Signal accent bar */}
          <div className="h-[3px] w-full" style={{ background: signalColor }} />

          <div className="p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row gap-8">

              {/* Left: score + signal */}
              <div className="flex flex-col items-center lg:items-start gap-4 lg:w-40 shrink-0">
                <ScoreGauge score={computedScore} signal={r.signal} size="hero" animate />
                <SignalBadge signal={r.signal} size="lg" variant="filled" />
                <div
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full"
                  style={{ background: signalBg, border: `1px solid ${signalBorder}` }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: signalColor }} />
                  <span
                    style={{
                      fontFamily:    'var(--font-sans), Inter, sans-serif',
                      fontSize:      '10px',
                      fontWeight:    500,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color:         signalColor,
                    }}
                  >
                    {r.confidence}
                  </span>
                </div>
              </div>

              {/* Center: info */}
              <div className="flex-1">
                <div
                  className="mb-1"
                  style={{
                    fontFamily:    'var(--font-mono), "JetBrains Mono", monospace',
                    fontSize:      '11px',
                    fontWeight:    500,
                    color:         '#047857',
                    letterSpacing: '0.06em',
                  }}
                >
                  {symbol}
                </div>
                <h1
                  style={{
                    fontFamily:    'var(--font-serif), "Playfair Display", Georgia, serif',
                    fontSize:      'clamp(22px, 3vw, 30px)',
                    fontWeight:    700,
                    color:         '#111827',
                    letterSpacing: '-0.02em',
                    lineHeight:    1.2,
                    marginBottom:  '16px',
                  }}
                >
                  {r.companyName ?? symbol}
                </h1>

                {/* Check tally pills */}
                <div className="flex items-center gap-2.5 mb-4">
                  {[
                    { label: 'Pass', count: greens,  color: '#047857', bg: '#D1FAE5',  border: 'rgba(4,120,87,0.25)'   },
                    { label: 'Warn', count: yellows, color: '#92400E', bg: '#FEF3C7',  border: 'rgba(146,64,14,0.25)' },
                    { label: 'Fail', count: reds,    color: '#991B1B', bg: '#FEE2E2',  border: 'rgba(153,27,27,0.2)'  },
                  ].map(({ label, count, color, bg, border }) => (
                    <div
                      key={label}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                      style={{ background: bg, border: `1px solid ${border}` }}
                    >
                      <span
                        style={{
                          fontFamily:  'var(--font-serif), "Playfair Display", Georgia, serif',
                          fontSize:    '22px',
                          fontWeight:  700,
                          lineHeight:  1,
                          color,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {count}
                      </span>
                      <span
                        style={{
                          fontFamily:    'var(--font-sans), Inter, sans-serif',
                          fontSize:      '10px',
                          fontWeight:    500,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color,
                        }}
                      >
                        {label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Check segment bar */}
                <div className="flex gap-[3px] mb-5 max-w-xs">
                  {r.checks.map((c, i) => (
                    <span
                      key={i}
                      className="flex-1 h-2 rounded-sm"
                      style={{
                        background:
                          c.light === 'GREEN'  ? '#059669' :
                          c.light === 'YELLOW' ? '#D97706' :
                          'rgba(220,38,38,0.35)',
                      }}
                    />
                  ))}
                </div>

                {/* Quick stats */}
                {r.overview.priceFormatted && (
                  <div className="flex flex-wrap gap-5">
                    {[
                      { label: 'Price',   val: r.overview.priceFormatted },
                      { label: 'Mkt Cap', val: r.overview.marketCapFormatted },
                      { label: 'P/E',     val: r.overview.peRatioFormatted },
                      { label: 'EPS',     val: r.overview.epsTtmFormatted },
                    ].filter(m => m.val).map(m => (
                      <div key={m.label}>
                        <div
                          style={{
                            fontFamily:    'var(--font-sans), Inter, sans-serif',
                            fontSize:      '10px',
                            fontWeight:    500,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            color:         '#9CA3AF',
                            marginBottom:  '2px',
                          }}
                        >
                          {m.label}
                        </div>
                        <div
                          style={{
                            fontFamily: 'var(--font-mono), "JetBrains Mono", monospace',
                            fontSize:   '13px',
                            fontWeight: 600,
                            color:      '#111827',
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {m.val}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: actions */}
              <div className="flex lg:flex-col gap-2 flex-wrap lg:justify-start">
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
            style={{ background: '#FEF3C7', border: '1px solid rgba(146,64,14,0.2)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5" aria-hidden="true">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div>
              <div
                className="text-sm font-semibold mb-0.5"
                style={{ color: '#92400E', fontFamily: 'var(--font-sans), Inter, sans-serif' }}
              >
                Limited Data Available
              </div>
              <div
                className="text-xs leading-relaxed"
                style={{ color: '#6B7280', fontFamily: 'var(--font-sans), Inter, sans-serif' }}
              >
                Financial statements not available. Price and technical data shown below.
              </div>
            </div>
          </div>
        )}

        {/* ── SCREENING CHECKS ── */}
        <SectionCard title="Screening Checks" sub={`${r.checks.length} factors`}>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {r.checks.map((c, i) => (
              <CheckMeter key={c.name} check={c} delay={i * 0.04} />
            ))}
          </div>
        </SectionCard>

        {/* ── VALUATION (inline DCF) ── */}
        {analyzerData ? (
          <InlineDCF data={analyzerData} />
        ) : (
          <SectionCard title="DCF Valuation">
            <div
              className="p-5 text-sm"
              style={{ color: '#9CA3AF', fontFamily: 'var(--font-sans), Inter, sans-serif' }}
            >
              Valuation data unavailable for {symbol}.
            </div>
          </SectionCard>
        )}

        {/* ── FINANCIALS ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-up" style={{ animationDelay: '0.10s' }}>
          <SectionCard title="Overview">
            <div className="p-5 grid grid-cols-2 gap-2.5">
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

          <SectionCard title="Margins (TTM)">
            <div className="p-5 grid grid-cols-2 gap-2.5">
              {[
                { label: 'Gross',     val: r.margins.grossMarginFormatted },
                { label: 'Operating', val: r.margins.operatingMarginFormatted },
                { label: 'Profit',    val: r.margins.profitMarginFormatted },
                { label: 'FCF',       val: r.margins.fcfMarginFormatted },
              ].map(m => <MiniMetric key={m.label} label={m.label} value={m.val} />)}
            </div>
          </SectionCard>
        </div>

        {/* ── Revenue ── */}
        {r.revenueAnalysis.revenueYears.length > 0 && (
          <SectionCard title="Revenue">
            <div className="p-5">
              <div className="grid grid-cols-3 gap-2.5 mb-5">
                <MiniMetric label="Revenue (TTM)"    value={r.revenueAnalysis.revenueTtmFormatted} accent />
                <MiniMetric label="Net Income (TTM)" value={r.revenueAnalysis.netIncomeTtmFormatted} />
                <MiniMetric label="YoY Growth"       value={r.revenueAnalysis.revenueGrowthFormatted} />
              </div>
              <RevenueChart years={r.revenueAnalysis.revenueYears} />
            </div>
          </SectionCard>
        )}

        {/* ── Balance Sheet + Technicals ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-up" style={{ animationDelay: '0.18s' }}>
          <SectionCard title="Balance Sheet">
            <div className="p-5 grid grid-cols-2 gap-2.5">
              {[
                { label: 'Cash',       val: r.balanceSheet.cashFormatted },
                { label: 'LT Debt',    val: r.balanceSheet.longTermDebtFormatted },
                { label: 'Total Debt', val: r.balanceSheet.totalDebtFormatted },
                { label: 'Cash/Debt',  val: r.balanceSheet.cashToDebtFormatted },
              ].map(m => <MiniMetric key={m.label} label={m.label} value={m.val} />)}
            </div>
          </SectionCard>

          {r.technicals ? (
            <SectionCard title="Technicals">
              <div className="p-5 grid grid-cols-1 gap-2.5">
                <MiniMetric label="SMA (50)" value={r.technicals.sma50Formatted} />
                <MiniMetric label="RSI (14)" value={r.technicals.rsi14Formatted} />
                <MiniMetric label="Trend"    value={r.technicals.priceVsSma50} />
              </div>
            </SectionCard>
          ) : <div />}
        </div>

        {/* ── 3-Year Projection ── */}
        {r.projection && (
          <SectionCard title="3-Year Price Projection" accent="amber">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    {['Year','Revenue','Net Income','EPS','Est. Price'].map((h, i) => (
                      <th
                        key={h}
                        className={`px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.08em] whitespace-nowrap ${i > 0 ? 'text-right' : 'text-left'}`}
                        style={{
                          color:      '#9CA3AF',
                          fontFamily: 'var(--font-sans), Inter, sans-serif',
                        }}
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
                        borderBottom: i < r.projection!.years.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                        background:   i === r.projection!.years.length - 1 ? 'rgba(146,64,14,0.03)' : undefined,
                      }}
                    >
                      <td className="px-5 py-3 text-sm font-semibold" style={{ color: '#374151', fontFamily: 'var(--font-sans), Inter, sans-serif' }}>{y.year}</td>
                      <td className="px-5 py-3 text-right" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#6B7280' }}>{y.revenueFormatted}</td>
                      <td className="px-5 py-3 text-right" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#6B7280' }}>{y.netIncomeFormatted}</td>
                      <td className="px-5 py-3 text-right font-semibold" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#374151' }}>{y.epsFormatted}</td>
                      <td className="px-5 py-3 text-right font-bold" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#92400E' }}>{y.priceFormatted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
              <p
                className="text-[11px] leading-relaxed"
                style={{ color: '#9CA3AF', fontFamily: 'var(--font-sans), Inter, sans-serif' }}
              >
                Base growth {r.projection.assumptions.baseGrowthFormatted} · decay {r.projection.assumptions.decayFormatted}/yr ·
                margin {r.projection.assumptions.marginFormatted} · P/E {r.projection.assumptions.peFormatted}
              </p>
            </div>
          </SectionCard>
        )}

        {/* ── BACKTEST ── */}
        <InlineBacktest symbol={symbol} data={backtestData} />

        <div className="pt-2">
          <Footer />
        </div>
      </div>
    </div>
  )
}

/* ── Section card wrapper ─────────────────────────────────── */
function SectionCard({
  title, sub, accent, children,
}: {
  title: string; sub?: string; accent?: 'amber'; children: React.ReactNode
}) {
  const accentBorder = accent === 'amber' ? 'rgba(146,64,14,0.2)' : 'rgba(0,0,0,0.07)'
  const accentTop    = accent === 'amber' ? '#D97706' : undefined

  return (
    <div
      className="rounded-xl overflow-hidden animate-fade-up"
      style={{
        background: '#FFFFFF',
        border:     `1px solid ${accentBorder}`,
        boxShadow:  '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      {accentTop && <div className="h-[2px]" style={{ background: accentTop }} />}
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}
      >
        <span
          style={{
            fontFamily:    'var(--font-sans), Inter, sans-serif',
            fontSize:      '11px',
            fontWeight:    600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color:         '#374151',
          }}
        >
          {title}
        </span>
        {sub && (
          <span
            style={{
              fontFamily:    'var(--font-mono), "JetBrains Mono", monospace',
              fontSize:      '10px',
              color:         '#D1D5DB',
            }}
          >
            {sub}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}

/* ── Mini metric tile ─────────────────────────────────────── */
function MiniMetric({ label, value, accent }: { label: string; value: string | null | undefined; accent?: boolean }) {
  return (
    <div
      className="rounded-lg px-3.5 py-3"
      style={{
        background: accent ? 'rgba(4,120,87,0.05)' : 'rgba(0,0,0,0.02)',
        border:     `1px solid ${accent ? 'rgba(4,120,87,0.18)' : 'rgba(0,0,0,0.06)'}`,
      }}
    >
      <div
        style={{
          fontFamily:    'var(--font-sans), Inter, sans-serif',
          fontSize:      '10px',
          fontWeight:    500,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color:         '#9CA3AF',
          marginBottom:  '4px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono), "JetBrains Mono", monospace',
          fontSize:   '13px',
          fontWeight: 600,
          color:      accent ? '#047857' : '#111827',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value ?? '—'}
      </div>
    </div>
  )
}

/* ── Revenue bar chart ─────────────────────────────────────── */
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

function RevenueChart({ years }: { years: { fiscalYear: string; revenueFormatted: string }[] }) {
  if (years.length === 0) return null
  const values = years.map(y => parseRevenue(y.revenueFormatted))
  const maxVal  = Math.max(...values, 1)

  return (
    <div className="space-y-2" role="list" aria-label="Annual revenue">
      {years.map((y, i) => {
        const pct      = Math.max(4, (values[i] / maxVal) * 100)
        const isLatest = i === 0
        return (
          <div key={y.fiscalYear} className="flex items-center gap-3" role="listitem">
            <span
              style={{
                fontFamily:  'var(--font-mono), "JetBrains Mono", monospace',
                fontSize:    '11px',
                width:       '40px',
                textAlign:   'right',
                flexShrink:  0,
                color:       '#9CA3AF',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {y.fiscalYear}
            </span>
            <div
              className="flex-1 h-5 rounded overflow-hidden"
              style={{ background: 'rgba(0,0,0,0.05)' }}
              aria-hidden="true"
            >
              <div
                className="h-full rounded animate-slide-right"
                style={{
                  width:          `${pct}%`,
                  background:     isLatest ? '#047857' : 'rgba(4,120,87,0.3)',
                  animationDelay: `${i * 0.07}s`,
                }}
              />
            </div>
            <span
              style={{
                fontFamily:  'var(--font-mono), "JetBrains Mono", monospace',
                fontSize:    '12px',
                fontWeight:  600,
                width:       '80px',
                flexShrink:  0,
                color:       '#111827',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {y.revenueFormatted}
            </span>
          </div>
        )
      })}
    </div>
  )
}
