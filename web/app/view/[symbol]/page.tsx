import { notFound } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import Navbar from '../../components/Navbar'
import SignalBadge from '../../components/SignalBadge'
import CheckCard from '../../components/CheckCard'
import CheckPill from '../../components/CheckPill'
import MetricCard from '../../components/MetricCard'
import Card from '../../components/Card'
import Footer from '../../components/Footer'
import WatchlistButton from '../../components/WatchlistButton'
import ViewTracker from '../../components/ViewTracker'

export const revalidate = 60

interface Props { params: { symbol: string } }

// Inline SVG icons
const IconActivity = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
)
const IconTrendingUp = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
)
const IconDollar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
)
const IconShield = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)
const IconTarget = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
)
const IconZap = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)

export default async function ScreenerPage({ params }: Props) {
  const symbol = params.symbol.toUpperCase()
  const r = await api.screener(symbol).catch(() => null)
  if (!r) notFound()

  const hasFinancials = r.margins.grossMargin != null || r.revenueAnalysis.revenueTtm != null

  return (
    <div className="min-h-screen relative z-10">
      <Navbar symbol={symbol} />

      <div className="max-w-4xl mx-auto px-5 py-8 space-y-4">

        {/* ── Hero ── */}
        <div
          className="relative overflow-hidden rounded-2xl text-center px-6 py-14 animate-fade-up"
          style={{
            background: 'linear-gradient(180deg, #0d1628 0%, #0a1221 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          {/* Ambient glow behind signal */}
          <div
            className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[300px] opacity-20"
            style={{
              background: r.signal === 'BUY'
                ? 'radial-gradient(ellipse, rgba(16,185,129,0.4) 0%, transparent 65%)'
                : r.signal === 'SELL'
                ? 'radial-gradient(ellipse, rgba(239,68,68,0.3) 0%, transparent 65%)'
                : 'radial-gradient(ellipse, rgba(245,158,11,0.3) 0%, transparent 65%)',
            }}
          />

          <div className="relative z-10">
            <div
              className="inline-block font-mono text-[10px] font-bold tracking-[0.15em] uppercase mb-2 px-3 py-1 rounded-full"
              style={{ background: 'rgba(255,255,255,0.04)', color: '#64748b', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              {symbol}
            </div>
            <h1 className="text-3xl font-display text-white mt-1">{r.companyName ?? symbol}</h1>

            <div className="mt-6 mb-2">
              <SignalBadge signal={r.signal} size="lg" />
            </div>
            <div className="text-[10px] text-smoke uppercase tracking-[0.15em] font-mono">{r.confidence} confidence</div>

            {/* Check pills */}
            <div className="flex flex-wrap justify-center gap-2 mt-5">
              {r.checks.map(c => <CheckPill key={c.name} check={c} />)}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              <Link href={`/backtest/${symbol}`}        className="btn btn-secondary">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Backtest
              </Link>
              <Link href={`/basic-analyzer/${symbol}`}  className="btn btn-secondary">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                Basic
              </Link>
              <Link href={`/analyzer/${symbol}`}        className="btn btn-secondary">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
                Advanced
              </Link>
              <Link href="/dashboard"                   className="btn btn-gold">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 20 18 10"/><polyline points="12 20 12 4"/><polyline points="6 20 6 14"/></svg>
                Leaderboard
              </Link>
              <WatchlistButton symbol={symbol} />
            </div>
            <ViewTracker symbol={symbol} />
          </div>
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
              <div className="text-xs text-fog leading-relaxed">Financial statements are not available for this ticker. Price and technical indicator data is shown below.</div>
            </div>
          </div>
        )}

        {/* ── Screening Checks ── */}
        <Card title="Screening Checks" icon={<IconActivity />} accent="green">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {r.checks.map(c => <CheckCard key={c.name} check={c} />)}
          </div>
        </Card>

        {/* ── Overview ── */}
        <Card title="Overview" icon={<IconTrendingUp />}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <MetricCard label="Price"       value={r.overview.priceFormatted} />
            <MetricCard label="Market Cap"  value={r.overview.marketCapFormatted} />
            <MetricCard label="EPS (TTM)"   value={r.overview.epsTtmFormatted} />
            <MetricCard label="P/E Ratio"   value={r.overview.peRatioFormatted} />
            <MetricCard label="P/S Ratio"   value={r.overview.priceToSalesFormatted} />
            <MetricCard label="Shares Out"  value={r.overview.sharesOutstandingFormatted} />
          </div>
        </Card>

        {/* ── Margins ── */}
        <Card title="Margins (TTM)" icon={<IconDollar />} accent="blue">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <MetricCard label="Gross Margin"     value={r.margins.grossMarginFormatted} />
            <MetricCard label="Operating Margin" value={r.margins.operatingMarginFormatted} />
            <MetricCard label="Profit Margin"    value={r.margins.profitMarginFormatted} />
            <MetricCard label="FCF Margin"       value={r.margins.fcfMarginFormatted} />
          </div>
        </Card>

        {/* ── Revenue ── */}
        <Card title="Revenue" icon={<IconTrendingUp />}>
          <div className="grid grid-cols-3 gap-2.5 mb-5">
            <MetricCard label="Revenue (TTM)"   value={r.revenueAnalysis.revenueTtmFormatted} />
            <MetricCard label="Net Income (TTM)" value={r.revenueAnalysis.netIncomeTtmFormatted} />
            <MetricCard label="YoY Growth"       value={r.revenueAnalysis.revenueGrowthFormatted} />
          </div>
          {r.revenueAnalysis.revenueYears.length > 0 && (
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <th className="pb-2.5 text-left text-[9px] font-semibold text-smoke uppercase tracking-[0.1em]">Fiscal Year</th>
                  <th className="pb-2.5 text-right text-[9px] font-semibold text-smoke uppercase tracking-[0.1em]">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {r.revenueAnalysis.revenueYears.map(y => (
                  <tr key={y.fiscalYear} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td className="py-2.5 text-sm text-fog">{y.fiscalYear}</td>
                    <td className="py-2.5 text-sm text-right font-mono font-semibold text-white">{y.revenueFormatted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        {/* ── Balance Sheet ── */}
        <Card title="Balance Sheet" icon={<IconShield />}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <MetricCard label="Cash"           value={r.balanceSheet.cashFormatted} />
            <MetricCard label="Long-term Debt" value={r.balanceSheet.longTermDebtFormatted} />
            <MetricCard label="Total Debt"     value={r.balanceSheet.totalDebtFormatted} />
            <MetricCard label="Cash / Debt"    value={r.balanceSheet.cashToDebtFormatted} />
          </div>
        </Card>

        {/* ── 3-Year Projection ── */}
        {r.projection && (
          <Card title="3-Year Price Projection" icon={<IconTarget />} accent="amber">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Year','Revenue','Net Income','EPS','Est. Price'].map((h, i) => (
                      <th
                        key={h}
                        className={`pb-2.5 text-[9px] font-semibold text-smoke uppercase tracking-[0.1em] ${i > 0 ? 'text-right' : 'text-left'}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {r.projection.years.map(y => (
                    <tr key={y.year} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td className="py-2.5 text-sm text-fog">{y.year}</td>
                      <td className="py-2.5 text-sm text-right font-mono text-fog">{y.revenueFormatted}</td>
                      <td className="py-2.5 text-sm text-right font-mono text-fog">{y.netIncomeFormatted}</td>
                      <td className="py-2.5 text-sm text-right font-mono text-fog">{y.epsFormatted}</td>
                      <td className="py-2.5 text-sm text-right font-mono font-bold text-white">{y.priceFormatted}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div
              className="mt-4 px-4 py-3 rounded-lg text-xs text-fog leading-relaxed"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              <span className="font-semibold text-mist">Assumptions: </span>
              Base growth {r.projection.assumptions.baseGrowthFormatted}, decay {r.projection.assumptions.decayFormatted}/yr,
              profit margin {r.projection.assumptions.marginFormatted}, P/E {r.projection.assumptions.peFormatted}
              <br /><em className="text-smoke">{r.projection.assumptions.note}</em>
            </div>
          </Card>
        )}

        {/* ── Technicals ── */}
        {r.technicals && (
          <Card title="Technicals" icon={<IconZap />}>
            <div className="grid grid-cols-3 gap-2.5">
              <MetricCard label="SMA (50)"  value={r.technicals.sma50Formatted} />
              <MetricCard label="RSI (14)"  value={r.technicals.rsi14Formatted} />
              <MetricCard label="Trend"     value={r.technicals.priceVsSma50} />
            </div>
          </Card>
        )}

        <Footer />
      </div>
    </div>
  )
}
