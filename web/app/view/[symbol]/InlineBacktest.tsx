import type { BacktestResult } from '@/lib/types'
import EquityChart from '@/app/backtest/[symbol]/EquityChart'

interface Props {
  symbol: string
  data:   BacktestResult | null
}

export default function InlineBacktest({ symbol, data }: Props) {
  if (!data) {
    return (
      <div
        className="rounded-xl overflow-hidden animate-fade-up"
        style={{
          background:  '#FFFFFF',
          border:      '1px solid rgba(217,119,6,0.18)',
          boxShadow:   '0 1px 4px rgba(13,13,11,0.04)',
        }}
      >
        <div className="h-[2px]" style={{ background: '#D97706' }} />
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid rgba(13,13,11,0.07)' }}>
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#0D0D0B', fontFamily: 'var(--font-display)' }}>
            5-Year Backtest
          </span>
        </div>
        <div className="px-5 py-6 text-center">
          <p className="text-sm" style={{ color: '#9A9A98' }}>Backtest data temporarily unavailable for {symbol}.</p>
        </div>
      </div>
    )
  }

  const noTrades      = data.totalTrades === 0
  const outperformed  = data.outperformance >= 0
  const resultColor   = noTrades ? '#6A6A68'  : outperformed ? '#047857' : '#B91C1C'
  const resultBg      = noTrades ? 'rgba(13,13,11,0.05)' : outperformed ? 'rgba(5,150,105,0.08)' : 'rgba(220,38,38,0.08)'
  const resultBorder  = noTrades ? 'rgba(13,13,11,0.12)' : outperformed ? 'rgba(5,150,105,0.2)'  : 'rgba(220,38,38,0.2)'

  const badgeText = noTrades
    ? 'NO TRADES'
    : outperformed
    ? `OUTPERFORMED +${data.outperformanceFormatted}`
    : `UNDERPERFORMED ${data.outperformanceFormatted}`

  return (
    <div
      className="rounded-xl overflow-hidden animate-fade-up"
      style={{
        background: '#FFFFFF',
        border:     `1px solid ${resultBorder}`,
        boxShadow:  '0 1px 4px rgba(13,13,11,0.04)',
      }}
    >
      {/* Accent top */}
      <div className="h-[2px]" style={{ background: outperformed ? '#059669' : noTrades ? '#9A9A98' : '#DC2626' }} />

      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3.5"
        style={{ borderBottom: '1px solid rgba(13,13,11,0.07)' }}
      >
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#0D0D0B', fontFamily: 'var(--font-display)' }}>
          5-Year Backtest
        </span>
        <div
          className="num text-[10px] font-bold tracking-wide px-3 py-1 rounded"
          style={{ background: resultBg, color: resultColor, border: `1px solid ${resultBorder}` }}
        >
          {badgeText}
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* KPI grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { label: 'Strategy Return', value: data.strategyReturnFormatted,   positive: data.strategyReturn >= 0 },
            { label: 'Buy & Hold',      value: data.buyAndHoldReturnFormatted, positive: data.buyAndHoldReturn >= 0 },
            { label: 'Strategy Final',  value: data.strategyFinalFormatted,    positive: data.strategyReturn >= 0 },
            { label: 'B&H Final',       value: data.buyAndHoldFinalFormatted,  positive: true },
          ].map(k => (
            <div
              key={k.label}
              className="rounded-lg p-4 text-center"
              style={{
                background: '#FFFFFF',
                border:     '1px solid rgba(13,13,11,0.09)',
                boxShadow:  '0 1px 3px rgba(13,13,11,0.04)',
              }}
            >
              <div className="label-xs mb-2" style={{ color: '#9A9A98' }}>{k.label}</div>
              <div
                className="num text-xl font-bold tabular-nums"
                style={{ color: k.positive ? '#047857' : '#B91C1C' }}
              >
                {k.value}
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { label: 'Initial',    value: `$${data.initialInvestment.toLocaleString()}` },
            { label: 'Trades',     value: String(data.totalTrades) },
            { label: 'Win / Loss', value: `${data.winningTrades}W / ${data.losingTrades}L` },
            { label: 'Win Rate',   value: data.winRateFormatted ?? '—' },
          ].map(s => (
            <div
              key={s.label}
              className="rounded-lg p-4 text-center"
              style={{ background: 'rgba(13,13,11,0.03)', border: '1px solid rgba(13,13,11,0.07)' }}
            >
              <div className="label-xs mb-1.5" style={{ color: '#9A9A98' }}>{s.label}</div>
              <div className="num text-base font-bold tabular-nums" style={{ color: '#0D0D0B' }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Equity chart */}
        {data.equityCurve.length > 0 && (
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(13,13,11,0.07)' }}
          >
            <div className="px-5 py-3" style={{ borderBottom: '1px solid rgba(13,13,11,0.06)' }}>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#9A9A98', fontFamily: 'var(--font-display)' }}>
                Equity Curve · ${data.initialInvestment.toLocaleString()} invested
              </span>
            </div>
            <div className="p-5">
              <EquityChart data={data.equityCurve} />
            </div>
          </div>
        )}

        {/* Signal history — abbreviated (last 8) */}
        {data.signalHistory.length > 0 && (
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid rgba(13,13,11,0.07)' }}
          >
            <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(13,13,11,0.06)' }}>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#9A9A98', fontFamily: 'var(--font-display)' }}>
                Signal History
              </span>
              <span className="label-xs" style={{ color: '#B0B0AE' }}>{data.signalHistory.length} evaluations</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(13,13,11,0.06)' }}>
                    {['Date','Price','Signal','Action'].map((h, i) => (
                      <th
                        key={h}
                        className={`px-4 py-2.5 text-[9px] font-bold uppercase tracking-[0.1em] ${i > 1 ? 'text-center' : i === 1 ? 'text-right' : 'text-left'}`}
                        style={{ color: '#9A9A98', fontFamily: 'var(--font-mono)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.signalHistory.slice(-8).map((s, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(13,13,11,0.04)' }}>
                      <td className="px-4 py-2 num text-xs" style={{ color: '#6A6A68' }}>{s.date}</td>
                      <td className="px-4 py-2 num text-xs text-right font-semibold" style={{ color: '#0D0D0B' }}>{s.priceFormatted}</td>
                      <td className="px-4 py-2 text-center">
                        <SignalTag signal={s.signal} />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <ActionTag action={s.action} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-[10px] leading-relaxed" style={{ color: '#C0C0BE' }}>
          Educational purposes only. Past performance does not guarantee future results. Simulation assumes instant execution at closing prices with no slippage or commissions.
        </p>
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
