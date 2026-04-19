import { notFound } from 'next/navigation'
import { api } from '@/lib/api'
import Navbar from '../../components/Navbar'
import Card from '../../components/Card'
import Footer from '../../components/Footer'
import EquityChart from './EquityChart'
import RefreshButton from '../../components/RefreshButton'

export const revalidate = 60

interface Props { params: { symbol: string } }

export default async function BacktestPage({ params }: Props) {
  const symbol = params.symbol.toUpperCase()
  let r = null
  let backendError = false
  try {
    r = await api.backtest(symbol)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    // 404 means ticker not found; 5xx means backend error
    if (msg.includes('404') || msg.includes('Not Found')) {
      notFound()
    }
    backendError = true
  }

  // Show graceful error card for 500s
  if (backendError || !r) {
    return (
      <div className="min-h-screen relative z-10">
        <Navbar symbol={symbol} />
        <div className="max-w-5xl mx-auto px-5 py-8">
          <div
            className="rounded-xl overflow-hidden animate-fade-up"
            style={{ background: '#FFFFFF', border: '1px solid rgba(217,119,6,0.2)', boxShadow: '0 1px 4px rgba(13,13,11,0.04)' }}
          >
            <div className="h-[3px]" style={{ background: '#D97706' }} />
            <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.2)' }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div>
                <h1 className="font-display font-bold text-xl mb-2" style={{ color: '#0D0D0B', letterSpacing: '-0.01em' }}>
                  Backtest Temporarily Unavailable
                </h1>
                <p className="text-sm leading-relaxed max-w-md" style={{ color: '#6A6A68' }}>
                  The backtest engine couldn&apos;t process {symbol} right now. This is usually a temporary data provider issue — try again in a few minutes.
                </p>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <a
                  href={`/view/${symbol}`}
                  className="btn btn-primary text-[11px]"
                >
                  View {symbol} Analysis
                </a>
                <a
                  href={`/backtest/${symbol}`}
                  className="btn btn-ghost text-[11px]"
                >
                  Try Again
                </a>
              </div>
              <p className="label-xs mt-2" style={{ color: '#C0C0BE' }}>
                Error: backtest data unavailable for {symbol}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const noTrades    = r.totalTrades === 0
  const outperformed = r.outperformance >= 0

  const resultColor  = noTrades ? '#6A6A68' : outperformed ? '#047857' : '#B91C1C'
  const resultBg     = noTrades ? 'rgba(13,13,11,0.05)' : outperformed ? 'rgba(5,150,105,0.08)' : 'rgba(220,38,38,0.08)'
  const resultBorder = noTrades ? 'rgba(13,13,11,0.12)' : outperformed ? 'rgba(5,150,105,0.2)' : 'rgba(220,38,38,0.2)'

  const badgeText = noTrades
    ? 'NO TRADES'
    : outperformed
    ? `OUTPERFORMED +${r.outperformanceFormatted}`
    : `UNDERPERFORMED ${r.outperformanceFormatted}`

  const kpis = [
    { label: 'Strategy Return', value: r.strategyReturnFormatted,   positive: r.strategyReturn >= 0 },
    { label: 'Buy & Hold',      value: r.buyAndHoldReturnFormatted, positive: r.buyAndHoldReturn >= 0 },
    { label: 'Strategy Final',  value: r.strategyFinalFormatted,    positive: r.strategyReturn >= 0 },
    { label: 'B&H Final',       value: r.buyAndHoldFinalFormatted,  positive: true },
  ]

  const stats = [
    { label: 'Initial',    value: `$${r.initialInvestment.toLocaleString()}` },
    { label: 'Trades',     value: String(r.totalTrades) },
    { label: 'Win / Loss', value: `${r.winningTrades}W / ${r.losingTrades}L` },
    { label: 'Win Rate',   value: r.winRateFormatted ?? '—' },
  ]

  return (
    <div className="min-h-screen relative z-10">
      <Navbar symbol={symbol} />

      <div className="max-w-5xl mx-auto px-5 py-8 space-y-4">

        {/* ── Hero ── */}
        <div
          className="relative overflow-hidden rounded-xl animate-fade-up"
          style={{
            background: '#FFFFFF',
            border: `1px solid ${resultBorder}`,
            boxShadow: '0 1px 4px rgba(13,13,11,0.04)',
          }}
        >
          <div className="h-[3px]" style={{ background: outperformed ? '#059669' : noTrades ? '#9A9A98' : '#DC2626' }} />
          <div className="px-6 py-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
              <div>
                <div className="label-xs mb-1.5" style={{ color: '#9A9A98' }}>{symbol} · 5-Year Backtest</div>
                <h1
                  className="font-display font-bold text-2xl leading-tight"
                  style={{ color: '#0D0D0B', letterSpacing: '-0.02em' }}
                >
                  {r.companyName ?? symbol}
                </h1>
                <div className="num text-xs mt-1" style={{ color: '#9A9A98' }}>{r.periodStart} → {r.periodEnd}</div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div
                  className="num px-6 py-3 rounded-lg text-base font-bold tracking-wider"
                  style={{ background: resultBg, color: resultColor, border: `1px solid ${resultBorder}` }}
                >
                  {badgeText}
                </div>
                <div className="num text-xs text-center" style={{ color: '#9A9A98' }}>
                  {noTrades
                    ? 'All signals were HOLD'
                    : `${r.totalTrades} trade${r.totalTrades > 1 ? 's' : ''} executed`}
                </div>
                <RefreshButton symbol={symbol} />
              </div>
            </div>
          </div>
        </div>

        {/* ── KPI cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 animate-fade-up" style={{ animationDelay: '0.06s' }}>
          {kpis.map(k => (
            <div
              key={k.label}
              className="rounded-lg p-4 text-center"
              style={{
                background: '#FFFFFF',
                border: '1px solid rgba(13,13,11,0.09)',
                boxShadow: '0 1px 3px rgba(13,13,11,0.04)',
              }}
            >
              <div className="label-xs mb-2" style={{ color: '#9A9A98' }}>{k.label}</div>
              <div
                className="num text-2xl font-bold tabular-nums"
                style={{ color: k.positive ? '#047857' : '#B91C1C' }}
              >
                {k.value}
              </div>
            </div>
          ))}
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 animate-fade-up" style={{ animationDelay: '0.09s' }}>
          {stats.map(s => (
            <div
              key={s.label}
              className="rounded-lg p-4 text-center"
              style={{
                background: 'rgba(13,13,11,0.03)',
                border: '1px solid rgba(13,13,11,0.07)',
              }}
            >
              <div className="label-xs mb-1.5" style={{ color: '#9A9A98' }}>{s.label}</div>
              <div className="num text-base font-bold tabular-nums" style={{ color: '#0D0D0B' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* ── Equity Curve ── */}
        <Card title="Equity Curve" badge={`$${r.initialInvestment.toLocaleString()} invested`} accent="green">
          <EquityChart data={r.equityCurve} />
        </Card>

        {/* ── Signal History ── */}
        <Card title="Signal History" badge={`${r.signalHistory.length} evaluations`}>
          {r.signalHistory.length === 0 ? (
            <p className="text-center py-10 text-sm" style={{ color: '#9A9A98' }}>No signal evaluations during this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(13,13,11,0.07)' }}>
                    {['Date','Price','Change','Signal','Action'].map((h, i) => (
                      <th
                        key={h}
                        className={`pb-2.5 text-[9px] font-bold uppercase tracking-[0.1em] ${i > 1 ? 'text-center' : i === 1 ? 'text-right' : 'text-left'}`}
                        style={{ color: '#9A9A98', fontFamily: 'var(--font-mono)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {r.signalHistory.map((s, i) => {
                    const positive = (s.priceChange ?? 0) >= 0
                    return (
                      <tr
                        key={i}
                        style={{ borderBottom: '1px solid rgba(13,13,11,0.04)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(13,13,11,0.02)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}
                      >
                        <td className="py-2.5 num text-xs" style={{ color: '#6A6A68' }}>{s.date}</td>
                        <td className="py-2.5 num text-xs text-right font-semibold" style={{ color: '#0D0D0B' }}>{s.priceFormatted}</td>
                        <td className="py-2.5 text-center">
                          {s.priceChangePctFormatted ? (
                            <span
                              className="inline-block px-2 py-0.5 rounded num text-xs font-bold"
                              style={{
                                background: positive ? 'rgba(5,150,105,0.08)'  : 'rgba(220,38,38,0.08)',
                                color:      positive ? '#047857'               : '#B91C1C',
                              }}
                            >
                              {positive ? '▲' : '▼'} {s.priceChangePctFormatted}
                            </span>
                          ) : <span style={{ color: '#B0B0AE' }}>—</span>}
                        </td>
                        <td className="py-2.5 text-center">
                          <SignalTag signal={s.signal} />
                        </td>
                        <td className="py-2.5 text-center">
                          <ActionTag action={s.action} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* ── Trade Log ── */}
        {r.trades.length > 0 && (
          <Card title="Trade Log" badge={`${r.trades.length} trade${r.trades.length > 1 ? 's' : ''}`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(13,13,11,0.07)' }}>
                    {['Action','Date','Price','Return'].map((h, i) => (
                      <th
                        key={h}
                        className={`pb-2.5 text-[9px] font-bold uppercase tracking-[0.1em] ${i > 1 ? 'text-right' : i === 0 ? 'text-center' : 'text-left'}`}
                        style={{ color: '#9A9A98', fontFamily: 'var(--font-mono)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {r.trades.map((t, i) => {
                    const positive = (t.tradeReturn ?? 0) >= 0
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(13,13,11,0.04)' }}>
                        <td className="py-2.5 text-center">
                          <span
                            className="tag"
                            style={{
                              background: t.type === 'BUY' ? 'rgba(5,150,105,0.09)' : 'rgba(220,38,38,0.09)',
                              color:      t.type === 'BUY' ? '#047857'              : '#B91C1C',
                              borderColor:t.type === 'BUY' ? 'rgba(5,150,105,0.22)' : 'rgba(220,38,38,0.22)',
                            }}
                          >
                            {t.type}
                          </span>
                        </td>
                        <td className="py-2.5 num text-xs" style={{ color: '#6A6A68' }}>{t.date}</td>
                        <td className="py-2.5 text-right num text-sm font-semibold" style={{ color: '#0D0D0B' }}>{t.priceFormatted}</td>
                        <td className="py-2.5 text-right">
                          {t.tradeReturnFormatted ? (
                            <span
                              className="px-2 py-0.5 rounded num text-xs font-bold"
                              style={{
                                background: positive ? 'rgba(5,150,105,0.08)'  : 'rgba(220,38,38,0.08)',
                                color:      positive ? '#047857'               : '#B91C1C',
                              }}
                            >
                              {positive ? '▲' : '▼'} {t.tradeReturnFormatted}
                            </span>
                          ) : <span className="num text-xs" style={{ color: '#9A9A98' }}>Entry</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* ── Disclaimer ── */}
        <div
          className="rounded-lg px-5 py-4 text-xs leading-relaxed"
          style={{ background: 'rgba(13,13,11,0.03)', border: '1px solid rgba(13,13,11,0.08)' }}
        >
          <span className="font-bold" style={{ color: '#6A6A68' }}>Disclaimer: </span>
          <span style={{ color: '#9A9A98' }}>Educational purposes only. Past performance does not guarantee future results. Simulation assumes instant execution at closing prices with no slippage or commissions.</span>
        </div>

        <Footer />
      </div>
    </div>
  )
}

function SignalTag({ signal }: { signal: string }) {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    BUY:  { bg: 'rgba(5,150,105,0.09)',  color: '#047857', border: 'rgba(5,150,105,0.22)' },
    SELL: { bg: 'rgba(220,38,38,0.09)',  color: '#B91C1C', border: 'rgba(220,38,38,0.22)' },
    HOLD: { bg: 'rgba(217,119,6,0.09)', color: '#B45309', border: 'rgba(217,119,6,0.22)' },
  }
  const s = map[signal] ?? { bg: 'rgba(13,13,11,0.05)', color: '#9A9A98', border: 'rgba(13,13,11,0.1)' }
  return (
    <span
      className="tag"
      style={{ background: s.bg, color: s.color, borderColor: s.border }}
    >
      {signal}
    </span>
  )
}

function ActionTag({ action }: { action: string }) {
  const color =
    action.startsWith('BUY')  ? '#047857' :
    action.startsWith('SELL') ? '#B91C1C' :
    '#9A9A98'
  return <span className="num text-xs font-semibold" style={{ color }}>{action}</span>
}
