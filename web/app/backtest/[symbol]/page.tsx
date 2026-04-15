import { notFound } from 'next/navigation'
import { api } from '@/lib/api'
import Navbar from '../../components/Navbar'
import Card from '../../components/Card'
import Footer from '../../components/Footer'
import EquityChart from './EquityChart'

export const revalidate = 60

interface Props { params: { symbol: string } }

const IconActivity = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
)
const IconList = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
    <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
)
const IconDollar = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
  </svg>
)

export default async function BacktestPage({ params }: Props) {
  const symbol = params.symbol.toUpperCase()
  const r = await api.backtest(symbol).catch(() => null)
  if (!r) notFound()

  const noTrades = r.totalTrades === 0
  const outperformed = r.outperformance >= 0

  const badgeStyle = noTrades
    ? { bg: 'rgba(255,255,255,0.06)', text: '#94a3b8', border: 'rgba(255,255,255,0.1)' }
    : outperformed
    ? { bg: 'rgba(16,185,129,0.10)', text: '#34d399', border: 'rgba(16,185,129,0.25)' }
    : { bg: 'rgba(239,68,68,0.10)', text: '#f87171', border: 'rgba(239,68,68,0.22)' }

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
    { label: 'Initial',   value: `$${r.initialInvestment.toLocaleString()}` },
    { label: 'Trades',    value: String(r.totalTrades) },
    { label: 'Win / Loss', value: `${r.winningTrades}W / ${r.losingTrades}L` },
    { label: 'Win Rate',  value: r.winRateFormatted ?? '—' },
  ]

  return (
    <div className="min-h-screen relative z-10">
      <Navbar symbol={symbol} />

      <div className="max-w-5xl mx-auto px-5 py-8 space-y-4">

        {/* ── Hero ── */}
        <div
          className="relative overflow-hidden rounded-2xl text-center px-6 py-12 animate-fade-up"
          style={{
            background: 'linear-gradient(180deg, #0d1628 0%, #0a1221 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
          }}
        >
          <div
            className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] opacity-15"
            style={{
              background: outperformed
                ? 'radial-gradient(ellipse, rgba(16,185,129,0.35) 0%, transparent 65%)'
                : 'radial-gradient(ellipse, rgba(239,68,68,0.25) 0%, transparent 65%)',
            }}
          />
          <div className="relative z-10">
            <div
              className="inline-block font-mono text-[10px] font-bold tracking-[0.15em] uppercase mb-2 px-3 py-1 rounded-full"
              style={{ background: 'rgba(255,255,255,0.04)', color: '#64748b', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              {symbol} · 5-Year Backtest
            </div>
            <h1 className="text-2xl font-display text-white mt-1">{r.companyName ?? symbol}</h1>
            <div className="text-xs text-smoke font-mono mt-1.5">{r.periodStart} → {r.periodEnd}</div>

            <div
              className="inline-block mt-5 px-8 py-3 rounded-xl font-mono text-lg font-bold tracking-wider"
              style={{ background: badgeStyle.bg, color: badgeStyle.text, border: `1px solid ${badgeStyle.border}` }}
            >
              {badgeText}
            </div>
            <div className="text-xs text-smoke mt-2 font-mono">
              {noTrades
                ? 'All signals were HOLD — capital stayed in cash'
                : `${r.totalTrades} trade${r.totalTrades > 1 ? 's' : ''} executed`}
            </div>
          </div>
        </div>

        {/* ── KPI cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-up" style={{ animationDelay: '0.06s' }}>
          {kpis.map(k => (
            <div
              key={k.label}
              className="rounded-xl p-5 text-center"
              style={{
                background: '#0a1221',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
              }}
            >
              <div className="text-[9px] font-semibold text-smoke uppercase tracking-[0.1em] mb-2">{k.label}</div>
              <div
                className="font-mono text-2xl font-bold tabular-nums"
                style={{ color: k.positive ? '#34d399' : '#f87171' }}
              >
                {k.value}
              </div>
            </div>
          ))}
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-up" style={{ animationDelay: '0.09s' }}>
          {stats.map(s => (
            <div
              key={s.label}
              className="rounded-xl p-4 text-center"
              style={{
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <div className="text-[9px] font-semibold text-smoke uppercase tracking-[0.1em] mb-1.5">{s.label}</div>
              <div className="font-mono text-base font-bold text-white tabular-nums">{s.value}</div>
            </div>
          ))}
        </div>

        {/* ── Equity Curve ── */}
        <Card title="Equity Curve" icon={<IconActivity />} badge={`$${r.initialInvestment.toLocaleString()} invested`} accent="green">
          <EquityChart data={r.equityCurve} />
        </Card>

        {/* ── Signal History ── */}
        <Card title="Signal History" icon={<IconList />} badge={`${r.signalHistory.length} evaluations`}>
          {r.signalHistory.length === 0 ? (
            <p className="text-center text-smoke py-10 text-sm">No signal evaluations during this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Date','Price','Change','Signal','Action'].map((h, i) => (
                      <th
                        key={h}
                        className={`pb-2.5 text-[9px] font-semibold text-smoke uppercase tracking-[0.1em] ${
                          i > 1 ? 'text-center' : i === 1 ? 'text-right' : 'text-left'
                        }`}
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
                        style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.02)' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}
                      >
                        <td className="py-2.5 font-mono text-xs text-fog">{s.date}</td>
                        <td className="py-2.5 font-mono text-xs text-right font-semibold text-white">{s.priceFormatted}</td>
                        <td className="py-2.5 text-center">
                          {s.priceChangePctFormatted ? (
                            <span
                              className="inline-block px-2 py-0.5 rounded font-mono text-xs font-bold"
                              style={{
                                background: positive ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                                color: positive ? '#34d399' : '#f87171',
                              }}
                            >
                              {positive ? '▲' : '▼'} {s.priceChangePctFormatted}
                            </span>
                          ) : <span className="text-smoke">—</span>}
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
          <Card title="Trade Log" icon={<IconDollar />} badge={`${r.trades.length} trade${r.trades.length > 1 ? 's' : ''}`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['Action','Date','Price','Return'].map((h, i) => (
                      <th
                        key={h}
                        className={`pb-2.5 text-[9px] font-semibold text-smoke uppercase tracking-[0.1em] ${
                          i > 1 ? 'text-right' : i === 0 ? 'text-center' : 'text-left'
                        }`}
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
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td className="py-2.5 text-center">
                          <span
                            className="tag font-mono"
                            style={{
                              background: t.type === 'BUY' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                              color: t.type === 'BUY' ? '#34d399' : '#f87171',
                              border: `1px solid ${t.type === 'BUY' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                            }}
                          >
                            {t.type}
                          </span>
                        </td>
                        <td className="py-2.5 font-mono text-xs text-fog">{t.date}</td>
                        <td className="py-2.5 text-right font-mono text-sm font-semibold text-white">{t.priceFormatted}</td>
                        <td className="py-2.5 text-right">
                          {t.tradeReturnFormatted ? (
                            <span
                              className="px-2 py-0.5 rounded font-mono text-xs font-bold"
                              style={{
                                background: positive ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                                color: positive ? '#34d399' : '#f87171',
                              }}
                            >
                              {positive ? '▲' : '▼'} {t.tradeReturnFormatted}
                            </span>
                          ) : <span className="font-mono text-xs text-smoke">Entry</span>}
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
          className="rounded-xl px-5 py-4 text-xs text-fog leading-relaxed"
          style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.12)' }}
        >
          <span className="font-semibold text-amber-500">Disclaimer: </span>
          Educational purposes only. Past performance does not guarantee future results. Simulation assumes instant execution at closing prices with no slippage or commissions.
        </div>

        <Footer />
      </div>
    </div>
  )
}

function SignalTag({ signal }: { signal: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    BUY:  { bg: 'rgba(16,185,129,0.08)',  color: '#34d399' },
    SELL: { bg: 'rgba(239,68,68,0.08)',   color: '#f87171' },
    HOLD: { bg: 'rgba(245,158,11,0.08)',  color: '#fbbf24' },
  }
  const s = map[signal] ?? { bg: 'rgba(255,255,255,0.04)', color: '#64748b' }
  return (
    <span
      className="tag font-mono"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.color}33` }}
    >
      {signal}
    </span>
  )
}

function ActionTag({ action }: { action: string }) {
  const color = action.startsWith('BUY') ? '#34d399' : action.startsWith('SELL') ? '#f87171' : '#64748b'
  return <span className="font-mono text-xs font-semibold" style={{ color }}>{action}</span>
}
